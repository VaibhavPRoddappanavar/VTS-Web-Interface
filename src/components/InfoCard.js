'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { database } from '@/lib/firebase';

const InfoCard = ({ location, allLocations = [], className = '', onRideSelect }) => {
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
  if (!location) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 ${className}`}>
        <h2 className="text-lg font-semibold mb-2">Location Info</h2>
        <p className="text-gray-500 dark:text-gray-400">No location data available</p>
      </div>
    );
  }

  const { latitude: rawLatitude, longitude: rawLongitude, time } = location.data;
  // Ensure latitude and longitude are numbers
  const latitude = typeof rawLatitude === 'number' ? rawLatitude : Number(rawLatitude);
  const longitude = typeof rawLongitude === 'number' ? rawLongitude : Number(rawLongitude);
  
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 ${className}`}>
      <h2 className="text-lg font-semibold mb-2">Latest Location</h2>
      <div className="space-y-2 mb-4">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Latitude: </span>
          <span className="font-mono">{!isNaN(latitude) ? latitude.toFixed(6) : 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Longitude: </span>
          <span className="font-mono">{!isNaN(longitude) ? longitude.toFixed(6) : 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Time: </span>
          <span className="font-mono">{time}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">ID: </span>
          <span className="font-mono text-xs truncate">{location.id}</span>
        </div>
      </div>
      
      {/* Saved Rides Section */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Saved Rides</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Click "View" to show locations for a specific ride</p>
        
        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 dark:text-red-400">{error}</div>
        ) : rides.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No saved rides yet</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {rides.map((ride) => (
              <div key={ride.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900 dark:text-white">{ride.name}</h4>
                  <div className="flex space-x-2">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onRideSelect(ride)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => {
                          window.location.href = `/ride/${ride.id}`;
                        }}
                        className="text-green-500 hover:text-green-700 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDeleteRide(ride.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
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
      

    </div>
  );
};

export default InfoCard;
