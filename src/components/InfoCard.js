'use client';

const InfoCard = ({ location, className = '' }) => {
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
      <div className="space-y-2">
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
    </div>
  );
};

export default InfoCard;
