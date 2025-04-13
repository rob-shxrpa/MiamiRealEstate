import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <Flex 
      direction="column" 
      minHeight="100vh"
      bg="gray.50"
    >
      <Header />
      <Box flex="1">
        <Outlet />
      </Box>
      <Footer />
    </Flex>
  );
};

export default Layout; 