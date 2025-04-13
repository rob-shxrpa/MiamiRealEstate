import { extendTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db3ff',
    400: '#269dff',
    500: '#0088ff',
    600: '#0070cc',
    700: '#005999',
    800: '#004166',
    900: '#002a33',
  },
  primary: {
    50: '#e5f5ff',
    100: '#b3e0ff',
    200: '#80ccff',
    300: '#4db8ff',
    400: '#1aa3ff',
    500: '#0088e6',
    600: '#006bb3',
    700: '#004e80',
    800: '#00324d',
    900: '#00161a',
  },
  secondary: {
    50: '#f0f9ff',
    100: '#e1f1ff',
    200: '#c2e4ff',
    300: '#a3d7ff',
    400: '#84caff',
    500: '#65bdff',
    600: '#46b0ff',
    700: '#27a3ff',
    800: '#0896ff',
    900: '#0077e6',
  },
};

const fonts = {
  heading: `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`,
  mono: `'Menlo', monospace`,
};

const theme = extendTheme({
  colors,
  fonts,
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'blue.500',
          color: 'white',
          _hover: {
            bg: 'blue.600',
          },
        },
        outline: {
          borderColor: 'blue.500',
          color: 'blue.500',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'md',
          boxShadow: 'sm',
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: '600',
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 2,
        py: 1,
        textTransform: 'normal',
        fontWeight: 'medium',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

export default theme; 