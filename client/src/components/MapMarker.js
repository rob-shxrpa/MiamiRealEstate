import React, { useState, useCallback, useEffect } from 'react';
import { Marker, Popup } from 'react-map-gl';
import { Flex, Text, Box } from '@chakra-ui/react';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';
import PropertyCard from './PropertyCard';
import POICard from './POICard';

const PropertyMarker = ({ property, onClick, visibleFields }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Handle both property objects with direct properties and those wrapped in a data field
  const processProperty = (prop) => {
    // If property is undefined or null, return an empty object
    if (!prop) return {};
    
    // Handle both direct properties and properties wrapped in a data field
    return prop.data ? prop.data : prop;
  };
  
  const propertyData = processProperty(property);
  
  // More verbose logging for debugging
  useEffect(() => {
    if (showPopup) {
      console.log('PropertyMarker - Rendering popup with visibleFields:', visibleFields);
      console.log('PropertyMarker - Raw Property data:', property);
      console.log('PropertyMarker - Processed Property data:', propertyData);
    }
  }, [showPopup, visibleFields, property, propertyData]);

  // Make sure we log folio number for debugging
  useEffect(() => {
    if (showPopup) {
      console.log('PropertyMarker - Folio Number:', property.folio_number);
    }
  }, [showPopup, property]);

  const togglePopup = useCallback((e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setShowPopup(!showPopup);
    // Reset error state when toggling popup
    setHasError(false);
    if (onClick) onClick(property);
  }, [showPopup, onClick, property]);
  
  // Handle API errors
  const handleApiError = () => {
    setHasError(true);
    console.error('Failed to load property details');
  };
  
  // Check if property has required coordinates
  if (!property || !property.latitude || !property.longitude) {
    console.error('PropertyMarker received property without coordinates', property);
    return null;
  }

  // Different colors based on property status
  let markerColor = '#4299E1'; // Default blue
  
  if (propertyData.hasPermit && propertyData.recentSale) {
    markerColor = '#805AD5'; // Purple if both permit and recent sale
  } else if (propertyData.hasPermit) {
    markerColor = '#ED8936'; // Orange for permit
  } else if (propertyData.recentSale) {
    markerColor = '#48BB78'; // Green for recent sale
  }

  // Fallback content for database errors
  const ErrorContent = () => (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Flex alignItems="center" mb={2}>
        <FiAlertTriangle color="orange" style={{ marginRight: '8px' }} />
        <Text fontWeight="bold">Unable to load property details</Text>
      </Flex>
      <Text fontSize="sm">
        Database connection error. Please try again later.
      </Text>
      {property.address && (
        <Text fontSize="sm" mt={2}>
          Address: {property.address}
        </Text>
      )}
    </Box>
  );

  return (
    <>
      <Marker
        longitude={property.longitude}
        latitude={property.latitude}
        anchor="bottom"
        onClick={togglePopup}
      >
        <div className="property-marker">
          <Flex
            alignItems="center"
            justifyContent="center"
            bg={markerColor}
            color="white"
            width="34px"
            height="34px"
            borderRadius="full"
            borderWidth="2px"
            borderColor="white"
            boxShadow="0 3px 6px rgba(0, 0, 0, 0.16)"
            fontSize="16px"
          >
            <FiHome />
          </Flex>
        </div>
      </Marker>

      {showPopup && (
        <Popup
          longitude={property.longitude}
          latitude={property.latitude}
          anchor="top"
          onClose={() => setShowPopup(false)}
          closeButton={true}
          closeOnClick={false}
          className="property-popup"
          maxWidth="300px"
        >
          {hasError ? (
            <ErrorContent />
          ) : (
            <PropertyCard 
              property={propertyData} 
              isCompact={true} 
              visibleFields={visibleFields || ['address', 'city', 'bedrooms', 'bathrooms', 'total_area']}
              showLink={Boolean(propertyData && (propertyData.folio_number || propertyData.id))}
              onError={handleApiError}
            />
          )}
        </Popup>
      )}
    </>
  );
};

const POIMarker = ({ poi, onClick }) => {
  const [showPopup, setShowPopup] = useState(false);

  const togglePopup = useCallback((e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setShowPopup(!showPopup);
    if (onClick) onClick(poi);
  }, [showPopup, onClick, poi]);

  // Get color for POI category
  const getCategoryColor = (category) => {
    const colorMap = {
      'Restaurant': '#E53E3E',
      'School': '#ECC94B',
      'Park': '#48BB78',
      'Hospital': '#805AD5',
      'Shopping': '#ED64A6',
      'Entertainment': '#00B5D8',
      'Beach': '#3182CE',
      'Transportation': '#718096',
      'Government': '#DD6B20',
      'Sports': '#319795',
      'Hotel': '#0077B5',
    };

    return colorMap[category] || '#4299E1';
  };

  // Get emoji for POI category
  const getCategoryEmoji = (category) => {
    const emojiMap = {
      'Restaurant': '🍽️',
      'School': '🏫',
      'Park': '🌳',
      'Hospital': '🏥',
      'Shopping': '🛍️',
      'Entertainment': '🎭',
      'Beach': '🏖️',
      'Transportation': '🚇',
      'Government': '🏛️',
      'Sports': '⚽',
      'Hotel': '🏨',
    };

    return emojiMap[category] || '📍';
  };

  return (
    <>
      <Marker
        longitude={poi.longitude}
        latitude={poi.latitude}
        anchor="bottom"
        onClick={togglePopup}
      >
        <div className="poi-marker">
          <Flex
            alignItems="center"
            justifyContent="center"
            bg="white"
            color={getCategoryColor(poi.category)}
            width="36px"
            height="36px"
            borderRadius="full"
            borderWidth="2px"
            borderColor={getCategoryColor(poi.category)}
            boxShadow="0 3px 6px rgba(0, 0, 0, 0.16)"
            fontSize="20px"
          >
            {getCategoryEmoji(poi.category)}
          </Flex>
        </div>
      </Marker>

      {showPopup && (
        <Popup
          longitude={poi.longitude}
          latitude={poi.latitude}
          anchor="top"
          onClose={() => setShowPopup(false)}
          closeButton={true}
          closeOnClick={false}
          className="property-popup"
          maxWidth="300px"
        >
          <POICard poi={poi} />
        </Popup>
      )}
    </>
  );
};

const MapMarker = ({ item, type = 'property', onClick, visibleFields }) => {
  // Log visible fields for debugging
  console.log('MapMarker visibleFields prop:', visibleFields);
  
  if (type === 'property') {
    return <PropertyMarker property={item} onClick={onClick} visibleFields={visibleFields} />;
  } else if (type === 'poi') {
    return <POIMarker poi={item} onClick={onClick} />;
  }
  
  return null;
};

export default MapMarker; 