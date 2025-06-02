import { GoogleGenAI } from '@google/genai';

// Initialize the Google GenAI with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates a summary of a ride using Gemini API
 * @param {Array} locations - Array of location objects with timestamps
 * @param {Object} rideInfo - Information about the ride (name, start time, end time)
 * @returns {Promise<string>} - The generated summary
 */
export const generateRideSummary = async (locations, rideInfo) => {
  try {
    if (!locations || locations.length === 0) {
      return "No location data available to summarize.";
    }

    // Sort locations by time
    const sortedLocations = [...locations].sort(
      (a, b) => new Date(a.data.time).getTime() - new Date(b.data.time).getTime()
    );

    // Calculate some basic stats
    const startTime = new Date(sortedLocations[0].data.time);
    const endTime = new Date(sortedLocations[sortedLocations.length - 1].data.time);
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    // Calculate distance (simple straight-line distance between points)
    let totalDistance = 0;
    for (let i = 1; i < sortedLocations.length; i++) {
      const prevLoc = sortedLocations[i - 1].data;
      const currLoc = sortedLocations[i].data;
      
      totalDistance += calculateDistance(
        prevLoc.latitude, 
        prevLoc.longitude, 
        currLoc.latitude, 
        currLoc.longitude
      );
    }

    // Prepare the prompt for Gemini
    const prompt = `
      Please analyze this ride data and provide a structured summary in the following format:
      
      1. First, provide a "Summary" section with 2-3 bullet points about the overall ride
      2. Then, provide a "Journey Details" section with 3-5 bullet points about the path, pattern of movement, and interesting observations
      3. Then, provide a "Likely Purpose" section with 1-2 bullet points about the potential purpose of the trip
      
      Format your response with clear section headers(remove the hash before the headers) and bullet points for better readability. Do not use paragraphs.
      
      Ride name: ${rideInfo.name}
      Start time: ${new Date(rideInfo.startTime).toLocaleString()}
      End time: ${new Date(rideInfo.endTime).toLocaleString()}
      Duration: ${durationMinutes} minutes
      Total distance: ${totalDistance.toFixed(2)} kilometers
      Number of location points: ${locations.length}
      
      Location data (oldest to newest):
      ${sortedLocations.map((loc, index) => `
        Point ${index + 1}:
        - Latitude: ${loc.data.latitude}
        - Longitude: ${loc.data.longitude}
        - Time: ${new Date(loc.data.time).toLocaleString()}
      `).join('\n')}
    `;

    // Try to generate the summary using the Gemini API with retry logic
    let summary = "";
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        // Try with different models if we're retrying
        const modelToUse = retryCount === 0 ? "gemini-2.0-flash" : 
                          retryCount === 1 ? "gemini-1.5-flash" : "gemini-1.0-pro";
        
        console.log(`Attempting to generate summary with model: ${modelToUse} (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: prompt
        });
        
        // Get the summary text
        summary = response.text;
        break; // Success, exit the retry loop
      } catch (apiError) {
        console.error(`API error (attempt ${retryCount + 1}/${maxRetries + 1}):`, apiError);
        retryCount++;
        
        if (retryCount > maxRetries) {
          console.log("All API attempts failed, using local summary generation");
          // If all API attempts fail, generate a basic summary locally
          summary = generateLocalSummary(sortedLocations, rideInfo, totalDistance, durationMinutes);
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    return summary;
  } catch (error) {
    console.error('Error generating ride summary:', error);
    // Generate a basic summary locally as a fallback
    try {
      return generateLocalSummary(sortedLocations, rideInfo, totalDistance, durationMinutes);
    } catch (fallbackError) {
      console.error('Error generating local summary:', fallbackError);
      return "Failed to generate summary. Please try again later.";
    }
  }
};

/**
 * Calculate distance between two points using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert strings to numbers if needed
  lat1 = typeof lat1 === 'number' ? lat1 : Number(lat1);
  lon1 = typeof lon1 === 'number' ? lon1 : Number(lon1);
  lat2 = typeof lat2 === 'number' ? lat2 : Number(lon2);
  lon2 = typeof lon2 === 'number' ? lon2 : Number(lon2);
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} - Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Generate a basic summary locally when the API is unavailable
 * @param {Array} locations - Sorted array of location objects
 * @param {Object} rideInfo - Information about the ride
 * @param {number} totalDistance - Total distance in kilometers
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} - A basic summary
 */
function generateLocalSummary(locations, rideInfo, totalDistance, durationMinutes) {
  // Get start and end locations
  const startLocation = locations[0].data;
  const endLocation = locations[locations.length - 1].data;
  
  // Calculate if start and end points are close (circular trip)
  const startToEndDistance = calculateDistance(
    startLocation.latitude,
    startLocation.longitude,
    endLocation.latitude,
    endLocation.longitude
  );
  
  const isCircularTrip = startToEndDistance < 0.2; // Less than 200m between start and end
  
  // Calculate average speed
  const avgSpeedKmh = totalDistance / (durationMinutes / 60);
  
  // Determine if it was a short, medium or long trip
  let tripLength = "short";
  if (totalDistance > 5) tripLength = "medium";
  if (totalDistance > 20) tripLength = "long";
  
  // Determine if it was a slow, moderate or fast trip
  let tripSpeed = "slow";
  if (avgSpeedKmh > 20) tripSpeed = "moderate";
  if (avgSpeedKmh > 50) tripSpeed = "fast";
  
  // Generate the summary
  let summary = `This ${tripLength} ride named "${rideInfo.name}" covered approximately ${totalDistance.toFixed(2)} kilometers over ${durationMinutes} minutes. `;
  
  if (isCircularTrip) {
    summary += `The ride started and ended at approximately the same location, suggesting a circular route. `;
  } else {
    summary += `The ride started and ended at different locations, covering a point-to-point journey. `;
  }
  
  summary += `The average speed was ${avgSpeedKmh.toFixed(1)} km/h, indicating a ${tripSpeed} pace. `;
  
  if (locations.length < 10) {
    summary += `With only ${locations.length} location points recorded, this appears to be a brief or possibly incomplete tracking session.`;
  } else if (locations.length > 100) {
    summary += `With ${locations.length} location points recorded, this was a thoroughly tracked journey with detailed route information.`;
  } else {
    summary += `The ride was tracked with ${locations.length} location points, providing a good overview of the route taken.`;
  }
  
  return summary;
}
