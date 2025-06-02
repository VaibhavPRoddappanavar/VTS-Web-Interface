'use client';

const DateTimeFilter = ({ onFilterChange, startDateTime, endDateTime, setStartDateTime, setEndDateTime }) => {
  const handleFilterApply = () => {
    onFilterChange({
      startDateTime: startDateTime ? new Date(startDateTime).toISOString() : null,
      endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null
    });
  };

  const handleClearFilter = () => {
    setStartDateTime('');
    setEndDateTime('');
    onFilterChange({ startDateTime: null, endDateTime: null });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Filter Locations</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Time
          </label>
          <input
            id="start-time"
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Time
          </label>
          <input
            id="end-time"
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleFilterApply}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply Filter
          </button>
          
          <button
            onClick={handleClearFilter}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateTimeFilter;
