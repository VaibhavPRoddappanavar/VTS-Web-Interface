'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { database } from '@/lib/firebase';

const SavedRidesList = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ridesRef = ref(database, 'rides');
    
    const handleData = (snapshot) => {
      try {
        const data = snapshot.val();
        
        if (!data) {
          setRides([]);
          setLoading(false);
          return;
        }

        const ridesList = Object.entries(data).map(([id, rideData]) => ({
          id,
          ...rideData,
        }));

        // Sort by creation time (newest first)
        ridesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setRides(ridesList);
      } catch (err) {
        setError('Failed to fetch saved rides');
        console.error('Error fetching rides data:', err);
      } finally {
        setLoading(false);
      }
    };

    onValue(ridesRef, handleData, (error) => {
      setError(`Error connecting to Firebase: ${error.message}`);
      setLoading(false);
    });

    return () => {
      // Cleanup
      const ridesRef = ref(database, 'rides');
      onValue(ridesRef, () => {});
    };
  }, []);

  const handleDeleteRide = async (rideId) => {
    try {
      const rideRef = ref(database, `rides/${rideId}`);
      await remove(rideRef);
    } catch (error) {
      console.error('Error deleting ride:', error);
      setError('Failed to delete ride');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Saved Rides</h3>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Saved Rides</h3>
        <div className="text-red-500 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Saved Rides</h3>
      
      {rides.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No saved rides yet</p>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <div key={ride.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900 dark:text-white">{ride.name}</h4>
                <button 
                  onClick={() => handleDeleteRide(ride.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <div>Start: {new Date(ride.startTime).toLocaleString()}</div>
                <div>End: {new Date(ride.endTime).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedRidesList;
