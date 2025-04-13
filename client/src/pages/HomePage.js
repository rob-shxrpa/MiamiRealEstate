import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  IconButton,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  Stack,
  InputGroup,
  InputLeftElement,
  Input,
  Spinner,
  Button,
  Badge,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
} from '@chakra-ui/react';
import { SearchIcon, SettingsIcon } from '@chakra-ui/icons';
import MapComponent from '../components/MapComponent';
import { useProperties } from '../hooks/useProperties';
import { usePOIs } from '../hooks/usePOIs';
import TooltipFieldsSelector, { AVAILABLE_FIELDS } from '../components/TooltipFieldsSelector';
import AddressSearchInput from '../components/AddressSearchInput';
import { usePropertyZones } from '../hooks/usePropertyZones';
import { usePermitTypes } from '../hooks/usePermitTypes';
import { usePermitStatuses } from '../hooks/usePermitStatuses';

// Default tooltip fields
const DEFAULT_TOOLTIP_FIELDS = [
  'address', 'city', 'bedrooms', 'bathrooms', 'total_area', 'year_built'
];

const HomePage = () => {
  // State for managing map and filters
  const [mapBounds, setMapBounds] = useState(null);
  const [showPOIs, setShowPOIs] = useState(true);
  const [filters, setFilters] = useState({
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    yearBuilt: '',
    minArea: '',
    maxArea: '',
    zipCode: '',
    zoneCode: '',
    permitType: '',
    permitStatus: '',
  });
  const [poiFilters, setPoiFilters] = useState({
    category: '',
    search: '',
  });
  const [initialMapLoaded, setInitialMapLoaded] = useState(false);
  const [tooltipFields, setTooltipFields] = useState(DEFAULT_TOOLTIP_FIELDS);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const toast = useToast();

  // Drawer for filters
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch properties and POIs using custom hooks
  const {
    properties,
    isLoading: isLoadingProperties,
    meta: propertiesMeta,
  } = useProperties(filters, mapBounds);

  const {
    pois,
    categories,
    isLoading: isLoadingPOIs,
  } = usePOIs(poiFilters, showPOIs ? mapBounds : null, showPOIs);

  const { zones } = usePropertyZones();
  const { types: permitTypes } = usePermitTypes();
  const { statuses: permitStatuses } = usePermitStatuses();

  // Effect to handle saving and loading tooltip fields from localStorage
  useEffect(() => {
    // Try to load saved tooltip fields
    try {
      const savedFields = localStorage.getItem('tooltipFields');
      if (savedFields) {
        const parsedFields = JSON.parse(savedFields);
        if (Array.isArray(parsedFields) && parsedFields.length > 0) {
          console.log('Loaded tooltip fields from localStorage:', parsedFields);
          setTooltipFields(parsedFields);
        }
      }
    } catch (error) {
      console.error('Error loading tooltip fields from localStorage:', error);
    }
  }, []);

  // Effect to save tooltip fields when they change
  useEffect(() => {
    try {
      if (tooltipFields && tooltipFields.length > 0) {
        localStorage.setItem('tooltipFields', JSON.stringify(tooltipFields));
        console.log('Saved tooltip fields to localStorage:', tooltipFields);
      }
    } catch (error) {
      console.error('Error saving tooltip fields to localStorage:', error);
    }
  }, [tooltipFields]);

  // Update tooltipFields state with validation
  const handleTooltipFieldsChange = (fields) => {
    if (!Array.isArray(fields)) {
      console.error('Invalid tooltip fields format:', fields);
      return;
    }
    
    console.log('Updating tooltip fields in HomePage:', fields);
    setTooltipFields(fields);
  };

  // Effect to show a welcome toast on first load
  useEffect(() => {
    if (!initialMapLoaded) {
      toast({
        title: "Welcome to Miami Real Estate Analytics",
        description: "Zoom or pan the map to load properties in that area. Properties with permits will be highlighted in orange.",
        status: "info",
        duration: 9000,
        isClosable: true,
      });
      setInitialMapLoaded(true);
    }
  }, [initialMapLoaded, toast]);

  // Handle map bounds change for fetching data in view
  const handleBoundsChange = useCallback((bounds) => {
    setMapBounds(bounds);
  }, []);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle POI filter change
  const handlePOIFilterChange = (e) => {
    const { name, value } = e.target;
    setPoiFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle POI toggle
  const handlePOIToggle = (e) => {
    setShowPOIs(e.target.checked);
  };

  // Handle address selection
  const handleAddressSelect = (property) => {
    setSelectedProperty(property);
    // Center map on selected property if coordinates are available
    if (property && property.latitude && property.longitude) {
      setMapBounds({
        north: property.latitude + 0.005,
        south: property.latitude - 0.005,
        east: property.longitude + 0.005,
        west: property.longitude - 0.005
      });
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      propertyType: '',
      bedrooms: '',
      bathrooms: '',
      yearBuilt: '',
      minArea: '',
      maxArea: '',
      zipCode: '',
      zoneCode: '',
      permitType: '',
      permitStatus: '',
    });
    setPoiFilters({
      category: '',
      search: '',
    });
  };

  return (
    <Box position="relative" height="calc(100vh - 60px)">
      {/* Map Component */}
      <Box position="absolute" top="0" right="0" bottom="0" left="0">
        <MapComponent
          properties={properties}
          pois={pois}
          showPOIs={showPOIs}
          onBoundsChange={handleBoundsChange}
          loadPropertiesInView={true}
          tooltipFields={tooltipFields}
          // Force map to load data immediately when bounds change
          initialViewState={{
            latitude: selectedProperty ? selectedProperty.latitude : 25.7617,
            longitude: selectedProperty ? selectedProperty.longitude : -80.1918,
            zoom: selectedProperty ? 15 : 12,
          }}
        />
      </Box>

      {/* Search and filter controls */}
      <Box
        position="absolute"
        top="20px"
        left="20px"
        zIndex="1"
        bg="white"
        p={4}
        borderRadius="md"
        boxShadow="lg"
        width="320px"
        maxWidth="90vw"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Miami Real Estate</Heading>
          <IconButton
            icon={<SettingsIcon />}
            onClick={onOpen}
            aria-label="Filters"
            size="sm"
          />
        </Flex>

        <AddressSearchInput onSelectAddress={handleAddressSelect} />

        <Flex mt={4} justify="space-between" align="center">
          <Checkbox isChecked={showPOIs} onChange={handlePOIToggle}>
            Show Points of Interest
          </Checkbox>
          {isLoadingProperties && <Spinner size="sm" ml={2} />}
        </Flex>

        <Flex mt={4} justify="space-between">
          <Text fontSize="sm">
            Showing <Badge>{properties.length}</Badge> of{' '}
            <Badge>{propertiesMeta?.totalCount || 0}</Badge> properties
          </Text>
          <Text fontSize="sm">
            <Badge>{pois.length}</Badge> POIs
          </Text>
        </Flex>
      </Box>

      {/* Filters Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Map Settings</DrawerHeader>

          <DrawerBody>
            <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
              <TabList>
                <Tab>Filters</Tab>
                <Tab>Tooltips</Tab>
                <Tab>POIs</Tab>
              </TabList>
              
              <TabPanels>
                {/* Property Filters Tab */}
                <TabPanel>
                  <Stack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Property Type</FormLabel>
                      <Select 
                        placeholder="Any type"
                        value={filters.propertyType}
                        onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                        size="sm"
                      >
                        <option value="Single Family">Single Family</option>
                        <option value="Condo">Condo</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Multi-Family">Multi-Family</option>
                        <option value="Vacant Land">Vacant Land</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Zoning</FormLabel>
                      <Select 
                        placeholder="Any zone"
                        value={filters.zoneCode}
                        onChange={(e) => setFilters({ ...filters, zoneCode: e.target.value })}
                        size="sm"
                      >
                        {zones && zones.map(zone => (
                          <option key={zone.code} value={zone.code}>{zone.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Permit Type</FormLabel>
                      <Select 
                        placeholder="Any type"
                        value={filters.permitType}
                        onChange={(e) => setFilters({ ...filters, permitType: e.target.value })}
                        size="sm"
                      >
                        {permitTypes && permitTypes.map(type => (
                          <option key={type.id || type.code} value={type.id || type.code}>{type.name || type.description}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Permit Status</FormLabel>
                      <Select 
                        placeholder="Any status"
                        value={filters.permitStatus}
                        onChange={(e) => setFilters({ ...filters, permitStatus: e.target.value })}
                        size="sm"
                      >
                        {permitStatuses && permitStatuses.map(status => (
                          <option key={status.id || status.code} value={status.id || status.code}>{status.name || status.description}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Bedrooms</FormLabel>
                      <Select 
                        placeholder="Any"
                        value={filters.bedrooms}
                        onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                        size="sm"
                      >
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Min Bathrooms</FormLabel>
                      <Select
                        name="minBathrooms"
                        placeholder="Any"
                        value={filters.bathrooms}
                        onChange={handleFilterChange}
                      >
                        <option value="1">1+</option>
                        <option value="1.5">1.5+</option>
                        <option value="2">2+</option>
                        <option value="2.5">2.5+</option>
                        <option value="3">3+</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Built After</FormLabel>
                      <Select
                        name="yearBuilt"
                        placeholder="Any Year"
                        value={filters.yearBuilt}
                        onChange={handleFilterChange}
                      >
                        <option value="1950">1950+</option>
                        <option value="1980">1980+</option>
                        <option value="2000">2000+</option>
                        <option value="2010">2010+</option>
                        <option value="2020">2020+</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Min Area</FormLabel>
                      <Input
                        type="number"
                        name="minArea"
                        value={filters.minArea}
                        onChange={handleFilterChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Max Area</FormLabel>
                      <Input
                        type="number"
                        name="maxArea"
                        value={filters.maxArea}
                        onChange={handleFilterChange}
                      />
                    </FormControl>

                    <Button onClick={handleResetFilters} size="sm" colorScheme="gray">
                      Reset Filters
                    </Button>
                  </Stack>
                </TabPanel>
                
                {/* Property Tooltip Fields Tab */}
                <TabPanel>
                  <TooltipFieldsSelector 
                    selectedFields={tooltipFields} 
                    onChange={handleTooltipFieldsChange} 
                  />
                </TabPanel>
                
                {/* POI Settings Tab */}
                <TabPanel>
                  <FormControl>
                    <FormLabel>Points of Interest</FormLabel>
                    <Checkbox
                      isChecked={showPOIs}
                      onChange={handlePOIToggle}
                      mb={2}
                    >
                      Show on map
                    </Checkbox>
                    <Select
                      name="category"
                      placeholder="All Categories"
                      value={poiFilters.category}
                      onChange={handlePOIFilterChange}
                      isDisabled={!showPOIs}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default HomePage; 