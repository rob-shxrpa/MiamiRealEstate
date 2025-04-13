import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { Map } from 'react-feather';

const Footer = () => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
      borderTop={1}
      borderStyle="solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Container
        as={Stack}
        maxW="container.xl"
        py={4}
        spacing={4}
        justify="space-between"
        align="center"
      >
        <Flex align="center">
          <Map size={20} strokeWidth={2} color="blue.500" />
          <Text ml={2} fontWeight="bold" color="blue.500">
            Miami Real Estate Analytics
          </Text>
        </Flex>
        <Stack direction="row" spacing={6}>
          <Link as={RouterLink} to="/">Home</Link>
          <Link as={RouterLink} to="/permits">Permits</Link>
          <Link as={RouterLink} to="/pois">Points of Interest</Link>
          <Link as={RouterLink} to="/admin">Admin</Link>
        </Stack>
        <Text>© {new Date().getFullYear()} Miami Real Estate Analytics. All rights reserved</Text>
      </Container>
    </Box>
  );
};

export default Footer; 