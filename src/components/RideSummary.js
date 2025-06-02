'use client';

import { useState, useEffect } from 'react';
import { generateRideSummary } from '@/utils/geminiApi';

const RideSummary = ({ ride, locations, isVisible }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state when ride changes or component visibility changes
    if (!ride || !isVisible) {
      setSummary('');
      setError(null);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Filter locations based on ride time range
        const rideStartTime = new Date(ride.startTime).getTime();
        const rideEndTime = new Date(ride.endTime).getTime();
        
        const rideLocations = locations.filter(location => {
          const locationTime = new Date(location.data.time).getTime();
          return locationTime >= rideStartTime && locationTime <= rideEndTime;
        });
        
        if (rideLocations.length === 0) {
          setError('No location data found for this ride');
          setLoading(false);
          return;
        }
        
        // Get summary from Gemini API
        const generatedSummary = await generateRideSummary(rideLocations, ride);
        setSummary(generatedSummary);
      } catch (err) {
        console.error('Error getting ride summary:', err);
        setError('Failed to generate summary. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [ride, locations, isVisible]);

  if (!ride || !isVisible) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Summary
        </h3>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 dark:text-red-400 text-sm p-2 bg-red-50 dark:bg-red-900/30 rounded">
          {error}
        </div>
      ) : (
        <div className="prose dark:prose-invert prose-sm max-w-none">
          {summary.split('\n').map((paragraph, index) => (
            paragraph.trim() ? (
              <p key={index} className="text-gray-700 dark:text-gray-300 mb-2">
                {paragraph}
              </p>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
};

export default RideSummary;
