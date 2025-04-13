import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { NavigationControl, GeolocateControl, ScaleControl } from 'react-map-gl';
import { Box, Text, Badge, Stack, Flex, useToast, Spinner, Alert, AlertIcon, AlertTitle, Button } from '@chakra-ui/react';
import { FaMapMarkerAlt, FaBuilding, FaHospital, FaShoppingBag, FaUtensils, FaSchool, FaLandmark, FaFileAlt, FaSync } from 'react-icons/fa';
import MapMarker from './MapMarker';
import { propertiesAPI, permitsAPI } from '../services/api';

// Get the token from environment variables and log for debugging
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
console.log('Loaded Mapbox token:', MAPBOX_TOKEN ? 'Token exists' : 'Token missing');

// Default center of Miami
const DEFAULT_LATITUDE = 25.7617;
const DEFAULT_LONGITUDE = -80.1918;
const DEFAULT_ZOOM = 12;

const getMarkerClass = (property) => {
  if (!property) return 'property-marker default';
  
  if (property.hasPermit && property.recentSale) {
    return 'property-marker both';
  } else if (property.hasPermit) {
    return 'property-marker has-permit';
  } else if (property.recentSale) {
    return 'property-marker recent-sale';
  }
  return 'property-marker default';
};

const getPOIIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'hospital':
    case 'medical':
      return <FaHospital />;
    case 'school':
    case 'education':
      return <FaSchool />;
    case 'shopping':
    case 'mall':
    case 'store':
      return <FaShoppingBag />;
    case 'restaurant':
    case 'dining':
      return <FaUtensils />;
    case 'landmark':
    case 'attraction':
      return <FaLandmark />;
    default:
      return <FaBuilding />;
  }
};

