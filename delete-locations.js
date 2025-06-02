// Script to delete specific location entries from Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, remove } = require('firebase/database');
require('dotenv').config({ path: './.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Array of location IDs to delete
const locationIdsToDelete = [
  "-OQNdeMYeKx-z8T_hEdp",
];

async function deleteLocations() {
  try {
    console.log(`Starting deletion of ${locationIdsToDelete.length} location entries...`);
    
    for (const locationId of locationIdsToDelete) {
      const locationRef = ref(database, `location/${locationId}`);
      await remove(locationRef);
      console.log(`Successfully deleted location with ID: ${locationId}`);
    }
    
    console.log('All specified locations have been deleted.');
  } catch (error) {
    console.error('Error deleting locations:', error);
  } finally {
    process.exit(0);
  }
}

// Check if there are IDs to delete
if (locationIdsToDelete.length === 0) {
  console.log('No location IDs provided. Please add the IDs to delete in the locationIdsToDelete array.');
  process.exit(1);
} else {
  deleteLocations();
}
