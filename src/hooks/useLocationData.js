import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export const useLocationData = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState({ startDateTime: null, endDateTime: null });

  useEffect(() => {
    setLoading(true);
    const locationRef = ref(database, 'location');

    const handleData = (snapshot) => {
      try {
        const data = snapshot.val();
        
        if (!data) {
          setLocations([]);
          setFilteredLocations([]);
          setError('No location data found');
          setLoading(false);
          return;
        }

        const locationEntries = Object.entries(data).map(
          ([id, locationData]) => ({
            id,
            data: locationData,
          })
        );

        // Sort by time (newest first)
        locationEntries.sort((a, b) => {
          return new Date(b.data.time).getTime() - new Date(a.data.time).getTime();
        });

        setLocations(locationEntries);
        setFilteredLocations(locationEntries);
        setError(null);
      } catch (err) {
        setError('Failed to fetch location data');
        console.error('Error fetching location data:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleError = (error) => {
      setError(`Error connecting to Firebase: ${error.message}`);
      setLoading(false);
    };

    try {
      onValue(locationRef, handleData, handleError);
    } catch (err) {
      setError('Failed to connect to Firebase');
      setLoading(false);
    }

    // Cleanup function
    return () => {
      off(locationRef);
    };
  }, []);

  // Apply time filter whenever locations or timeFilter changes
  useEffect(() => {
    if (!timeFilter.startDateTime && !timeFilter.endDateTime) {
      // No filter applied, show all locations
      setFilteredLocations(locations);
      return;
    }

    const filtered = locations.filter(location => {
      const locationTime = new Date(location.data.time).getTime();
      
      // Check if location time is after start time (if provided)
      const afterStart = !timeFilter.startDateTime || 
        locationTime >= new Date(timeFilter.startDateTime).getTime();
      
      // Check if location time is before end time (if provided)
      const beforeEnd = !timeFilter.endDateTime || 
        locationTime <= new Date(timeFilter.endDateTime).getTime();
      
      return afterStart && beforeEnd;
    });

    setFilteredLocations(filtered);
  }, [locations, timeFilter]);

  // Function to update the time filter
  const updateTimeFilter = useCallback((filter) => {
    setTimeFilter(filter);
  }, []);

  return { 
    locations: filteredLocations, 
    allLocations: locations,
    loading, 
    error,
    updateTimeFilter
  };
};
