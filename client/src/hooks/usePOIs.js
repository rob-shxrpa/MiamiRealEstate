import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { poisAPI } from '../services/api';

export const usePOIs = (filters = {}, bounds = null, enabled = true) => {
  const [queryParams, setQueryParams] = useState({
    ...filters,
    bounds: bounds ? JSON.stringify(bounds) : undefined,
    page: 1,
    limit: 50, // Lower limit for POIs to avoid too many markers
  });

  // Update queryParams when filters or bounds change
  useEffect(() => {
    setQueryParams({
      ...filters,
      bounds: bounds ? JSON.stringify(bounds) : undefined,
      page: 1,
      limit: 50,
    });
  }, [filters, bounds]);

  // Fetch POIs using React Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(
    ['pois', queryParams],
    () => poisAPI.getPOIs(queryParams),
    {
      enabled,
      keepPreviousData: true,
      staleTime: 300000, // 5 minutes (POIs change less frequently)
    }
  );

  // Fetch POI categories
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
  } = useQuery(
    ['poiCategories'],
    () => poisAPI.getPOICategories(),
    {
      staleTime: 3600000, // 1 hour (categories change very infrequently)
    }
  );

  return {
    pois: data?.data || [],
    categories: categoriesData?.data || [],
    isLoading,
    isCategoriesLoading,
    isError,
    error,
    refetch,
    meta: data?.meta || { totalCount: 0 },
  };
}; 