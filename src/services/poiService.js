import { HERE_CONFIG } from './hereApiConfig';

export const getNearbyBusinesses = async (coordinates, radius = 1000) => {
  try {
    // Use the Browse endpoint to search for POIs
    const url = `${HERE_CONFIG.geocoding_url}/browse?at=${coordinates.lat},${coordinates.lng}&limit=50&categories=100,200,300&apiKey=${HERE_CONFIG.api_key}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`POI search failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Categorize the results
    const businesses = {
      restaurants: [],
      retail: [],
      fuel: []
    };
    
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        // Calculate distance
        const distance = calculateDistance(
          coordinates.lat, 
          coordinates.lng, 
          item.position.lat, 
          item.position.lng
        );
        
        const distanceText = `${(distance / 1000).toFixed(1)} km`;
        
        // Categorize based on item categories
        if (item.categories) {
          const categoryIds = item.categories.map(cat => cat.id);
          
          if (categoryIds.some(id => id.startsWith('100'))) {
            // Food category
            businesses.restaurants.push({
              name: item.title,
              distance: distanceText,
              address: item.address?.label || 'Unknown address'
            });
          } else if (categoryIds.some(id => id.startsWith('200'))) {
            // Shopping category
            businesses.retail.push({
              name: item.title,
              distance: distanceText,
              address: item.address?.label || 'Unknown address'
            });
          } else if (categoryIds.some(id => id === '700-7600-0116')) {
            // Gas station category
            businesses.fuel.push({
              name: item.title,
              distance: distanceText,
              address: item.address?.label || 'Unknown address'
            });
          }
        }
      });
    }
    
    return businesses;
  } catch (error) {
    console.error('Error fetching nearby businesses:', error);
    // Return empty results if search fails
    return {
      restaurants: [],
      retail: [],
      fuel: []
    };
  }
};

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // distance in meters
}