import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Badge,
  Heading,
  Text,
  Flex,
  Stack,
  HStack,
  Link,
  Image,
  useColorModeValue,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react';
import { 
  TbRulerMeasure, 
  TbBed, 
  TbBath, 
  TbBuildingEstate,
  TbMapPin,
  TbDroplet
} from 'react-icons/tb';
import { 
  FiCalendar, 
  FiFileText,
  FiHome,
  FiUser
} from 'react-icons/fi';

// Default set of visible fields
const DEFAULT_VISIBLE_FIELDS = [
  'address',
  'bedrooms',
  'bathrooms',
  'total_area'
];

const PropertyCard = ({ 
  property, 
  isCompact = false,
  visibleFields = DEFAULT_VISIBLE_FIELDS,
  showLink = true,
  onError = () => {}
}) => {
  // Always call hooks at the top level before any conditional returns
  const bgColor = useColorModeValue('white', 'gray.700');
  
  // More detailed logging for debugging
  useEffect(() => {
    console.log('PropertyCard rendering with property:', property);
    console.log(`PropertyCard - isCompact: ${isCompact}, visibleFields:`, 
      visibleFields, 
      'includesAddress:', visibleFields.includes('address'),
      'includesCity:', visibleFields.includes('city'),
      'includesFolio:', visibleFields.includes('folio_number')
    );
  }, [isCompact, visibleFields, property]);
  
  // Handle both property objects with direct properties and those wrapped in a data field
  const propertyData = property?.data || property;
  
  // Adding safeguards to prevent errors if property or propertyData is undefined
  if (!propertyData) {
    console.error('PropertyCard received undefined property data');
    // Call onError to notify parent component
    onError();
    return null;
  }
  
  // Check if we got an error response instead of property data
  if (propertyData.error) {
    console.error('PropertyCard received error:', propertyData.error);
    onError();
    return null;
  }
  
  const {
    id,
    address,
    city,
    zipcode,
    property_type,
    bedrooms,
    bathrooms,
    year_built,
    total_area,
    last_sale_price,
    last_sale_date,
    hasPermit,
    recentSale,
    image_url,
    folio_number,
    zone_code,
    neighborhood,
    flood_zone,
    flood_zone_description,
    commissioner_district,
    commissioner_name,
    transect,
    transect_description,
    // Permit data (may be undefined if not loaded)
    permit_status,
    permit_type,
    permit_value,
    permit_date,
    permit_expiration,
    permit_number
  } = propertyData;

  // Default placeholder image if no image is provided
  const fallbackImageUrl = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&q=75&w=400';

  // Check if a field should be visible - with safeguards
  const isVisible = (field) => {
    // Ensure visibleFields is an array
    if (!Array.isArray(visibleFields)) {
      console.error('visibleFields is not an array:', visibleFields);
      return DEFAULT_VISIBLE_FIELDS.includes(field);
    }
    
    // Always show badges for permits and recent sales
    if (field === 'permit_badge' || field === 'recentSale_badge') {
      return true;
    }
    
    // Handle commissioner field separately
    if (field === 'commissioner' && commissioner_name) {
      return visibleFields.includes('commissioner');
    }
    
    return visibleFields.includes(field);
  };

  // Wrap content with link if showLink is true
  const CardContent = () => (
    <>
      {isVisible('image') && (
        <Box position="relative">
          <Image
            src={image_url || fallbackImageUrl}
            alt={address}
            height={isCompact ? "130px" : "200px"}
            width="100%"
            objectFit="cover"
          />
          <Flex
            position="absolute"
            top={2}
            left={2}
            wrap="wrap"
            gap={1}
          >
            {property_type && isVisible('property_type') && (
              <Badge
                bg="blue.500"
                color="white"
                fontSize="xs"
                fontWeight="medium"
                px={2}
                py={1}
                borderRadius="full"
              >
                {property_type}
              </Badge>
            )}
            {hasPermit && (
              <Badge
                bg="orange.400"
                color="white"
                fontSize="xs"
                fontWeight="medium"
                px={2}
                py={1}
                borderRadius="full"
              >
                Permits
              </Badge>
            )}
            {recentSale && (
              <Badge
                bg="green.400"
                color="white"
                fontSize="xs"
                fontWeight="medium"
                px={2}
                py={1}
                borderRadius="full"
              >
                Recent Sale
              </Badge>
            )}
          </Flex>
        </Box>
      )}

      <Box p={4}>
        {isVisible('address') && (
          <Heading
            as="h3"
            size={isCompact ? "sm" : "md"}
            lineHeight="tight"
            isTruncated
            mb={1}
          >
            {address}
          </Heading>
        )}
        
        {isVisible('city') && (
          <Text fontSize={isCompact ? "xs" : "sm"} color="gray.500" mb={3}>
            {city}, FL {zipcode}
          </Text>
        )}

        {!isCompact && isVisible('last_sale_price') && last_sale_price && (
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="blue.500"
            mb={3}
          >
            ${last_sale_price.toLocaleString()}
            {last_sale_date && (
              <Text as="span" fontSize="sm" fontWeight="normal" color="gray.500" ml={1}>
                ({new Date(last_sale_date).toLocaleDateString()})
              </Text>
            )}
          </Text>
        )}

        <Stack spacing={2} divider={<Divider />}>
          {/* Basic property characteristics */}
          <HStack justify="space-between" fontSize={isCompact ? "xs" : "sm"}>
            {isVisible('bedrooms') && (
              <Flex align="center">
                <TbBed style={{ marginRight: '4px' }} />
                <Text>{bedrooms || 'N/A'} bd</Text>
              </Flex>
            )}
            
            {isVisible('bathrooms') && (
              <Flex align="center">
                <TbBath style={{ marginRight: '4px' }} />
                <Text>{bathrooms || 'N/A'} ba</Text>
              </Flex>
            )}
            
            {isVisible('total_area') && (
              <Flex align="center">
                <TbRulerMeasure style={{ marginRight: '4px' }} />
                <Text>
                  {total_area ? `${total_area.toLocaleString()} sqft` : 'N/A'}
                </Text>
              </Flex>
            )}
          </HStack>
          
          {/* Property details grid for additional information - show even in compact mode */}
          <Grid templateColumns="repeat(2, 1fr)" gap={2} mt={2} fontSize={isCompact ? "xs" : "sm"}>
            {isVisible('year_built') && year_built && (
              <GridItem>
                <Flex align="center">
                  <FiCalendar style={{ marginRight: '4px' }} />
                  <Text>Built: {year_built}</Text>
                </Flex>
              </GridItem>
            )}
            
            {isVisible('folio_number') && folio_number && (
              <GridItem>
                <Flex align="center">
                  <FiFileText style={{ marginRight: '4px' }} />
                  <Text>Folio: {folio_number}</Text>
                </Flex>
              </GridItem>
            )}
            
            {isVisible('zone_code') && zone_code && (
              <GridItem>
                <Flex align="center">
                  <TbBuildingEstate style={{ marginRight: '4px' }} />
                  <Text>Zone: {zone_code}</Text>
                </Flex>
              </GridItem>
            )}
            
            {isVisible('neighborhood') && neighborhood && (
              <GridItem>
                <Flex align="center">
                  <FiHome style={{ marginRight: '4px' }} />
                  <Text>Area: {neighborhood}</Text>
                </Flex>
              </GridItem>
            )}
            
            {isVisible('flood_zone') && flood_zone && (
              <GridItem colSpan={2}>
                <Flex align="center">
                  <TbDroplet style={{ marginRight: '4px' }} />
                  <Text>Flood: {flood_zone} {flood_zone_description && `(${flood_zone_description})`}</Text>
                </Flex>
              </GridItem>
            )}
            
            {isVisible('transect') && transect && (
              <GridItem colSpan={2}>
                <Flex align="center">
                  <TbMapPin style={{ marginRight: '4px' }} />
                  <Text>Transect: {transect} {transect_description && `(${transect_description})`}</Text>
                </Flex>
              </GridItem>
            )}
            
            {isVisible('commissioner') && commissioner_name && (
              <GridItem colSpan={2}>
                <Flex align="center">
                  <FiUser style={{ marginRight: '4px' }} />
                  <Text>District {commissioner_district}: {commissioner_name}</Text>
                </Flex>
              </GridItem>
            )}

            {/* Permit information section */}
            {hasPermit &&
              <>
                {permit_number && (
                  <GridItem>
                    <Flex align="center">
                      <Link 
                        as={RouterLink} 
                        to={`/permits/${permit_number}`}
                        color="blue.500"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        View Permit Details
                      </Link>
                    </Flex>
                  </GridItem>
                )}
                
                {isVisible('permit_status') && permit_status && (
                  <GridItem>
                    <Flex align="center">
                      <Badge colorScheme={
                        permit_status === 'Active' ? 'green' :
                        permit_status === 'Final' ? 'blue' :
                        permit_status === 'Expired' ? 'red' : 'gray'
                      } mr={1}>
                        {permit_status}
                      </Badge>
                    </Flex>
                  </GridItem>
                )}
                
                {isVisible('permit_type') && permit_type && (
                  <GridItem>
                    <Flex align="center">
                      <Text>Type: {permit_type}</Text>
                    </Flex>
                  </GridItem>
                )}
                
                {isVisible('permit_value') && permit_value && (
                  <GridItem>
                    <Flex align="center">
                      <Text>Value: ${Number(permit_value).toLocaleString()}</Text>
                    </Flex>
                  </GridItem>
                )}
                
                {isVisible('permit_date') && permit_date && (
                  <GridItem>
                    <Flex align="center">
                      <Text>Issued: {new Date(permit_date).toLocaleDateString()}</Text>
                    </Flex>
                  </GridItem>
                )}
                
                {isVisible('permit_expiration') && permit_expiration && (
                  <GridItem>
                    <Flex align="center">
                      <Text>Expires: {new Date(permit_expiration).toLocaleDateString()}</Text>
                    </Flex>
                  </GridItem>
                )}
              </>
            }
          </Grid>
        </Stack>
      </Box>
    </>
  );

  // Ensure we have an ID before attempting to create a link
  const propertyId = propertyData.folio_number || id || propertyData.id;
  const canShowLink = showLink && propertyId && typeof propertyId !== 'undefined';

  return (
    <Box
      maxW="sm"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      boxShadow="md"
      transition="transform 0.2s"
      _hover={{ transform: canShowLink ? 'translateY(-4px)' : 'none', boxShadow: canShowLink ? 'lg' : 'md' }}
    >
      {canShowLink ? (
        <Link 
          as={RouterLink}
          to={`/properties/${propertyId}`}
          _hover={{ textDecoration: 'none' }}
        >
          <CardContent />
        </Link>
      ) : (
        <CardContent />
      )}
    </Box>
  );
};

export default PropertyCard; 