import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import { propertiesAPI } from '../services/api';

export const useProperties = (filters = {}, bounds = null, enabled = true) => {
  const [queryParams, setQueryParams] = useState({
    ...filters,
    bounds: bounds ? JSON.stringify(bounds) : undefined,
    page: 1,
    limit: 100,
  });

  // Update queryParams when filters or bounds change
  useEffect(() => {
    setQueryParams({
      ...filters,
      bounds: bounds ? JSON.stringify(bounds) : undefined,
      page: 1,
      limit: 100,
    });
  }, [filters, bounds]);

  // Fetch properties using React Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(
    ['properties', queryParams],
    () => propertiesAPI.getProperties(queryParams),
    {
      enabled,
      keepPreviousData: true,
      staleTime: 60000, // 1 minute
    }
  );

  // Process properties to add extra properties needed for the UI
  const processedProperties = useCallback(() => {
    if (!data || !data.data) return [];

    return data.data.map(property => {
      // Determine if property has active permits or recent sales
      // This is just a placeholder - in a real implementation,
      // this data would come from the backend
      const hasPermit = property.hasPermit || Math.random() > 0.7;
      const recentSale = property.recentSale || Math.random() > 0.7;

      return {
        ...property,
        hasPermit,
        recentSale,
      };
    });
  }, [data]);

  return {
    properties: processedProperties(),
    isLoading,
    isError,
    error,
    refetch,
    meta: data?.meta || { totalCount: 0 },
  };
}; 