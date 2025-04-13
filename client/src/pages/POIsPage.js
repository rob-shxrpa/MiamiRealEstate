import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Flex,
  Input,
  Select,
  Button,
  FormControl,
  FormLabel,
  Stack,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  Avatar,
  Tag,
  TagLabel,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { MapPin } from 'react-feather';
import { poisAPI } from '../services/api';
import MapComponent from '../components/MapComponent';

const getIconForCategory = (category) => {
  const categoryMap = {
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
  
  return categoryMap[category] || '📍';
};

const POIsPage = () => {
  // State for filters
  const [filters, setFilters] = useState({
    category: '',
    name: '',
    zipCode: '',
    page: 1,
    limit: 20,
  });

  // State for map bounds
  const [bounds, setBounds] = useState(null);

  // State to track if we're showing the map or list view
  const [showMap, setShowMap] = useState(false);

  // Fetch POIs data
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery(
    ['pois', filters, bounds],
    () => poisAPI.getPOIs({ ...filters, bounds }),
    {
      keepPreviousData: true,
    }
  );

  // Fetch POI categories
  const { data: categoriesData } = useQuery(
    'poiCategories',
    poisAPI.getPOICategories,
    {
      staleTime: 1000 * 60 * 60, // 1 hour
    }
  );

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset page when filter changes
    }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      category: '',
      name: '',
      zipCode: '',
      page: 1,
      limit: 20,
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Handle map bounds change
  const handleBoundsChange = (newBounds) => {
    setBounds(newBounds);
  };

  // Toggle between map and list view
  const toggleView = () => {
    setShowMap(!showMap);
  };

  // Get POIs and pagination metadata
  const pois = data?.data || [];
  const meta = data?.meta || { totalCount: 0, totalPages: 1 };
  const categories = categoriesData?.data || [];

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Points of Interest</Heading>
        <Button onClick={toggleView}>
          {showMap ? 'Show List View' : 'Show Map View'}
        </Button>
      </Flex>

      <Grid templateColumns={{ base: '1fr', md: showMap ? '1fr' : '300px 1fr' }} gap={6}>
        {/* Filters - Hide in map view on mobile, always show on desktop */}
        <GridItem display={{ base: showMap ? 'none' : 'block', md: 'block' }}>
          <Box bg="white" p={4} borderRadius="md" boxShadow="md">
            <Heading size="md" mb={4}>Filters</Heading>
            
            <Stack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">POI Name</FormLabel>
                <Input
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Search by name"
                  size="sm"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Category</FormLabel>
                <Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  placeholder="All Categories"
                  size="sm"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Zip Code</FormLabel>
                <Input
                  name="zipCode"
                  value={filters.zipCode}
                  onChange={handleFilterChange}
                  placeholder="Enter zip code"
                  size="sm"
                />
              </FormControl>

              <Button size="sm" onClick={handleResetFilters} variant="outline">
                Reset Filters
              </Button>
            </Stack>
          </Box>
        </GridItem>

        {/* Results - Either map or list */}
        <GridItem>
          {showMap ? (
            <Box bg="white" p={4} borderRadius="md" boxShadow="md" h="600px">
              <MapComponent 
                pois={pois}
                onBoundsChange={handleBoundsChange}
                initialViewState={{
                  latitude: 25.7617,
                  longitude: -80.1918,
                  zoom: 10
                }}
              />
            </Box>
          ) : (
            <Box bg="white" p={4} borderRadius="md" boxShadow="md">
              {/* Search bar */}
              <Flex mb={4} justify="space-between" align="center">
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name"
                    value={filters.name}
                    onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value, page: 1 }))}
                  />
                </InputGroup>
                
                <Text>
                  Showing {pois.length} of {meta.totalCount} POIs
                </Text>
              </Flex>

              {isLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" />
                </Flex>
              ) : isError ? (
                <Alert status="error">
                  <AlertIcon />
                  {error?.message || 'Error loading POIs data'}
                </Alert>
              ) : pois.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text>No points of interest found matching the filter criteria</Text>
                </Box>
              ) : (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {pois.map((poi) => (
                      <Card key={poi.id} size="sm">
                        <CardHeader pb={0}>
                          <Flex align="center">
                            <Avatar 
                              bg="blue.500" 
                              icon={<MapPin size="1.5rem" />} 
                              mr={2}
                              fontSize="xl"
                            >
                              {getIconForCategory(poi.category)}
                            </Avatar>
                            <Box>
                              <Heading size="sm">{poi.name}</Heading>
                              <Tag size="sm" colorScheme="blue" mt={1}>
                                <TagLabel>{poi.category}</TagLabel>
                              </Tag>
                            </Box>
                          </Flex>
                        </CardHeader>
                        <CardBody>
                          <Text fontSize="sm" mb={2}>{poi.address}</Text>
                          <Text fontSize="sm">{poi.city}, {poi.state} {poi.zip_code}</Text>
                          
                          {poi.phone && (
                            <Text fontSize="sm" mt={2}>
                              📞 {poi.phone}
                            </Text>
                          )}
                          
                          {poi.website && (
                            <Text fontSize="sm" mt={1}>
                              🌐 {poi.website}
                            </Text>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>

                  {/* Pagination */}
                  <Flex mt={6} justify="center">
                    <Stack direction="row" spacing={2}>
                      <Button
                        size="sm"
                        onClick={() => handlePageChange(filters.page - 1)}
                        isDisabled={filters.page <= 1}
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={pageNum === filters.page ? 'solid' : 'outline'}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        size="sm"
                        onClick={() => handlePageChange(filters.page + 1)}
                        isDisabled={filters.page >= meta.totalPages}
                      >
                        Next
                      </Button>
                    </Stack>
                  </Flex>
                </>
              )}
            </Box>
          )}
        </GridItem>
      </Grid>
    </Container>
  );
};

export default POIsPage; 