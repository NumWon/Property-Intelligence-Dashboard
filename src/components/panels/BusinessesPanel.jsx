// src/components/panels/BusinessesPanel.jsx
import React from 'react';

const BusinessesPanel = ({ data, onViewMore }) => {
  // If we have the updated data structure with additional business types
  const hasExpandedData = data.healthcare || data.schools || data.transit;
  
  // Count total POIs
  const getTotalPOIs = () => {
    if (!hasExpandedData) {
      return data.businesses ? data.businesses.length : 0;
    }
    
    let count = 0;
    count += (data.restaurants || []).length;
    count += (data.retail || []).length;
    count += (data.fuel || []).length;
    count += (data.schools || []).length;
    count += (data.healthcare || []).length;
    count += (data.transit || []).length;
    count += (data.entertainment || []).length;
    count += (data.services || []).length;
    
    return count;
  };
  
  // Get distance text
  const getDistanceText = () => {
    if (data.distance) {
      return data.distance;
    }
    
    if (hasExpandedData) {
      // If we have expanded data, calculate the distance based on the closest POI
      const allBusinesses = [
        ...(data.restaurants || []),
        ...(data.retail || []),
        ...(data.fuel || []),
        ...(data.schools || []),
        ...(data.healthcare || []),
        ...(data.transit || []),
        ...(data.entertainment || []),
        ...(data.services || [])
      ];
      
      if (allBusinesses.length > 0) {
        // Sort by distance
        allBusinesses.sort((a, b) => {
          if (a.distanceMeters !== undefined && b.distanceMeters !== undefined) {
            return a.distanceMeters - b.distanceMeters;
          }
          
          // Fallback to parsing from distance string
          const getDistanceValue = (distance) => {
            const match = distance.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[0]) : 999;
          };
          
          return getDistanceValue(a.distance) - getDistanceValue(b.distance);
        });
        
        return `closest is ${allBusinesses[0].distance} away`;
      }
    }
    
    return 'nearby';
  };

  // Get the most relevant businesses for display
  const getClosestBusinesses = () => {
    if (!hasExpandedData) {
      return data.businesses && data.businesses.length > 0 ? 
        data.businesses.slice(0, 2).join(', ') : 'None found';
    }
    
    // Collect all businesses
    const allBusinesses = [
      ...(data.restaurants || []),
      ...(data.retail || []),
      ...(data.fuel || []),
      ...(data.schools || []),
      ...(data.healthcare || []),
      ...(data.transit || []),
      ...(data.entertainment || []),
      ...(data.services || [])
    ];
    
    // Sort by distance
    allBusinesses.sort((a, b) => {
      if (a.distanceMeters !== undefined && b.distanceMeters !== undefined) {
        return a.distanceMeters - b.distanceMeters;
      }
      
      // Fallback to parsing from distance string
      const getDistanceValue = (distance) => {
        const match = distance.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[0]) : 999;
      };
      
      return getDistanceValue(a.distance) - getDistanceValue(b.distance);
    });
    
    // Get the closest 2 POIs
    return allBusinesses.length > 0 ? 
      allBusinesses.slice(0, 2).map(b => b.name).join(', ') : 'None found';
  };

  return (
    <div className="bg-white p-4 shadow-md rounded-2xl border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-indigo-700">Nearby Points of Interest</h2>
        <button 
          onClick={onViewMore}
          className="text-sm text-indigo-600 border border-indigo-300 px-2 py-1 rounded hover:bg-indigo-50"
        >
          More Info
        </button>
      </div>
      
      {/* POI Category Summary */}
      {hasExpandedData && (
        <div className="mb-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border rounded p-1 text-center">
              <p className="text-xs text-gray-500">Restaurants</p>
              <p className="text-base font-bold text-red-500">{(data.restaurants || []).length}</p>
            </div>
            <div className="bg-white border rounded p-1 text-center">
              <p className="text-xs text-gray-500">Retail</p>
              <p className="text-base font-bold text-blue-500">{(data.retail || []).length}</p>
            </div>
            <div className="bg-white border rounded p-1 text-center">
              <p className="text-xs text-gray-500">Gas</p>
              <p className="text-base font-bold text-green-500">{(data.fuel || []).length}</p>
            </div>
            <div className="bg-white border rounded p-1 text-center">
              <p className="text-xs text-gray-500">Schools</p>
              <p className="text-base font-bold text-yellow-500">{(data.schools || []).length}</p>
            </div>
            <div className="bg-white border rounded p-1 text-center">
              <p className="text-xs text-gray-500">Health</p>
              <p className="text-base font-bold text-pink-500">{(data.healthcare || []).length}</p>
            </div>
            <div className="bg-white border rounded p-1 text-center">
              <p className="text-xs text-gray-500">Transit</p>
              <p className="text-base font-bold text-purple-500">{(data.transit || []).length}</p>
            </div>
            <div className="bg-white border rounded p-1 text-center">
              <p className="text-xs text-gray-500">Entertain</p>
              <p className="text-base font-bold text-amber-500">{(data.entertainment || []).length}</p>
            </div>
            <div className="bg-white border rounded p-1 text-center">
              <p className="text-xs text-gray-500">Services</p>
              <p className="text-base font-bold text-cyan-500">{(data.services || []).length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessesPanel;