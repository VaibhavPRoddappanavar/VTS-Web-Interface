'use client';

import { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';

const SaveRidePanel = ({ startDateTime, endDateTime, setStartDateTime, setEndDateTime }) => {
  const [rideName, setRideName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

  const handleSaveRide = async () => {
    if (!rideName.trim()) {
      setSaveMessage({ text: 'Please enter a ride name', type: 'error' });
      return;
    }

    if (!startDateTime || !endDateTime) {
      setSaveMessage({ text: 'Please select both start and end times', type: 'error' });
      return;
    }

    try {
      setIsSaving(true);
      
      // Create a reference to the 'rides' node in Firebase
      const ridesRef = ref(database, 'rides');
      
      // Generate a new child location with a unique key
      const newRideRef = push(ridesRef);
      
      // Set the data for this new ride
      await set(newRideRef, {
        name: rideName,
        startTime: startDateTime ? new Date(startDateTime).toISOString() : null,
        endTime: endDateTime ? new Date(endDateTime).toISOString() : null,
        createdAt: new Date().toISOString()
      });
      
      // Clear the form and show success message
      setRideName('');
      setSaveMessage({ text: 'Ride saved successfully!', type: 'success' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving ride:', error);
      setSaveMessage({ text: 'Failed to save ride. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Save Ride</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="ride-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ride Name
          </label>
          <input
            id="ride-name"
            type="text"
            value={rideName}
            onChange={(e) => setRideName(e.target.value)}
            placeholder="Enter a name for this ride"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Time
          </label>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {startDateTime ? new Date(startDateTime).toLocaleString() : 'Not set'}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Time
          </label>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {endDateTime ? new Date(endDateTime).toLocaleString() : 'Not set'}
          </div>
        </div>
        
        {saveMessage.text && (
          <div className={`text-sm p-2 rounded ${
            saveMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {saveMessage.text}
          </div>
        )}
        
        <button
          onClick={handleSaveRide}
          disabled={isSaving}
          className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSaving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Ride'}
        </button>
      </div>
    </div>
  );
};

export default SaveRidePanel;
