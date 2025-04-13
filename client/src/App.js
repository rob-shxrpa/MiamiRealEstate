import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

// Theme
import theme from './theme';

// Layout Components
import Layout from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PermitsPage from './pages/PermitsPage';
import PermitDetailPage from './pages/PermitDetailPage';
import PermitByNumberPage from './pages/PermitByNumberPage';
import POIsPage from './pages/POIsPage';
// import POIDetailPage from './pages/POIDetailPage';
// import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="properties/:id" element={<PropertyDetailPage />} />
              <Route path="permits" element={<PermitsPage />} />
              <Route path="permits/:id" element={<PermitDetailPage />} />
              <Route path="permits/by-number/:permitNumber" element={<PermitByNumberPage />} />
              <Route path="pois" element={<POIsPage />} />
              {/* <Route path="pois/:id" element={<POIDetailPage />} /> */}
              {/* <Route path="admin" element={<AdminPage />} /> */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
      </ChakraProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App; 