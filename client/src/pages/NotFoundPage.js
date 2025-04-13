import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Center,
  VStack,
  Image,
} from '@chakra-ui/react';

const NotFoundPage = () => {
  return (
    <Container maxW="container.lg" py={20}>
      <Center>
        <VStack spacing={6} textAlign="center">
          <Heading size="4xl" color="blue.500">404</Heading>
          <Heading size="xl">Page Not Found</Heading>
          <Text fontSize="lg" color="gray.600">
            The page you are looking for doesn't exist or has been moved.
          </Text>
          <Image 
            src="https://images.unsplash.com/photo-1545156521-77bd85671d30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
            alt="Miami skyline"
            borderRadius="md"
            boxShadow="lg"
            maxW="500px"
            opacity={0.8}
          />
          <Button 
            as={RouterLink} 
            to="/" 
            colorScheme="blue" 
            size="lg"
            mt={4}
          >
            Return to Home
          </Button>
        </VStack>
      </Center>
    </Container>
  );
};

export default NotFoundPage; 