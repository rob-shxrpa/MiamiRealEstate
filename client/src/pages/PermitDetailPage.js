import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Badge,
  Stack,
  Button,
  SimpleGrid,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { permitsAPI } from '../services/api';
import { formatDate, formatCurrency } from '../utils/formatters';

const PermitDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch permit data
  const {
    data: permit,
    isLoading,
    isError,
    error,
  } = useQuery(['permit', id], () => permitsAPI.getPermitById(id), {
    enabled: !!id,
  });

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

  // Handle back button click
  const handleBackClick = () => {
    navigate(-1);
  };

  // Handle property click
  const handlePropertyClick = () => {
    if (permit && permit.folio_number) {
      navigate(`/properties/search?folioNumber=${permit.folio_number}`);
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          Error loading permit details: {error?.message || 'Unknown error'}
        </Alert>
        <Button leftIcon={<ArrowBackIcon />} onClick={handleBackClick}>
          Back to Permits
        </Button>
      </Container>
    );
  }

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
              {permit.submitted_date
                ? formatDate(permit.submitted_date)
                : 'N/A'}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Issued Date</StatLabel>
            <StatNumber fontSize="md">
              {permit.issued_date ? formatDate(permit.issued_date) : 'N/A'}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Status Date</StatLabel>
            <StatNumber fontSize="md">
              {permit.status_date ? formatDate(permit.status_date) : 'N/A'}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Final Date</StatLabel>
            <StatNumber fontSize="md">
              {permit.final_date ? formatDate(permit.final_date) : 'N/A'}
            </StatNumber>
            {permit.is_final && (
              <StatHelpText>
                <Badge colorScheme="green">Final</Badge>
              </StatHelpText>
            )}
          </Stat>
        </SimpleGrid>

        {permit.days_in_review > 0 && (
          <Flex mt={4} align="center">
            <Text fontWeight="bold" mr={2}>
              Days in Review:
            </Text>
            <Badge colorScheme="purple">{permit.days_in_review} days</Badge>
          </Flex>
        )}
      </Box>

      {/* Scope and details */}
      <Box bg="white" p={6} borderRadius="md" boxShadow="md" mb={6}>
        <Heading size="md" mb={4}>
          Scope and Details
        </Heading>
        
        <Stack spacing={4}>
          {permit.scope_of_work && (
            <Box>
              <Text fontWeight="bold">Scope of Work:</Text>
              <Text>{permit.scope_of_work}</Text>
            </Box>
          )}
          
          <Divider />
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {permit.total_sqft > 0 && (
              <Stat>
                <StatLabel>Total Square Footage</StatLabel>
                <StatNumber fontSize="md">{permit.total_sqft} sqft</StatNumber>
              </Stat>
            )}
            {permit.addition_sqft > 0 && (
              <Stat>
                <StatLabel>Addition Square Footage</StatLabel>
                <StatNumber fontSize="md">{permit.addition_sqft} sqft</StatNumber>
              </Stat>
            )}
            {permit.remodeling_sqft > 0 && (
              <Stat>
                <StatLabel>Remodeling Square Footage</StatLabel>
                <StatNumber fontSize="md">{permit.remodeling_sqft} sqft</StatNumber>
              </Stat>
            )}
          </SimpleGrid>
        </Stack>
      </Box>

      {/* Contractor Info */}
      <Box bg="white" p={6} borderRadius="md" boxShadow="md" mb={6}>
        <Heading size="md" mb={4}>
          Contractor Information
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Stat>
            <StatLabel>Company Name</StatLabel>
            <StatNumber fontSize="md">{permit.company_name || 'N/A'}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Address</StatLabel>
            <StatNumber fontSize="md">
              {permit.company_address
                ? `${permit.company_address}, ${permit.company_city}, ${permit.company_zip}`
                : 'N/A'}
            </StatNumber>
          </Stat>
        </SimpleGrid>
      </Box>
    </Container>
  );
};

export default PermitDetailPage; 