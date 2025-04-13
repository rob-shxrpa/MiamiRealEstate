import { useQuery } from 'react-query';
import { permitsAPI } from '../services/api';

export const usePermitStatuses = () => {
  const { data, isLoading, isError, error } = useQuery(
    'permitStatuses',
    () => permitsAPI.getPermitStatuses(),
    {
      staleTime: 3600000, // 1 hour
      cacheTime: 3600000, // 1 hour
    }
  );

  return {
    statuses: data?.data || [],
    isLoading,
    isError,
    error,
  };
}; 