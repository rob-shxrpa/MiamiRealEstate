import React, { useState, useEffect, useRef } from 'react';
import {
  Input,
  InputGroup,
  InputLeftElement,
  Box,
  List,
  ListItem,
  Text,
  Flex,
  Spinner,
  useOutsideClick,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { propertiesAPI } from '../services/api';
import debounce from 'lodash/debounce';

const AddressSearchInput = ({ onSelectAddress, placeholder = "Search address or zipcode" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();
  
  // Close dropdown when clicking outside
  useOutsideClick({
    ref: ref,
    handler: () => setIsOpen(false),
  });

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await propertiesAPI.searchProperties(query);
        
        if (response && response.data) {
          setResults(response.data);
          setIsOpen(response.data.length > 0);
        } else {
          setResults([]);
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Error searching addresses:', error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 500)
  ).current;

  // Effect to trigger search on input change
  useEffect(() => {
    if (searchTerm && searchTerm.length >= 3) {
      setIsLoading(true);
      debouncedSearch(searchTerm);
    } else {
      setResults([]);
      setIsOpen(false);
    }
    
    return () => {
      // Cancel any pending debounced search
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle result selection
  const handleSelect = (property) => {
    setSearchTerm(property.address);
    setIsOpen(false);
    if (onSelectAddress) {
      onSelectAddress(property);
    }
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    
    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    } catch (e) {
      return text;
    }
  };

  return (
    <Box position="relative" ref={ref}>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          {isLoading ? (
            <Spinner size="xs" color="gray.400" />
          ) : (
            <SearchIcon color="gray.300" />
          )}
        </InputLeftElement>
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => searchTerm && results.length > 0 && setIsOpen(true)}
        />
      </InputGroup>
      
      {isOpen && (
        <List
          position="absolute"
          bg="white"
          width="100%"
          shadow="md"
          borderRadius="md"
          mt={1}
          maxH="300px"
          overflowY="auto"
          zIndex={10}
          border="1px solid"
          borderColor="gray.200"
        >
          {results.length === 0 ? (
            <ListItem p={3} fontSize="sm" color="gray.500">
              No matching addresses found
            </ListItem>
          ) : (
            results.map((property) => (
              <ListItem
                key={property.id || property.folio_number}
                p={2}
                cursor="pointer"
                _hover={{ bg: 'blue.50' }}
                onClick={() => handleSelect(property)}
              >
                <Flex direction="column">
                  <Text fontWeight="medium" dangerouslySetInnerHTML={{ 
                    __html: highlightMatch(property.address, searchTerm) 
                  }} />
                  <Text fontSize="xs" color="gray.500">
                    {property.city}, FL {property.zipcode} {property.folio_number && `• Folio: ${property.folio_number}`}
                  </Text>
                </Flex>
              </ListItem>
            ))
          )}
        </List>
      )}
    </Box>
  );
};

export default AddressSearchInput; 