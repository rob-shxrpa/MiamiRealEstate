import { useQuery } from 'react-query';
import { permitsAPI } from '../services/api';

export const usePermitTypes = () => {
  const { data, isLoading, isError, error } = useQuery(
    'permitTypes',
    () => permitsAPI.getPermitTypes(),
    {
      staleTime: 3600000, // 1 hour
      cacheTime: 3600000, // 1 hour
    }
  );

  return {
    types: data?.data || [],
    isLoading,
    isError,
    error,
  };
}; 