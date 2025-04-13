import { useState } from 'react';
import { useMutation } from 'react-query';
import { distancesAPI } from '../services/api';

export const useDistances = () => {
  const [distances, setDistances] = useState({});
  const [selectedMode, setSelectedMode] = useState('walking');

  // Mutation for calculating a single distance
  const singleDistanceMutation = useMutation(
    ({ propertyId, poiId, mode }) => 
      distancesAPI.calculateDistance(propertyId, poiId, mode),
    {
      onSuccess: (data) => {
        const { propertyId, poiId, mode } = data.data;
        const key = `${propertyId}-${poiId}-${mode}`;
        
        setDistances(prev => ({
          ...prev,
          [key]: data.data
        }));
      }
    }
  );

  // Mutation for calculating multiple distances
  const multipleDistancesMutation = useMutation(
    ({ propertyId, poiIds, mode }) => 
      distancesAPI.calculateDistancesToPOIs(propertyId, poiIds, mode),
    {
      onSuccess: (data) => {
        const newDistances = {};
        
        data.data.forEach(item => {
          const { propertyId, poiId, mode } = item;
          const key = `${propertyId}-${poiId}-${mode}`;
          newDistances[key] = item;
        });
        
        setDistances(prev => ({
          ...prev,
          ...newDistances
        }));
      }
    }
  );

  // Calculate distance between a property and a POI
  const calculateDistance = (propertyId, poiId, mode = selectedMode) => {
    const key = `${propertyId}-${poiId}-${mode}`;
    
    // Return cached value if available
    if (distances[key]) {
      return distances[key];
    }
    
    // Otherwise, fetch from API
    singleDistanceMutation.mutate({ propertyId, poiId, mode });
    return null;
  };

  // Calculate distances from a property to multiple POIs
  const calculateDistancesToPOIs = (propertyId, poiIds, mode = selectedMode) => {
    // Filter out POIs that already have cached distances
    const poiIdsToFetch = poiIds.filter(poiId => {
      const key = `${propertyId}-${poiId}-${mode}`;
      return !distances[key];
    });
    
    if (poiIdsToFetch.length > 0) {
      multipleDistancesMutation.mutate({ 
        propertyId, 
        poiIds: poiIdsToFetch, 
        mode 
      });
    }
    
    // Return all available distances
    return poiIds.map(poiId => {
      const key = `${propertyId}-${poiId}-${mode}`;
      return distances[key] || null;
    }).filter(Boolean);
  };

  // Change travel mode
  const setTravelMode = (mode) => {
    setSelectedMode(mode);
  };

  return {
    calculateDistance,
    calculateDistancesToPOIs,
    setTravelMode,
    selectedMode,
    distances,
    isLoading: singleDistanceMutation.isLoading || multipleDistancesMutation.isLoading,
    isError: singleDistanceMutation.isError || multipleDistancesMutation.isError,
    error: singleDistanceMutation.error || multipleDistancesMutation.error,
  };
}; 