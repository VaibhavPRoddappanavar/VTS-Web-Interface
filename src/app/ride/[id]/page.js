'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useLocationData } from '@/hooks/useLocationData';
import { generateRideSummary } from '@/utils/geminiApi';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import LoadingState from '@/components/LoadingState';

// Import AnimatedMap component dynamically to avoid SSR issues with Leaflet
const AnimatedMap = dynamic(() => import('@/components/AnimatedMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse"></div>,
});

export default function RideDetailsPage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const { allLocations } = useLocationData();
  
  const [ride, setRide] = useState(null);
  const [rideLocations, setRideLocations] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Animation control states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Fetch ride details
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const rideRef = ref(database, `rides/${id}`);
        const snapshot = await get(rideRef);
        
        if (!snapshot.exists()) {
          setError('Ride not found');
          setLoading(false);
          return;
        }
        
        const rideData = snapshot.val();
        setRide({ id, ...rideData });
      } catch (err) {
        console.error('Error fetching ride:', err);
        setError('Failed to load ride details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchRide();
    }
  }, [id]);

  // Filter locations based on ride time range
  useEffect(() => {
    if (ride && allLocations.length > 0) {
      const startTime = new Date(ride.startTime).getTime();
      const endTime = new Date(ride.endTime).getTime();
      
      const filteredLocations = allLocations.filter(location => {
        const locationTime = new Date(location.data.time).getTime();
        return locationTime >= startTime && locationTime <= endTime;
      });
      
      setRideLocations(filteredLocations);
      
      // Generate summary
      const generateSummary = async () => {
        setSummaryLoading(true);
        try {
          const summary = await generateRideSummary(filteredLocations, ride);
          setSummary(summary);
        } catch (err) {
          console.error('Error generating summary:', err);
        } finally {
          setSummaryLoading(false);
        }
      };
      
      generateSummary();
    }
  }, [ride, allLocations]);

  // Handle back button click
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">{error}</h2>
            <button 
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <button 
            onClick={handleBack}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-800 dark:text-white">
          {ride?.name || 'Ride Details'}
        </h1>
        <div className="w-20"></div> {/* Spacer for centering title */}
      </div>
      
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
        <div className="lg:col-span-2 h-96 lg:h-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full overflow-hidden">
            <AnimatedMap 
              locations={rideLocations} 
              isAnimating={isAnimating}
              setIsAnimating={setIsAnimating}
              animationProgress={animationProgress}
              setAnimationProgress={setAnimationProgress}
              animationSpeed={animationSpeed}
              setAnimationSpeed={setAnimationSpeed}
              showControls={false}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Ride Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Ride Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Name: </span>
                <span className="font-medium">{ride?.name}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Start Time: </span>
                <span>{ride?.startTime ? new Date(ride.startTime).toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">End Time: </span>
                <span>{ride?.endTime ? new Date(ride.endTime).toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Duration: </span>
                <span>
                  {ride?.startTime && ride?.endTime ? 
                    `${Math.round((new Date(ride.endTime) - new Date(ride.startTime)) / (1000 * 60))} minutes` : 
                    'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Locations: </span>
                <span>{rideLocations.length}</span>
              </div>
              
              {/* Animation Controls */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-300">Animation Controls</h3>
                
                <button 
                  onClick={() => {
                    if (isAnimating) {
                      setIsAnimating(false);
                    } else {
                      if (animationProgress >= 100) {
                        setAnimationProgress(0);
                      }
                      setIsAnimating(true);
                    }
                  }}
                  className={`w-full mb-3 px-3 py-2 rounded-md text-white ${isAnimating ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {isAnimating ? 'Stop' : animationProgress > 0 && animationProgress < 100 ? 'Resume' : 'Start'} Animation
                </button>
                
                {/* Speed controls */}
                <div className="flex justify-between space-x-2 mb-3">
                  <button 
                    onClick={() => setAnimationSpeed(0.5)}
                    className={`flex-1 px-2 py-1 text-sm rounded-md ${animationSpeed === 0.5 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                  >
                    0.5x
                  </button>
                  <button 
                    onClick={() => setAnimationSpeed(1)}
                    className={`flex-1 px-2 py-1 text-sm rounded-md ${animationSpeed === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                  >
                    1x
                  </button>
                  <button 
                    onClick={() => setAnimationSpeed(2)}
                    className={`flex-1 px-2 py-1 text-sm rounded-md ${animationSpeed === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                  >
                    2x
                  </button>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${animationProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Summary</h2>
              
            </div>
            
            {summaryLoading ? (
              <div className="animate-pulse space-y-4">
                <div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1"></div>
                </div>
                <div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-1"></div>
                </div>
              </div>
            ) : (
              <div className="prose dark:prose-invert prose-sm max-w-none">
                {summary.split('\n\n').map((section, sectionIndex) => {
                  if (!section.trim()) return null;
                  
                  // Check if the section starts with a header (e.g., "Summary:")
                  const lines = section.split('\n');
                  const hasHeader = lines[0].includes(':') || 
                                   lines[0].toUpperCase() === lines[0] || 
                                   lines[0].endsWith(':');
                  
                  const header = hasHeader ? lines[0] : null;
                  const content = hasHeader ? lines.slice(1) : lines;
                  
                  return (
                    <div key={sectionIndex} className="mb-4">
                      {header && (
                        <h3 className="text-md font-medium text-blue-600 dark:text-blue-400 mb-2">
                          {header.endsWith(':') ? header : `${header}:`}
                        </h3>
                      )}
                      <ul className="list-disc pl-5 space-y-1">
                        {content.map((line, lineIndex) => {
                          // Skip empty lines
                          if (!line.trim()) return null;
                          
                          // Check if the line already has a bullet point
                          const bulletPattern = /^\s*[-•*]\s/;
                          const cleanLine = line.replace(bulletPattern, '').trim();
                          
                          return (
                            <li key={lineIndex} className="text-gray-700 dark:text-gray-300">
                              {cleanLine}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
