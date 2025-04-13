import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  Grid,
  GridItem,
  Divider,
  HStack,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { permitsAPI } from '../services/api';
import DebugPanel from '../components/DebugPanel';

const PermitsPage = () => {
  const navigate = useNavigate();
  
  // State for filters
  const [filters, setFilters] = useState({
    folioNumber: '',
    permitNumber: '',
    permitType: '',
    status: '',
    zipCode: '',
    search: '',
    page: 1,
    limit: 20,
  });

  // Fetch permits data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(
    ['permits', filters],
    () => permitsAPI.getPermits(filters),
    {
      keepPreviousData: true,
    }
  );

  // Fetch permit types
  const {
    data: typesData,
    isLoading: isLoadingTypes,
  } = useQuery(
    'permitTypes',
    permitsAPI.getPermitTypes,
    {
      staleTime: 1000 * 60 * 60, // 1 hour
    }
  );

  // Fetch permit statuses
  const {
    data: statusesData,
    isLoading: isLoadingStatuses,
  } = useQuery(
    'permitStatuses',
    permitsAPI.getPermitStatuses,
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
      folioNumber: '',
      permitNumber: '',
      permitType: '',
      status: '',
      zipCode: '',
      search: '',
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

  // Navigate to property detail page
  const handlePropertyClick = (folioNumber) => {
    // In a real application, we would first need to get the property ID from the folio number
    // For now, we'll just navigate to a mock ID
    navigate(`/properties/123?folioNumber=${folioNumber}`);
  };

  // Navigate to permit detail page
  const handlePermitClick = (permit) => {
    if (permit.permit_number) {
      console.log(`Navigating to permit by number: ${permit.permit_number}`);
      navigate(`/permits/by-number/${permit.permit_number}`);
    } else if (permit.id) {
      console.log(`Navigating to permit by ID: ${permit.id}`);
      navigate(`/permits/${permit.id}`);
    }
  };

  // Get permits and pagination metadata
  const permits = data?.data || [];
  const meta = data?.meta || { totalCount: 0, totalPages: 1 };
  const permitTypes = typesData?.data || [];
  const permitStatuses = statusesData?.data || [];

  return (
    <Container maxW="container.xl" py={6}>
      {/* Debug Panel */}
      <DebugPanel />
      
      <Heading size="lg" mb={6}>Permit Records</Heading>

      {/* Test link for permit detail page */}
      <Box mb={4} p={3} bg="blue.50" borderRadius="md">
        <Text fontWeight="bold" mb={2}>Debugging: Test Direct Link</Text>
        <Button 
          size="sm" 
          colorScheme="blue" 
          onClick={() => navigate('/permits/by-number/BD23026101004F001')}
        >
          Go to Permit BD23026101004F001
        </Button>
      </Box>
      
      <Grid templateColumns={{ base: '1fr', md: '300px 1fr' }} gap={6}>
        {/* Filters */}
        <GridItem>
          <Box bg="white" p={4} borderRadius="md" boxShadow="md">
            <Heading size="md" mb={4}>Filters</Heading>
            
            <Stack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Folio Number</FormLabel>
                <Input
                  name="folioNumber"
                  value={filters.folioNumber}
                  onChange={handleFilterChange}
                  placeholder="Enter folio number"
                  size="sm"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Permit Number</FormLabel>
                <Input
                  name="permitNumber"
                  value={filters.permitNumber}
                  onChange={handleFilterChange}
                  placeholder="Enter permit number"
                  size="sm"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Permit Type</FormLabel>
                <Select
                  name="permitType"
                  value={filters.permitType}
                  onChange={handleFilterChange}
                  placeholder="All Types"
                  size="sm"
                  isDisabled={isLoadingTypes}
                >
                  {permitTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Status</FormLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  placeholder="All Statuses"
                  size="sm"
                  isDisabled={isLoadingStatuses}
                >
                  {permitStatuses.map((status) => (
                    <option key={status.code} value={status.code}>
                      {status.name}
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

        {/* Results */}
        <GridItem>
          <Box bg="white" p={4} borderRadius="md" boxShadow="md">
            {/* Search bar */}
            <Flex mb={4} justify="space-between" align="center">
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search by address or work description"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </InputGroup>
              
              <Text>
                Showing {permits.length} of {meta.totalCount} permits
              </Text>
            </Flex>

            {isLoading ? (
              <Flex justify="center" py={10}>
                <Spinner size="xl" />
              </Flex>
            ) : isError ? (
              <Alert status="error">
                <AlertIcon />
                {error?.message || 'Error loading permits data'}
              </Alert>
            ) : permits.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text>No permits found matching the filter criteria</Text>
              </Box>
            ) : (
              <>
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Permit #</Th>
                        <Th>Type</Th>
                        <Th>Status</Th>
                        <Th>Address</Th>
                        <Th>Issued Date</Th>
                        <Th>Value</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {permits.map((permit) => (
                        <Tr 
                          key={permit.id}
                          _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                          onClick={() => handlePermitClick(permit)}
                        >
                          <Td fontWeight="medium">{permit.permit_number}</Td>
                          <Td>{permit.permit_type.split('|')[0]}</Td>
                          <Td>
                            <Badge
                              colorScheme={
                                permit.status === 'Active'
                                  ? 'green'
                                  : permit.status === 'Final'
                                  ? 'blue'
                                  : permit.status === 'Expired'
                                  ? 'red'
                                  : 'gray'
                              }
                            >
                              {permit.status}
                            </Badge>
                          </Td>
                          <Td>{permit.address}</Td>
                          <Td>
                            {permit.issued_date
                              ? new Date(permit.issued_date).toLocaleDateString()
                              : 'N/A'}
                          </Td>
                          <Td>
                            {permit.estimated_value
                              ? `$${permit.estimated_value.toLocaleString()}`
                              : 'N/A'}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {/* Pagination */}
                <Flex mt={4} justify="center">
                  <HStack spacing={2}>
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
                  </HStack>
                </Flex>
              </>
            )}
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default PermitsPage; 