const MapComponent = ({
  properties = [],
  pois = [],
  showPOIs = true,
  onBoundsChange,
  onPropertyClick,
  onPoiClick,
  initialViewState,
  loadPropertiesInView = false,
  tooltipFields = ['address', 'city', 'bedrooms', 'bathrooms', 'total_area', 'year_built'],
}) => {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState({
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    zoom: DEFAULT_ZOOM,
    ...initialViewState,
  });

  const [mapProperties, setMapProperties] = useState(properties);
  const [loading, setLoading] = useState(false);
  const [propertyPermits, setPropertyPermits] = useState({});
  const [mapError, setMapError] = useState(null);
  
  const mapRef = useRef(null);
  const toast = useToast();
  
  // Debug tooltip fields changes
  useEffect(() => {
    console.log('MapComponent tooltipFields:', tooltipFields);
  }, [tooltipFields]);
  
  // Update local properties when the passed properties change
  useEffect(() => {
    if (properties && properties.length > 0) {
      setMapProperties(properties);
    }
  }, [properties]);

  // Fetch permits for properties to mark which ones have active permits
  const fetchPropertyPermits = useCallback(async (folioNumbers) => {
    if (!folioNumbers || folioNumbers.length === 0) return;
    
    try {
      const permitsData = {};
      
      // Filter out null or undefined folio numbers
      const validFolios = folioNumbers.filter(folioNumber => 
        folioNumber && folioNumber.toString().trim() !== ''
      );
      
      if (validFolios.length === 0) {
        console.log('No valid folio numbers to process');
        return;
      }
      
      // Process in larger batches for better performance
      const batchSize = 30; // Increased batch size
      console.log(`Processing ${validFolios.length} properties in batches of ${batchSize}`);
      
      let permitCount = 0;
      
      for (let i = 0; i < validFolios.length; i += batchSize) {
        const batch = validFolios.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(validFolios.length/batchSize)}`);
        
        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (folioNumber) => {
            try {
              const response = await permitsAPI.getPermitsByFolio(folioNumber);
              
              if (response && response.data && response.data.length > 0) {
                // Check if there are any active permits
                const allPermits = response.data;
                const activePermits = allPermits.filter(
                  permit => permit.status === 'Active' || 
                           permit.status === 'In Progress' || 
                           permit.status === 'Pending'
                );
                
                const hasPermit = activePermits.length > 0;
                if (hasPermit) permitCount++;
                
                // Store all permit data to use later
                return { 
                  folioNumber, 
                  hasPermit, 
                  permitData: hasPermit ? activePermits[0] : null,
                  allPermits 
                };
              } else {
                return { folioNumber, hasPermit: false, permitData: null, allPermits: [] };
              }
            } catch (error) {
              console.error(`Error fetching permits for folio ${folioNumber}:`, error);
              return { folioNumber, hasPermit: false, permitData: null, allPermits: [] };
            }
          })
        );
        
        // Update permits object with batch results
        batchResults.forEach(result => {
          if (result && result.folioNumber) {
            permitsData[result.folioNumber] = result;
          }
        });
      }
      
      console.log(`Finished processing all permit data. Found ${permitCount} properties with permits.`);
      setPropertyPermits(permitsData);
    } catch (error) {
      console.error('Error fetching property permits:', error);
    }
  }, []);

  // Load properties from the map bounds if enabled
  const loadPropertiesFromBounds = useCallback(async (bounds) => {
    if (!loadPropertiesInView) return;
    
    try {
      setLoading(true);
      
      // Convert bounds to format expected by API
      const boundsArray = [
        bounds.west,
        bounds.south,
        bounds.east,
        bounds.north
      ];
      
      // Request properties within the current bounds - increased limit to 250
      const response = await propertiesAPI.getPropertiesInBounds(boundsArray, 250);
      
      if (response && response.data) {
        console.log(`Loaded ${response.data.length} properties from bounds`);
        
        // Only update if we got meaningful results (prevent flash of empty map)
        if (response.data.length > 0) {
          setMapProperties(response.data);
          
          // Fetch permit data for these properties
          const folioNumbers = response.data
            .filter(prop => prop.folio_number)
            .map(prop => prop.folio_number);
            
          console.log(`Fetching permits for ${folioNumbers.length} properties`);
          if (folioNumbers.length > 0) {
            await fetchPropertyPermits(folioNumbers);
          }
        } else {
          console.log('No properties found in current bounds');
        }
      }
    } catch (error) {
      console.error('Failed to load properties in view:', error);
      toast({
        title: 'Error loading properties',
        description: 'Failed to load properties in the current map view.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [loadPropertiesInView, toast, fetchPropertyPermits]);

  // Handle property click
  const handlePropertyClick = useCallback((property) => {
    if (onPropertyClick) onPropertyClick(property);
  }, [onPropertyClick]);

  // Handle POI click
  const handlePoiClick = useCallback((poi) => {
    if (onPoiClick) onPoiClick(poi);
  }, [onPoiClick]);

  // Update map bounds when the view changes
  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current) return;

    const bounds = mapRef.current.getMap().getBounds();
    const boundObj = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };
    
    if (onBoundsChange) {
      onBoundsChange(boundObj);
    }
    
    loadPropertiesFromBounds(boundObj);
  }, [onBoundsChange, loadPropertiesFromBounds]);

  // Debug current tooltipFields
  useEffect(() => {
    console.log('Current tooltipFields in MapComponent:', tooltipFields);
  }, [tooltipFields]);

  // Initialize map with bounds
  useEffect(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getMap().getBounds();
      const boundObj = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
      
      if (onBoundsChange) {
        onBoundsChange(boundObj);
      }
      
      if (loadPropertiesInView) {
        loadPropertiesFromBounds(boundObj);
      }
    }
  }, [onBoundsChange, loadPropertiesInView, loadPropertiesFromBounds]);

  // Function to enhance properties with permit data
  const enhancePropertiesWithPermits = (properties, permits) => {
    if (!properties || !permits) return properties;

    return properties.map(property => {
      // Check if property has permits using the folio number
      const permitInfo = permits[property.folio_number];
      
      if (permitInfo && permitInfo.hasPermit && permitInfo.permitData) {
        // Add detailed permit data
        return {
          ...property,
          hasPermit: true,
          permit_status: permitInfo.permitData.status,
          permit_type: permitInfo.permitData.permit_type,
          permit_value: permitInfo.permitData.estimated_value,
          permit_date: permitInfo.permitData.issue_date,
          permit_expiration: permitInfo.permitData.expiration_date
        };
      }
      
      return {
        ...property,
        hasPermit: permitInfo ? permitInfo.hasPermit : false
      };
    });
  };

  // Enhance properties with permit data
  const enhancedProperties = enhancePropertiesWithPermits(mapProperties, propertyPermits).map(property => ({
    ...property,
    // You could add recentSale data here from MLS when available
    recentSale: property.recentSale || false
  }));

  // Handle errors if Mapbox token is missing or invalid
  useEffect(() => {
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'YOUR_MAPBOX_TOKEN' || MAPBOX_TOKEN === 'your_mapbox_token_here') {
      console.error('Mapbox token missing or invalid in environment variables');
      setMapError('Mapbox token is missing or invalid. Please add a valid token to your .env file.');
      toast({
        title: 'Mapbox token missing',
        description: 'The map will not display correctly without a valid Mapbox token',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } else {
      console.log('Mapbox token validation passed initial check');
      setMapError(null);
    }
  }, [toast]);

  // Function to reload the page
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Box width="100%" height="100%" position="relative">
      {mapError ? (
        <Alert status="error" variant="solid" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="100%">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Map Display Error
          </AlertTitle>
          <Text mb={4}>
            {mapError}
          </Text>
          <Button 
            leftIcon={<FaSync />} 
            colorScheme="white" 
            variant="outline" 
            onClick={handleReload}
          >
            Reload Map
          </Button>
        </Alert>
      ) : (
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onMoveEnd={handleMoveEnd}
          onError={(e) => {
            console.error("Mapbox error:", e);
            setMapError(`Map loading error: ${e.error ? e.error.message : 'Unknown error'}`);
          }}
          reuseMaps
          fog={false}
        >
          {/* Property markers */}
          {enhancedProperties.map((property) => (
            <MapMarker
              key={`property-${property.id || property.folio_number}`}
              item={property}
              type="property"
              onClick={handlePropertyClick}
              visibleFields={tooltipFields}
            />
          ))}

          {/* POI markers */}
          {showPOIs && pois.map((poi) => (
            <MapMarker
              key={`poi-${poi.id}`}
              item={poi}
              type="poi"
              onClick={handlePoiClick}
            />
          ))}

          {/* Map controls */}
          <NavigationControl position="top-right" />
          <GeolocateControl
            position="top-right"
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation={true}
          />
          <ScaleControl position="bottom-right" />
        </Map>
      )}

      {/* Loading indicator */}
      {loading && (
        <Flex 
          position="absolute" 
          top="50%" 
          left="50%" 
          transform="translate(-50%, -50%)"
          bg="white" 
          p={4} 
          borderRadius="md" 
          boxShadow="lg"
          zIndex={10}
          align="center"
          direction="column"
        >
          <Spinner size="md" mb={2} color="blue.500" />
          <Text fontWeight="medium">Loading properties and permits...</Text>
          <Text fontSize="sm" color="gray.600" mt={1}>This may take a moment</Text>
        </Flex>
      )}

      {/* Map legend */}
      <Box
        position="absolute"
        bottom={4}
        right={4}
        bg="white" 
        p={3} 
        borderRadius="md" 
        boxShadow="md"
        zIndex={1}
      >
        <Text fontSize="sm" fontWeight="bold" mb={2}>Legend</Text>
        <Stack spacing={2}>
          <Flex align="center">
            <Box className="property-marker default" mr={2}></Box>
            <Text fontSize="xs">Property</Text>
          </Flex>
          <Flex align="center">
            <Box className="property-marker has-permit" mr={2}></Box>
            <Text fontSize="xs">Active Permit</Text>
          </Flex>
          <Flex align="center">
            <Box className="property-marker recent-sale" mr={2}></Box>
            <Text fontSize="xs">Recent Sale</Text>
          </Flex>
          <Flex align="center">
            <Box className="property-marker both" mr={2}></Box>
            <Text fontSize="xs">Permit & Sale</Text>
          </Flex>
          {showPOIs && (
            <Flex align="center">
              <Box className="poi-marker" color="blue.500" mr={2}>
                <FaBuilding size={14} />
              </Box>
              <Text fontSize="xs">Point of Interest</Text>
            </Flex>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default MapComponent; 