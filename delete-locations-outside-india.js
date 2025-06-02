// Script to delete location entries outside of India
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, remove } = require('firebase/database');
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

// India's bounding box coordinates
const INDIA_BOUNDS = {
  north: 37.0902, // Northern boundary (latitude)
  south: 6.7673,  // Southern boundary (latitude)
  east: 97.3954,  // Eastern boundary (longitude)
  west: 68.1862   // Western boundary (longitude)
};

// Function to check if coordinates are within India's boundaries
function isLocationInIndia(latitude, longitude) {
  // Check if coordinates are valid numbers
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  // Check if coordinates are within India's bounding box
  return (
    latitude >= INDIA_BOUNDS.south &&
    latitude <= INDIA_BOUNDS.north &&
    longitude >= INDIA_BOUNDS.west &&
    longitude <= INDIA_BOUNDS.east
  );
}

async function scanAndDeleteLocationsOutsideIndia() {
  try {
    console.log('Starting scan for locations outside India...');
    
    // Get all location entries
    const locationsRef = ref(database, 'location');
    const snapshot = await get(locationsRef);
    
    if (!snapshot.exists()) {
      console.log('No location data found in the database.');
      return;
    }
    
    const locationsData = snapshot.val();
    const locationsToDelete = [];
    const locationsToKeep = [];
    
    // Analyze each location
    for (const [id, data] of Object.entries(locationsData)) {
      let latitude, longitude;
      
      // Try to parse latitude and longitude as numbers
      try {
        latitude = typeof data.latitude === 'number' ? data.latitude : Number(data.latitude);
        longitude = typeof data.longitude === 'number' ? data.longitude : Number(data.longitude);
      } catch (err) {
        // If parsing fails, mark for deletion
        locationsToDelete.push({ id, reason: 'Invalid coordinates format' });
        continue;
      }
      
      // Check if location is outside India
      if (!isLocationInIndia(latitude, longitude)) {
        locationsToDelete.push({ 
          id, 
          latitude, 
          longitude, 
          reason: 'Outside India boundaries' 
        });
      } else {
        locationsToKeep.push({ id, latitude, longitude });
      }
    }
    
    // Report findings
    console.log(`Found ${locationsToDelete.length} locations outside India (out of ${Object.keys(locationsData).length} total locations)`);
    
    // Ask for confirmation before deleting
    console.log('\nLocations to be deleted:');
    locationsToDelete.forEach(loc => {
      console.log(`ID: ${loc.id}, Lat: ${loc.latitude}, Lng: ${loc.longitude}, Reason: ${loc.reason}`);
    });
    
    // Delete locations outside India
    console.log('\nDeleting locations outside India...');
    let deletedCount = 0;
    
    for (const location of locationsToDelete) {
      const locationRef = ref(database, `location/${location.id}`);
      await remove(locationRef);
      console.log(`Deleted location with ID: ${location.id}`);
      deletedCount++;
    }
    
    console.log(`\nSuccessfully deleted ${deletedCount} locations outside India.`);
    console.log(`Keeping ${locationsToKeep.length} locations within India.`);
    
  } catch (error) {
    console.error('Error scanning and deleting locations:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
scanAndDeleteLocationsOutsideIndia();
