import { useQuery } from 'react-query';
import { propertiesAPI } from '../services/api';

export const usePropertyZones = () => {
  const { data, isLoading, isError, error } = useQuery(
    'propertyZones',
    () => propertiesAPI.getPropertyZones(),
    {
      staleTime: 3600000, // 1 hour
      cacheTime: 3600000, // 1 hour
    }
  );

  return {
    zones: data?.data || [],
    isLoading,
    isError,
    error,
  };
}; 