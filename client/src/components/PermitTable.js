import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  Box,
  Text
} from '@chakra-ui/react';

const PermitTable = ({ permits = [] }) => {
  const navigate = useNavigate();

  // Log all permits for debugging
  React.useEffect(() => {
    console.log("Permits data in PermitTable:", permits);
    
    // Check if permits have IDs
    const hasIds = permits.some(p => p.id);
    console.log(`Do any permits have IDs? ${hasIds ? 'Yes' : 'No'}`);
    
    if (!hasIds && permits.length > 0) {
      console.warn("No permits have IDs - View buttons will be disabled");
    }
  }, [permits]);

  const handleViewPermit = (permit) => {
    // Log the permit being viewed for debugging
    console.log("Viewing permit:", permit);
    
    // Use the full permit number for navigation
    if (permit.permit_number) {
      console.log(`Navigating to permit: ${permit.permit_number}`);
      navigate(`/permits/by-number/${permit.permit_number}`);
    } else if (permit.id) {
      // Fallback to ID if no permit number
      console.log(`Navigating to permit ID: ${permit.id}`);
      navigate(`/permits/${permit.id}`);
    } else {
      console.warn("Cannot navigate - permit has no ID or permit number");
      return;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateStr);
      return 'N/A';
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return `$${Number(value).toLocaleString()}`;
  };

  if (!permits || permits.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text>No permits found for this property.</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>PERMIT #</Th>
            <Th>TYPE</Th>
            <Th>STATUS</Th>
            <Th>ADDRESS</Th>
            <Th>ISSUED DATE</Th>
            <Th>VALUE</Th>
            <Th>ACTIONS</Th>
          </Tr>
        </Thead>
        <Tbody>
          {permits.map((permit, index) => (
            <Tr key={permit.permit_number || `permit-${index}`}>
              <Td>{permit.permit_number}</Td>
              <Td>{permit.permit_type}</Td>
              <Td>
                <Badge
                  colorScheme={
                    permit.status === 'Active' ? 'green' :
                    permit.status === 'Final' ? 'blue' :
                    'gray'
                  }
                >
                  {permit.status}
                </Badge>
              </Td>
              <Td>{permit.address}</Td>
              <Td>
                {formatDate(permit.issued_date)}
              </Td>
              <Td>
                {formatCurrency(permit.estimated_value)}
              </Td>
              <Td>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => handleViewPermit(permit)}
                  isDisabled={!permit.permit_number && !permit.id}
                >
                  View
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default PermitTable; 