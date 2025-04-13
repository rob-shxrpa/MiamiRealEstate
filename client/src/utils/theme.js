import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e6f6ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db5ff',
    400: '#1a9fff',
    500: '#0088e6',
    600: '#006bb4',
    700: '#004d82',
    800: '#003050',
    900: '#00141f',
  },
  permit: {
    500: '#ff5722',
  },
  sale: {
    500: '#4caf50',
  },
};

const theme = extendTheme({
  config,
  colors,
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Inter', sans-serif",
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
});

export default theme; 