import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  GridItem,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  ButtonGroup,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Select,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { propertiesAPI, permitsAPI, propertyDataAPI } from '../services/api';
import { usePOIs } from '../hooks/usePOIs';
import { useDistances } from '../hooks/useDistances';
import MapComponent from '../components/MapComponent';
import PermitTable from '../components/PermitTable';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State to manage travel mode for distance calculations
  const [travelMode, setTravelMode] = useState('walking');

  // Fetch property data
  const {
    data: propertyData,
    isLoading: isLoadingProperty,
    isError: isPropertyError,
    error: propertyError,
  } = useQuery(['property', id], async () => {
    // Try getting property by ID first
    try {
      return await propertiesAPI.getPropertyById(id);
    } catch (error) {
      // If not found by ID, check if ID is actually a folio number
      if (error.response && error.response.status === 404) {
        try {
          const folioData = await propertiesAPI.getPropertyByFolio(id);
          return folioData;
        } catch (folioError) {
          throw new Error('Property not found');
        }
      }
      throw error;
    }
  }, {
    enabled: !!id,
  });

  // Fetch property permits
  const {
    data: permitsData,
    isLoading: isLoadingPermits,
    isError: isPermitsError,
    error: permitsError,
  } = useQuery(
    ['permits', propertyData?.folio_number],
    async () => {
      const response = await permitsAPI.getPermitsByFolio(propertyData.folio_number);
      console.log('Raw permits response:', response);
      return response;
    },
    {
      enabled: !!propertyData?.folio_number,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Get POIs for distance calculations
  const { pois, isLoading: isLoadingPOIs } = usePOIs(
    { limit: 10 }, // Only get 10 closest POIs
    null, // Don't use map bounds here
    !!propertyData?.data // Only enable when property is loaded
  );

  // Set up distance calculations
  const {
    calculateDistancesToPOIs,
    setTravelMode: setDistanceTravelMode,
    selectedMode,
    isLoading: isCalculatingDistances,
  } = useDistances();

  // Process property for display
  const property = propertyData;

  // Process permits for display
  const permits = permitsData?.data || [];
  // Log processed permits for debugging
  useEffect(() => {
    if (permits.length > 0) {
      console.log('Processed permits data:', permits);
      console.log('First permit has ID:', permits[0]?.id);
    }
  }, [permits]);

  // Update travel mode for distances
  useEffect(() => {
    setDistanceTravelMode(travelMode);
  }, [travelMode, setDistanceTravelMode]);

  // Calculate distances to POIs when property and POIs are loaded
  useEffect(() => {
    if (property && pois.length > 0 && property.id) {
      const poiIds = pois.map(poi => poi.id);
      calculateDistancesToPOIs(property.id, poiIds, selectedMode);
    }
  }, [property, pois, calculateDistancesToPOIs, selectedMode]);

  // Fetch property details data (including sales history)
  const {
    data: propertyDetailsData,
    isLoading: isLoadingDetails,
    isError: isDetailsError,
  } = useQuery(
    ['property-details', id],
    () => propertyDataAPI.getPropertyDataByFolio(id),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false, // Don't retry on 404 errors
      onError: (error) => {
        console.log('Property details error:', error);
      }
    }
  );

  // Loading state
  if (isLoadingProperty) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  // Error state
  if (isPropertyError) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="error">
          <AlertIcon />
          {propertyError?.message || 'Failed to load property details'}
        </Alert>
        <Button leftIcon={<ArrowBackIcon />} mt={4} onClick={() => navigate('/')}>
          Back to Map
        </Button>
      </Container>
    );
  }

  // If no property was found
  if (!property) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Property not found
        </Alert>
        <Button leftIcon={<ArrowBackIcon />} mt={4} onClick={() => navigate('/')}>
          Back to Map
        </Button>
      </Container>
    );
  }

  // Determine if property has permits
  const hasPermit = permits.length > 0;
  
  // Mock data for demonstration - in a real app, this would come from the API
  const hasRecentSale = false; // Will be replaced with MLS data later

  // Prepare property data for map display
  const propertyForMap = {
    ...property,
    latitude: parseFloat(property.latitude),
    longitude: parseFloat(property.longitude),
    hasPermit,
    recentSale: hasRecentSale,
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Button leftIcon={<ArrowBackIcon />} mb={6} onClick={() => navigate('/')}>
        Back to Map
      </Button>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Property Details Section */}
        <GridItem>
          <Box bg="white" borderRadius="lg" boxShadow="md" p={6} mb={6}>
            <Heading size="lg" mb={2}>
              {property.address}
            </Heading>
            <Text color="gray.600" mb={4}>
              Miami, FL {property.zipcode}
            </Text>

            <Flex wrap="wrap" gap={2} mb={4}>
              {hasPermit && (
                <Badge colorScheme="orange" fontSize="sm" p={1}>
                  Active Permits
                </Badge>
              )}
              <Badge colorScheme="blue" fontSize="sm" p={1}>
                Folio: {property.folio_number}
              </Badge>
              {property.zone_code && (
                <Badge colorScheme="purple" fontSize="sm" p={1}>
                  Zone: {property.zone_code}
                </Badge>
              )}
              {property.flood_zone && (
                <Badge colorScheme="red" fontSize="sm" p={1}>
                  Flood Zone: {property.flood_zone}
                </Badge>
              )}
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
              <Stat>
                <StatLabel>Neighborhood</StatLabel>
                <StatNumber fontSize="md">{property.neighborhood || 'N/A'}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Zone Description</StatLabel>
                <StatNumber fontSize="md">{property.transect_description || 'N/A'}</StatNumber>
              </Stat>
              {property.building_height && (
                <Stat>
                  <StatLabel>Building Height</StatLabel>
                  <StatNumber fontSize="md">{property.building_height} stories</StatNumber>
                </Stat>
              )}
              <Stat>
                <StatLabel>Commissioner District</StatLabel>
                <StatNumber fontSize="md">District {property.commissioner_district}</StatNumber>
                <StatHelpText>{property.commissioner_name}</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>NET Area</StatLabel>
                <StatNumber fontSize="md">{property.net_area || 'N/A'}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Historic Designation</StatLabel>
                <StatNumber fontSize="md">{property.has_historic_designation ? 'Yes' : 'No'}</StatNumber>
              </Stat>
            </SimpleGrid>

            <Divider my={6} />

            <Tabs isFitted variant="enclosed">
              <TabList>
                <Tab>Permits</Tab>
                <Tab>Sales History</Tab>
                <Tab>Points of Interest</Tab>
                <Tab>Services</Tab>
              </TabList>

              <TabPanels>
                {/* Permits Tab */}
                <TabPanel>
                  {isLoadingPermits ? (
                    <Flex justify="center" py={4}>
                      <Spinner />
                    </Flex>
                  ) : isPermitsError ? (
                    <Alert status="error">
                      <AlertIcon />
                      {permitsError?.message || 'Failed to load permits'}
                    </Alert>
                  ) : (
                    <PermitTable permits={permits} />
                  )}
                </TabPanel>

                {/* Sales History Tab */}
                <TabPanel>
                  {isLoadingDetails ? (
                    <Flex justify="center" py={4}>
                      <Spinner />
                    </Flex>
                  ) : isDetailsError ? (
                    <Box>
                      <Alert status="info" mb={4}>
                        <AlertIcon />
                        No detailed property data available from the County records.
                      </Alert>
                      <Text fontSize="sm" color="gray.600" mb={4}>
                        We couldn't find sales history data for this property. This may occur if:
                      </Text>
                      <Box as="ul" pl={6} fontSize="sm" color="gray.600" mb={4}>
                        <Box as="li" mb={2}>The property is new and not yet in the MunRoll database</Box>
                        <Box as="li" mb={2}>The data import for this property is pending</Box>
                        <Box as="li">The folio number has changed recently</Box>
                      </Box>
                    </Box>
                  ) : !propertyDetailsData ? (
                    <Alert status="info">
                      <AlertIcon />
                      No detailed property data available
                    </Alert>
                  ) : (
                    <Box>
                      {/* Owner Information Section */}
                      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={6}>
                        <Heading size="md" mb={4}>Owner Information</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                          <Stat>
                            <StatLabel>Owner 1</StatLabel>
                            <StatNumber fontSize="md">{propertyDetailsData?.owner?.name || 'N/A'}</StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Owner 2</StatLabel>
                            <StatNumber fontSize="md">{propertyDetailsData?.owner?.name2 || 'N/A'}</StatNumber>
                          </Stat>
                        </SimpleGrid>
                        <Box>
                          <Text fontWeight="semibold" mb={1}>Mailing Address</Text>
                          <Text>
                            {propertyDetailsData?.owner?.mailingAddress || 'N/A'}
                            {propertyDetailsData?.owner?.mailingCity && `, ${propertyDetailsData.owner.mailingCity}`}
                            {propertyDetailsData?.owner?.mailingState && `, ${propertyDetailsData.owner.mailingState}`}
                            {propertyDetailsData?.owner?.mailingZip && ` ${propertyDetailsData.owner.mailingZip}`}
                            {propertyDetailsData?.owner?.mailingCountry && 
                              propertyDetailsData.owner.mailingCountry !== 'USA' && 
                              `, ${propertyDetailsData.owner.mailingCountry}`}
                          </Text>
                        </Box>
                      </Box>
                      
                      {/* Sales History Section */}
                      <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
                        <Heading size="md" mb={4}>Sales History</Heading>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Sale Date</Th>
                              <Th>Sale Amount</Th>
                              <Th>Sale Type</Th>
                              <Th>Qualification</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {propertyDetailsData?.sales?.sale1?.date && (
                              <Tr>
                                <Td>{new Date(propertyDetailsData.sales.sale1.date).toLocaleDateString()}</Td>
                                <Td>${propertyDetailsData.sales.sale1.amount?.toLocaleString() || 'N/A'}</Td>
                                <Td>{propertyDetailsData.sales.sale1.type || 'N/A'}</Td>
                                <Td>{propertyDetailsData.sales.sale1.qualification || 'N/A'}</Td>
                              </Tr>
                            )}
                            {propertyDetailsData?.sales?.sale2?.date && (
                              <Tr>
                                <Td>{new Date(propertyDetailsData.sales.sale2.date).toLocaleDateString()}</Td>
                                <Td>${propertyDetailsData.sales.sale2.amount?.toLocaleString() || 'N/A'}</Td>
                                <Td>{propertyDetailsData.sales.sale2.type || 'N/A'}</Td>
                                <Td>{propertyDetailsData.sales.sale2.qualification || 'N/A'}</Td>
                              </Tr>
                            )}
                            {propertyDetailsData?.sales?.sale3?.date && (
                              <Tr>
                                <Td>{new Date(propertyDetailsData.sales.sale3.date).toLocaleDateString()}</Td>
                                <Td>${propertyDetailsData.sales.sale3.amount?.toLocaleString() || 'N/A'}</Td>
                                <Td>{propertyDetailsData.sales.sale3.type || 'N/A'}</Td>
                                <Td>{propertyDetailsData.sales.sale3.qualification || 'N/A'}</Td>
                              </Tr>
                            )}
                            {(!propertyDetailsData?.sales?.sale1?.date && 
                             !propertyDetailsData?.sales?.sale2?.date && 
                             !propertyDetailsData?.sales?.sale3?.date) && (
                              <Tr>
                                <Td colSpan={4} textAlign="center">No sales history available</Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </Box>
                    </Box>
                  )}
                </TabPanel>

                {/* Points of Interest Tab */}
                <TabPanel>
                  <Flex mb={4} align="center">
                    <Text mr={2}>Travel Mode:</Text>
                    <Select
                      value={travelMode}
                      onChange={(e) => setTravelMode(e.target.value)}
                      size="sm"
                      w="auto"
                    >
                      <option value="walking">Walking</option>
                      <option value="driving">Driving</option>
                    </Select>
                  </Flex>

                  {isLoadingPOIs || isCalculatingDistances ? (
                    <Flex justify="center" py={4}>
                      <Spinner />
                    </Flex>
                  ) : pois.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {pois.slice(0, 6).map((poi) => (
                        <Card key={poi.id} size="sm">
                          <CardHeader pb={0}>
                            <Heading size="sm">{poi.name}</Heading>
                            <Badge mt={1} colorScheme="blue">
                              {poi.category}
                            </Badge>
                          </CardHeader>
                          <CardBody>
                            <Text fontSize="sm" mb={2}>
                              {poi.address || 'Address not available'}
                            </Text>
                            
                            {/* Distance calculations would go here */}
                            <Text fontSize="sm" color="gray.600">
                              {travelMode === 'walking'
                                ? '15 min walk (1.2 km)'
                                : '5 min drive (1.2 km)'}
                            </Text>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text py={4}>No points of interest found near this property.</Text>
                  )}
                </TabPanel>

                {/* Services Tab */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Heading size="sm" mb={2}>City Services</Heading>
                      <SimpleGrid columns={2} spacing={4}>
                        <Stat>
                          <StatLabel>Trash Pickup</StatLabel>
                          <StatNumber fontSize="md">{property.trash_day || 'N/A'}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Recycling Day</StatLabel>
                          <StatNumber fontSize="md">{property.recycle_day || 'N/A'}</StatNumber>
                        </Stat>
                      </SimpleGrid>
                    </Box>
                    <Box>
                      <Heading size="sm" mb={2}>Flood Information</Heading>
                      <Text fontSize="sm">{property.flood_zone_description || 'No flood zone information available.'}</Text>
                    </Box>
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </GridItem>

        {/* Map Section */}
        <GridItem>
          <Box height="400px" bg="white" borderRadius="lg" boxShadow="md" overflow="hidden">
            <MapComponent
              properties={[propertyForMap]}
              pois={pois}
              initialViewState={{
                latitude: propertyForMap.latitude,
                longitude: propertyForMap.longitude,
                zoom: 15,
              }}
            />
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default PropertyDetailPage; 