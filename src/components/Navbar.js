'use client';

import { useState, useEffect } from 'react';

const Navbar = ({ isLoading = false, onRefresh }) => {
  const [lastUpdated, setLastUpdated] = useState('');
  
  useEffect(() => {
    updateTimestamp();
  }, []);
  
  const updateTimestamp = () => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    setLastUpdated(formattedTime);
  };
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    updateTimestamp();
  };
  
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md py-3 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-4">
          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">GPS Tracker</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
          Last updated: {lastUpdated}
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Refresh data"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
