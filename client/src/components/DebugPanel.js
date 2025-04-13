import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Code,
  Collapse,
  Divider,
  Heading,
  Tag,
  Text,
  VStack,
  HStack,
  useDisclosure,
} from '@chakra-ui/react';

/**
 * DebugPanel component to display API errors and diagnose issues
 */
const DebugPanel = () => {
  const { isOpen, onToggle } = useDisclosure();
  const [apiLogs, setApiLogs] = useState([]);
  const [errors, setErrors] = useState([]);

  // Capture console logs and errors
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Log collector
    const logCollector = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('API')) {
        setApiLogs(prev => [
          { type: 'log', timestamp: new Date(), data: args },
          ...prev.slice(0, 49) // Keep only the last 50 logs
        ]);
      }
      originalConsoleLog(...args);
    };

    // Error collector
    const errorCollector = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Error')) {
        setErrors(prev => [
          { type: 'error', timestamp: new Date(), data: args },
          ...prev.slice(0, 19) // Keep only the last 20 errors
        ]);
      }
      originalConsoleError(...args);
    };

    // Warning collector
    const warnCollector = (...args) => {
      if (args[0] && typeof args[0] === 'string' && (args[0].includes('API') || args[0].includes('Error'))) {
        setApiLogs(prev => [
          { type: 'warning', timestamp: new Date(), data: args },
          ...prev.slice(0, 49)
        ]);
      }
      originalConsoleWarn(...args);
    };

    // Override console methods
    console.log = logCollector;
    console.error = errorCollector;
    console.warn = warnCollector;

    // Restore original methods on cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Format log data for display
  const formatLogData = (data) => {
    return data.map(item => {
      if (typeof item === 'string') {
        return item;
      }
      if (item instanceof Error) {
        return item.message;
      }
      try {
        return JSON.stringify(item, null, 2);
      } catch (e) {
        return String(item);
      }
    }).join(' ');
  };

  return (
    <Box 
      position="fixed"
      bottom="0"
      right="0"
      width={{ base: "100%", md: "30%" }}
      maxHeight="300px"
      bg="gray.800"
      color="white"
      p={2}
      zIndex="tooltip"
      boxShadow="dark-lg"
      borderTopLeftRadius="md"
    >
      <HStack justifyContent="space-between" mb={2}>
        <Heading size="sm">Debug Panel</Heading>
        <Button size="xs" colorScheme="blue" onClick={onToggle}>
          {isOpen ? 'Hide' : 'Show'}
        </Button>
      </HStack>

      {!isOpen && errors.length > 0 && (
        <Tag colorScheme="red" size="sm">
          {errors.length} Error{errors.length !== 1 ? 's' : ''}
        </Tag>
      )}
      
      <Collapse in={isOpen} animateOpacity>
        <Box overflowY="auto" maxHeight="250px">
          {errors.length > 0 && (
            <VStack align="stretch" mb={2}>
              <Heading size="xs" color="red.300">Errors</Heading>
              {errors.map((error, index) => (
                <Box key={index} bg="red.900" p={2} borderRadius="md" fontSize="xs">
                  <Text color="red.300" fontWeight="bold">
                    {error.timestamp.toLocaleTimeString()}:
                  </Text>
                  <Code display="block" bg="transparent" color="white" whiteSpace="pre-wrap" fontSize="xs">
                    {formatLogData(error.data)}
                  </Code>
                </Box>
              ))}
            </VStack>
          )}
          
          <Divider my={2} />
          
          <VStack align="stretch">
            <Heading size="xs" color="blue.300">API Logs</Heading>
            {apiLogs.map((log, index) => (
              <Box 
                key={index} 
                bg={log.type === 'error' ? 'red.900' : log.type === 'warning' ? 'orange.900' : 'gray.700'} 
                p={1} 
                borderRadius="md"
                fontSize="xs"
              >
                <Text fontWeight="bold" color={log.type === 'error' ? 'red.300' : log.type === 'warning' ? 'orange.300' : 'blue.300'}>
                  {log.timestamp.toLocaleTimeString()}:
                </Text>
                <Code display="block" bg="transparent" color="white" whiteSpace="pre-wrap" fontSize="xs">
                  {formatLogData(log.data)}
                </Code>
              </Box>
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default DebugPanel; 