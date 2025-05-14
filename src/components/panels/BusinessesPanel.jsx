import React from 'react';

const BusinessesPanel = ({ data, onViewMore }) => {
  // If we have the updated data structure with additional business types
  const hasExpandedData = data.healthcare || data.schools || data.transit;
  
  // Get the most relevant businesses to display in the panel
  const getDisplayBusinesses = () => {
    if (!hasExpandedData) {
      // Use the legacy format
      return data.businesses ? data.businesses.join(', ') : 'None found';
    }
    
    // Create a prioritized list of businesses from different categories
    const priorityList = [];
    
    // Add one restaurant if available
    if (data.restaurants && data.restaurants.length > 0) {
      priorityList.push(`${data.restaurants[0].name} (Restaurant)`);
    }
    
    // Add one retail if available
    if (data.retail && data.retail.length > 0) {
      priorityList.push(`${data.retail[0].name} (Retail)`);
    }
    
    // Add one healthcare if available
    if (data.healthcare && data.healthcare.length > 0) {
      priorityList.push(`${data.healthcare[0].name} (Healthcare)`);
    }
    
    // Add one school if available
    if (data.schools && data.schools.length > 0) {
      priorityList.push(`${data.schools[0].name} (School)`);
    }
    
    // Add one transit option if available
    if (data.transit && data.transit.length > 0) {
      priorityList.push(`${data.transit[0].name} (Transit)`);
    }
    
    // Add one gas station if available
    if (data.fuel && data.fuel.length > 0) {
      priorityList.push(`${data.fuel[0].name} (Gas)`);
    }
    
    // Get up to 3 items
    return priorityList.length > 0 ? priorityList.slice(0, 3).join(', ') : 'None found';
  };
  
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
  
  // Get category counts
  const getCategoryCounts = () => {
    if (!hasExpandedData) {
      return null;
    }
    
    const categories = [];
    
    if ((data.restaurants || []).length > 0) {
      categories.push(`${(data.restaurants || []).length} restaurants`);
    }
    
    if ((data.retail || []).length > 0) {
      categories.push(`${(data.retail || []).length} retail`);
    }
    
    if ((data.schools || []).length > 0) {
      categories.push(`${(data.schools || []).length} schools`);
    }
    
    if ((data.healthcare || []).length > 0) {
      categories.push(`${(data.healthcare || []).length} healthcare`);
    }
    
    if ((data.transit || []).length > 0) {
      categories.push(`${(data.transit || []).length} transit`);
    }
    
    if ((data.fuel || []).length > 0) {
      categories.push(`${(data.fuel || []).length} gas stations`);
    }
    
    return categories.length > 0 ? categories.join(', ') : null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-indigo-700">Nearby Points of Interest</h2>
        <button 
          onClick={onViewMore}
          className="text-indigo-600 border border-indigo-600 px-3 py-1 rounded hover:bg-indigo-50 text-sm"
        >
          More Info
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-700">
          {getDisplayBusinesses()}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Total POIs:</span> {getTotalPOIs()}
        </p>
        {getCategoryCounts() && (
          <p className="text-gray-700 text-sm">
            <span className="font-medium">Categories:</span> {getCategoryCounts()}
          </p>
        )}
        <p className="text-gray-700">
          <span className="font-medium">Distance:</span> {getDistanceText()}
        </p>
      </div>
    </div>
  );
};

export default BusinessesPanel;