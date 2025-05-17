'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocationData } from '@/hooks/useLocationData';
import Navbar from '@/components/Navbar';
import InfoCard from '@/components/InfoCard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import DateTimeFilter from '@/components/DateTimeFilter';

// Import Map component dynamically to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse"></div>,
});

export default function Home() {
  const { locations, allLocations, loading, error, updateTimeFilter } = useLocationData();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get the latest location
  const latestLocation = locations.length > 0 ? locations[0] : null;

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle filter changes
  const handleFilterChange = (filterValues) => {
    updateTimeFilter(filterValues);
  };

  // Toggle filter panel
  const toggleFilter = () => {
    setIsFilterOpen(prev => !prev);
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isLoading={loading} onRefresh={handleRefresh} />
      
      <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {locations.length} of {allLocations.length} locations displayed
        </div>
        <button 
          onClick={toggleFilter}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>{isFilterOpen ? 'Hide Filter' : 'Show Filter'}</span>
        </button>
      </div>
      
      {isFilterOpen && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <DateTimeFilter onFilterChange={handleFilterChange} />
        </div>
      )}
      
      <main className="flex-1 relative flex flex-col lg:flex-row">
        {/* Map container */}
        <div className="flex-1 relative">
          <Map locations={locations} />
          
          {/* Floating info card for mobile */}
          <div className="lg:hidden absolute bottom-4 left-4 right-4 z-10">
            <InfoCard location={latestLocation} />
          </div>
        </div>
        
        {/* Sidebar info card for desktop */}
        <div className="hidden lg:block w-80 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <InfoCard location={latestLocation} />
        </div>
        
        {/* Loading state */}
        {loading && <LoadingState />}
        
        {/* Error state */}
        {!loading && error && (
          <ErrorState message={error} onRetry={handleRefresh} />
        )}
      </main>
    </div>
  );
}
