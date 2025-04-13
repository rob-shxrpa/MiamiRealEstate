import React from 'react';
import {
  Box,
  Badge,
  Heading,
  Text,
  Flex,
  Avatar,
  useColorModeValue,
  Tag,
  TagLabel,
  Stack,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { FiNavigation, FiPhone, FiGlobe, FiMapPin } from 'react-icons/fi';

const categoryIcons = {
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
  'Office': '🏢',
  'Residential': '🏘️',
  'Grocery': '🛒',
  'Fitness': '💪',
  'Financial': '🏦',
  'Pharmacy': '💊',
  'Gas Station': '⛽',
  'Cafe': '☕',
  'Bar': '🍸',
};

// Get emoji for category
const getCategoryIcon = (category) => {
  return categoryIcons[category] || '📍';
};

// Get color for category type
const getCategoryColor = (category) => {
  const colorMap = {
    'Restaurant': 'red',
    'School': 'yellow',
    'Park': 'green',
    'Hospital': 'purple',
    'Shopping': 'pink',
    'Entertainment': 'cyan',
    'Beach': 'blue',
    'Transportation': 'gray',
    'Government': 'orange',
    'Sports': 'teal',
    'Hotel': 'linkedin',
  };

  return colorMap[category] || 'blue';
};

const POICard = ({ poi, showDistance = false, distance, onDirectionsClick }) => {
  const {
    id,
    name,
    category,
    address,
    city,
    state,
    zip_code,
    phone,
    website,
    description,
  } = poi;

  const bgColor = useColorModeValue('white', 'gray.700');
  const categoryColor = getCategoryColor(category);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      boxShadow="sm"
      _hover={{ boxShadow: 'md' }}
      position="relative"
    >
      <Box p={4}>
        <Flex align="center" mb={3}>
          <Avatar
            bg={`${categoryColor}.100`}
            color={`${categoryColor}.500`}
            fontSize="xl"
            mr={3}
          >
            {getCategoryIcon(category)}
          </Avatar>
          <Box>
            <Heading size="sm" mb={1} isTruncated>
              {name}
            </Heading>
            <Tag size="sm" colorScheme={categoryColor} variant="subtle">
              <TagLabel>{category}</TagLabel>
            </Tag>
          </Box>
        </Flex>

        {showDistance && distance && (
          <Flex justify="space-between" align="center" mb={3}>
            <Badge 
              colorScheme="blue" 
              fontSize="sm" 
              px={2} 
              py={1} 
              borderRadius="full"
            >
              {distance.distance_text} ({distance.duration_text})
            </Badge>
            <IconButton
              size="sm"
              colorScheme="blue"
              variant="ghost"
              icon={<FiNavigation />}
              aria-label="Get directions"
              onClick={() => onDirectionsClick && onDirectionsClick(poi)}
            />
          </Flex>
        )}

        <Stack spacing={2} fontSize="sm">
          <Flex align="flex-start">
            <Box as={FiMapPin} mt={1} mr={2} color="gray.500" />
            <Text>
              {address},<br />
              {city}, {state} {zip_code}
            </Text>
          </Flex>

          {phone && (
            <Flex align="center">
              <Box as={FiPhone} mr={2} color="gray.500" />
              <Text>{phone}</Text>
            </Flex>
          )}

          {website && (
            <Flex align="center">
              <Box as={FiGlobe} mr={2} color="gray.500" />
              <Text
                color="blue.500"
                as="a"
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                isTruncated
              >
                {website.replace(/^https?:\/\//, '')}
              </Text>
            </Flex>
          )}

          {description && (
            <Text color="gray.600" mt={2} noOfLines={2}>
              {description}
            </Text>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default POICard; 