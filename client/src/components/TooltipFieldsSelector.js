import React, { useEffect } from 'react';
import {
  Box,
  Text,
  Stack,
  CheckboxGroup,
  Checkbox,
  Heading,
  Divider,
  Button,
  SimpleGrid,
  HStack,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { FiInfo, FiCheck } from 'react-icons/fi';

// All available fields that can be displayed in the tooltip
export const AVAILABLE_FIELDS = {
  basic: [
    { id: 'address', label: 'Address' },
    { id: 'city', label: 'City & Zip' },
    { id: 'bedrooms', label: 'Bedrooms' },
    { id: 'bathrooms', label: 'Bathrooms' },
    { id: 'total_area', label: 'Square Footage' },
    { id: 'property_type', label: 'Property Type' },
    { id: 'year_built', label: 'Year Built' },
  ],
  details: [
    { id: 'folio_number', label: 'Folio Number' },
    { id: 'zone_code', label: 'Zoning Code' },
    { id: 'neighborhood', label: 'Neighborhood' },
    { id: 'flood_zone', label: 'Flood Zone' },
    { id: 'transect', label: 'Transect' },
    { id: 'commissioner', label: 'Commissioner' },
  ],
  permits: [
    { id: 'permit_status', label: 'Permit Status' },
    { id: 'permit_type', label: 'Permit Type' },
    { id: 'permit_value', label: 'Estimated Value' },
    { id: 'permit_date', label: 'Issue Date' },
    { id: 'permit_expiration', label: 'Expiration Date' },
  ],
  additional: [
    { id: 'last_sale_price', label: 'Sale Price' },
    { id: 'last_sale_date', label: 'Sale Date' },
    { id: 'image', label: 'Property Image' },
  ]
};

// Preset configurations
const PRESETS = {
  minimal: ['address', 'city'],
  standard: ['address', 'city', 'bedrooms', 'bathrooms', 'total_area', 'year_built'],
  detailed: ['address', 'city', 'bedrooms', 'bathrooms', 'total_area', 'year_built', 
             'folio_number', 'zone_code', 'neighborhood', 'flood_zone'],
  complete: Object.values(AVAILABLE_FIELDS).flat().map(field => field.id),
};

const TooltipFieldsSelector = ({ selectedFields, onChange }) => {
  // Log selectedFields on mount and when they change
  useEffect(() => {
    console.log('TooltipFieldsSelector - Current selectedFields:', selectedFields);
  }, [selectedFields]);

  // Apply a preset configuration
  const applyPreset = (presetName) => {
    if (PRESETS[presetName]) {
      console.log(`Applying ${presetName} preset with fields:`, PRESETS[presetName]);
      onChange(PRESETS[presetName]);
    }
  };

  // Handle checkbox group changes
  const handleChange = (category, values) => {
    // Get all fields except the ones in the current category
    const otherFields = selectedFields.filter(field => 
      !AVAILABLE_FIELDS[category].some(item => item.id === field)
    );
    
    // Combine with the new values from this category
    const newFields = [...otherFields, ...values];
    console.log(`Changed ${category} fields - new selection:`, newFields);
    onChange(newFields);
  };

  return (
    <Box>
      <Heading size="sm" mb={2}>Customize Property Tooltips</Heading>
      <Text fontSize="sm" mb={3}>
        Select which fields to display when clicking on property markers
      </Text>
      
      <HStack spacing={2} mb={3}>
        <Button size="xs" onClick={() => applyPreset('minimal')} colorScheme="blue" variant="outline">
          Minimal
        </Button>
        <Button size="xs" onClick={() => applyPreset('standard')} colorScheme="blue" variant="outline">
          Standard
        </Button>
        <Button size="xs" onClick={() => applyPreset('detailed')} colorScheme="blue" variant="outline">
          Detailed
        </Button>
        <Button size="xs" onClick={() => applyPreset('complete')} colorScheme="blue" variant="outline">
          Complete
        </Button>
      </HStack>
      
      <Divider mb={3} />
      
      <Stack spacing={4}>
        <Box>
          <HStack mb={1}>
            <Text fontSize="sm" fontWeight="bold">Basic Information</Text>
            <Tooltip label="Essential property details">
              <IconButton 
                icon={<FiInfo />} 
                aria-label="Info" 
                size="xs"
                variant="ghost"
              />
            </Tooltip>
          </HStack>
          <CheckboxGroup 
            value={selectedFields.filter(field => 
              AVAILABLE_FIELDS.basic.some(item => item.id === field)
            )}
            onChange={(values) => handleChange('basic', values)}
          >
            <SimpleGrid columns={2} spacing={1}>
              {AVAILABLE_FIELDS.basic.map(field => (
                <Checkbox key={field.id} value={field.id} size="sm">
                  {field.label}
                </Checkbox>
              ))}
            </SimpleGrid>
          </CheckboxGroup>
        </Box>
        
        <Box>
          <HStack mb={1}>
            <Text fontSize="sm" fontWeight="bold">Property Details</Text>
            <Tooltip label="Additional property information">
              <IconButton 
                icon={<FiInfo />} 
                aria-label="Info" 
                size="xs"
                variant="ghost"
              />
            </Tooltip>
          </HStack>
          <CheckboxGroup 
            value={selectedFields.filter(field => 
              AVAILABLE_FIELDS.details.some(item => item.id === field)
            )}
            onChange={(values) => handleChange('details', values)}
          >
            <SimpleGrid columns={2} spacing={1}>
              {AVAILABLE_FIELDS.details.map(field => (
                <Checkbox key={field.id} value={field.id} size="sm">
                  {field.label}
                </Checkbox>
              ))}
            </SimpleGrid>
          </CheckboxGroup>
        </Box>
        
        <Box>
          <HStack mb={1}>
            <Text fontSize="sm" fontWeight="bold">Permit Information</Text>
            <Tooltip label="Permit details for this property">
              <IconButton 
                icon={<FiInfo />} 
                aria-label="Info" 
                size="xs"
                variant="ghost"
              />
            </Tooltip>
          </HStack>
          <CheckboxGroup 
            value={selectedFields.filter(field => 
              AVAILABLE_FIELDS.permits.some(item => item.id === field)
            )}
            onChange={(values) => handleChange('permits', values)}
          >
            <SimpleGrid columns={2} spacing={1}>
              {AVAILABLE_FIELDS.permits.map(field => (
                <Checkbox key={field.id} value={field.id} size="sm">
                  {field.label}
                </Checkbox>
              ))}
            </SimpleGrid>
          </CheckboxGroup>
        </Box>
        
        <Box>
          <HStack mb={1}>
            <Text fontSize="sm" fontWeight="bold">Additional Information</Text>
            <Tooltip label="Supplementary details">
              <IconButton 
                icon={<FiInfo />} 
                aria-label="Info" 
                size="xs"
                variant="ghost"
              />
            </Tooltip>
          </HStack>
          <CheckboxGroup 
            value={selectedFields.filter(field => 
              AVAILABLE_FIELDS.additional.some(item => item.id === field)
            )}
            onChange={(values) => handleChange('additional', values)}
          >
            <SimpleGrid columns={2} spacing={1}>
              {AVAILABLE_FIELDS.additional.map(field => (
                <Checkbox key={field.id} value={field.id} size="sm">
                  {field.label}
                </Checkbox>
              ))}
            </SimpleGrid>
          </CheckboxGroup>
        </Box>
      </Stack>
      
      <HStack mt={4} justify="space-between">
        <Text fontSize="xs" color="gray.500">
          Selected: {selectedFields.length} fields
        </Text>
        <HStack>
          <Button 
            size="xs" 
            colorScheme="blue"
            leftIcon={<FiCheck />}
            onClick={() => applyPreset('standard')}
          >
            Reset to Default
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
};

export default TooltipFieldsSelector; 