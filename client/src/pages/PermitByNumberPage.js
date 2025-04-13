import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { permitsAPI } from '../services/api';
import { 
  Spinner, 
  Flex, 
  Alert, 
  AlertIcon, 
  Container, 
  Button, 
  Box,
  Heading,
  Text,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { formatDate, formatCurrency } from '../utils/formatters';

const PermitByNumberPage = () => {
  const { permitNumber } = useParams();
  const navigate = useNavigate();
  
  // Fetch permit by permit number
  const { data: permit, isLoading, isError, error } = useQuery(
    ['permit-by-number', permitNumber],
    () => permitsAPI.getPermitByNumber(permitNumber),
    {
      enabled: !!permitNumber,
      retry: 1, // Only retry once
    }
  );
  
  // Handle back button click
  const handleBackClick = () => {
    navigate(-1);
  };
  
  // Handle property click
  const handlePropertyClick = () => {
    if (permit && permit.folio_number) {
      navigate(`/properties/${permit.folio_number}`);
    }
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Final':
        return 'blue';
      case 'Expired':
        return 'red';
      case 'Hold':
        return 'orange';
      case 'Pending':
        return 'yellow';
      case 'In Progress':
        return 'teal';
      case 'Rejected':
        return 'red';
      case 'Completed':
        return 'green';
      default:
        return 'gray';
    }
  };
  
  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="50vh" direction="column" gap={4}>
          <Spinner size="xl" />
          <p>Loading permit {permitNumber}...</p>
        </Flex>
      </Container>
    );
  }
  
  if (isError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          Error finding permit {permitNumber}: {error?.message || 'Unknown error'}
        </Alert>
        <Button leftIcon={<ArrowBackIcon />} onClick={handleBackClick}>
          Back
        </Button>
      </Container>
    );
  }
  
  // If we have permit data, display it directly instead of redirecting
  return (
    <Container maxW="container.xl" py={8}>
      {/* Header with back button */}
      <HStack mb={6}>
        <IconButton
          icon={<ArrowBackIcon />}
          onClick={handleBackClick}
          aria-label="Back"
          variant="outline"
        />
        <Heading size="lg">Permit Details</Heading>
      </HStack>

      {/* Permit number and status */}
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Box>
          <Heading size="xl">{permit.permit_number}</Heading>
          <Text color="gray.600">{permit.application_number}</Text>
        </Box>
        <Badge
          colorScheme={getStatusColor(permit.status)}
          p={2}
          fontSize="md"
          borderRadius="md"
        >
          {permit.status}
        </Badge>
      </Flex>

      {/* Basic info */}
      <Box bg="white" p={6} borderRadius="md" boxShadow="md" mb={6}>
        <Heading size="md" mb={4}>
          Basic Information
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Stat>
            <StatLabel>Permit Type</StatLabel>
            <StatNumber fontSize="md">{permit.permit_type}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Folio Number</StatLabel>
            <StatNumber fontSize="md">
              <Button
                variant="link"
                colorScheme="blue"
                onClick={handlePropertyClick}
              >
                {permit.folio_number}
              </Button>
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Address</StatLabel>
            <StatNumber fontSize="md">{permit.address}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Property Type</StatLabel>
            <StatNumber fontSize="md">{permit.property_type}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Zoning</StatLabel>
            <StatNumber fontSize="md">{permit.zone || 'N/A'}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Estimated Value</StatLabel>
            <StatNumber fontSize="md">
              {permit.estimated_value
                ? formatCurrency(permit.estimated_value)
                : 'N/A'}
            </StatNumber>
          </Stat>
        </SimpleGrid>
      </Box>

      {/* Dates */}
      <Box bg="white" p={6} borderRadius="md" boxShadow="md" mb={6}>
        <Heading size="md" mb={4}>
          Timeline
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Stat>
            <StatLabel>Submitted Date</StatLabel>
            <StatNumber fontSize="md">
              {formatDate(permit.submitted_date)}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Issued Date</StatLabel>
            <StatNumber fontSize="md">
              {formatDate(permit.issued_date)}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Status Date</StatLabel>
            <StatNumber fontSize="md">
              {formatDate(permit.status_date)}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Final Date</StatLabel>
            <StatNumber fontSize="md">
              {formatDate(permit.final_date)}
              {permit.is_final && (
                <Badge colorScheme="blue" ml={2}>
                  Final
                </Badge>
              )}
            </StatNumber>
          </Stat>
        </SimpleGrid>
      </Box>

      {/* Scope and Details */}
      <Box bg="white" p={6} borderRadius="md" boxShadow="md" mb={6}>
        <Heading size="md" mb={4}>
          Scope and Details
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box>
            <Text fontWeight="bold" mb={2}>
              Scope of Work:
            </Text>
            <Text>{permit.scope_of_work || 'Not specified'}</Text>
          </Box>
          <SimpleGrid columns={2} spacing={4}>
            <Stat>
              <StatLabel>Total Sq Ft</StatLabel>
              <StatNumber fontSize="md">
                {permit.total_sqft || 'N/A'}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Addition Sq Ft</StatLabel>
              <StatNumber fontSize="md">
                {permit.addition_sqft || 'N/A'}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Remodeling Sq Ft</StatLabel>
              <StatNumber fontSize="md">
                {permit.remodeling_sqft || 'N/A'}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Days in Review</StatLabel>
              <StatNumber fontSize="md">
                {permit.days_in_review || 'N/A'}
              </StatNumber>
            </Stat>
          </SimpleGrid>
        </SimpleGrid>
      </Box>

      {/* Contractor Information */}
      <Box bg="white" p={6} borderRadius="md" boxShadow="md">
        <Heading size="md" mb={4}>
          Contractor Information
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Stat>
            <StatLabel>Company Name</StatLabel>
            <StatNumber fontSize="md">
              {permit.company_name || 'Not specified'}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Address</StatLabel>
            <StatNumber fontSize="md">
              {permit.company_address ? (
                <>
                  {permit.company_address}
                  {permit.company_city && `, ${permit.company_city}`}
                  {permit.company_zip && ` ${permit.company_zip}`}
                </>
              ) : (
                'Not specified'
              )}
            </StatNumber>
          </Stat>
        </SimpleGrid>
      </Box>
    </Container>
  );
};

export default PermitByNumberPage; 