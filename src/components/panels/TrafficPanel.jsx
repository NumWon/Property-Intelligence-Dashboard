import React, { useEffect } from 'react';

const TrafficPanel = ({ data, onViewMore, coordinates }) => {
  // Add debug logging to help identify issues
  useEffect(() => {
    console.log("TrafficPanel received data:", data);
    console.log("TrafficPanel received coordinates:", coordinates);
  }, [data, coordinates]);

  // Format vehicle count with commas - with null/undefined check
  const formatNumber = (num) => {
    if (num === undefined || num === null) {
      return "N/A";
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Default values if data is missing
  const vehicleCount = data?.vehicleCount || 0;
  const peakHours = data?.peakHours || "N/A";
  const footTraffic = data?.footTraffic || "Unknown";
  const trafficDetails = data?.trafficDetails || {};

  // Helper function to get traffic indicator color
  const getTrafficColor = (vehicleCount) => {
    if (vehicleCount > 20000) return 'text-red-600';
    if (vehicleCount > 15000) return 'text-orange-500';
    if (vehicleCount > 10000) return 'text-yellow-600';
    return 'text-green-600';
  };

  // If no data is available, show a loading state
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white p-4 shadow-md rounded-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-indigo-700">Traffic Data</h2>
          <button 
            onClick={onViewMore}
            className="text-sm text-indigo-600 border border-indigo-300 px-2 py-1 rounded hover:bg-indigo-50"
            disabled
          >
            More Info
          </button>
        </div>
        <div className="h-32 flex items-center justify-center">
          <p className="text-gray-500">Enter an address to see traffic data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 shadow-md rounded-2xl border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-indigo-700">Traffic Data</h2>
        <button 
          onClick={onViewMore}
          className="text-sm text-indigo-600 border border-indigo-300 px-2 py-1 rounded hover:bg-indigo-50"
        >
          More Info
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Daily Vehicle Traffic</p>
            <p className={`text-lg font-medium ${getTrafficColor(vehicleCount)}`}>
              {formatNumber(vehicleCount)} vehicles/day
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm text-gray-500">Peak Hours</p>
            <p className="font-medium">{peakHours}</p>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm text-gray-500">Foot Traffic</p>
            <p className="font-medium">
              {footTraffic ? footTraffic.split('(')[0] : 'Unknown'}
            </p>
          </div>
        </div>
        
        {trafficDetails && trafficDetails.avgDelay > 0 && (
          <div className="bg-indigo-50 p-2 rounded text-center mt-2">
            <p className="text-sm">
              <span className="font-medium">Current Conditions:</span> 
              {trafficDetails.avgDelay < 120 ? ' Light' : 
               trafficDetails.avgDelay < 300 ? ' Moderate' : ' Heavy'} traffic 
              ({Math.round(trafficDetails.avgDelay / 60)} min delay)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficPanel;