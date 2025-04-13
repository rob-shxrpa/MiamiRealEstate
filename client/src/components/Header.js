import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Link,
  useColorModeValue,
  useDisclosure,
  IconButton,
  HStack,
  Container,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MapIcon } from '@chakra-ui/icons';
import { MapPin, Map, FileText, Home, Settings } from 'react-feather';

const NavLink = ({ children, to }) => (
  <Link
    as={RouterLink}
    px={2}
    py={1}
    rounded="md"
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    to={to}
  >
    {children}
  </Link>
);

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box 
      bg={useColorModeValue('white', 'gray.900')} 
      borderBottom={1} 
      borderStyle="solid" 
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      px={4}
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <IconButton
            size="md"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Open Menu"
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems="center">
            <Box fontWeight="bold" fontSize="xl">
              <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
                <Flex align="center">
                  <Map size={24} strokeWidth={2} color="blue.500" />
                  <Text ml={2} color="blue.500">Miami Real Estate Analytics</Text>
                </Flex>
              </Link>
            </Box>
            <HStack
              as="nav"
              spacing={4}
              display={{ base: 'none', md: 'flex' }}
            >
              <NavLink to="/">
                <Flex align="center">
                  <Home size={18} style={{ marginRight: '5px' }} />
                  Home
                </Flex>
              </NavLink>
              <NavLink to="/permits">
                <Flex align="center">
                  <FileText size={18} style={{ marginRight: '5px' }} />
                  Permits
                </Flex>
              </NavLink>
              <NavLink to="/pois">
                <Flex align="center">
                  <MapPin size={18} style={{ marginRight: '5px' }} />
                  Points of Interest
                </Flex>
              </NavLink>
            </HStack>
          </HStack>
          <Flex alignItems="center">
            <Button
              as={RouterLink}
              to="/admin"
              variant="outline"
              colorScheme="blue"
              size="sm"
              leftIcon={<Settings size={18} />}
              display={{ base: 'none', md: 'inline-flex' }}
            >
              Admin
            </Button>
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as="nav" spacing={4}>
              <NavLink to="/">
                <Flex align="center">
                  <Home size={18} style={{ marginRight: '5px' }} />
                  Home
                </Flex>
              </NavLink>
              <NavLink to="/permits">
                <Flex align="center">
                  <FileText size={18} style={{ marginRight: '5px' }} />
                  Permits
                </Flex>
              </NavLink>
              <NavLink to="/pois">
                <Flex align="center">
                  <MapPin size={18} style={{ marginRight: '5px' }} />
                  Points of Interest
                </Flex>
              </NavLink>
              <NavLink to="/admin">
                <Flex align="center">
                  <Settings size={18} style={{ marginRight: '5px' }} />
                  Admin
                </Flex>
              </NavLink>
            </Stack>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
};

export default Header; 