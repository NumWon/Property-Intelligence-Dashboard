import { HERE_CONFIG } from './hereApiConfig';

export const getNearbyBusinesses = async (coordinates, radius = 1000) => {
  try {
    console.log("Fetching nearby businesses for coordinates:", coordinates);
    
    // Use the Browse endpoint to search for POIs with more categories
    // Category IDs reference:
    // 100-XXX = Food and drink (100-1000 = Restaurant)
    // 200-XXX = Shopping (200-2000 = Shopping mall)
    // 300-XXX = Tourism (300-3000 = Tourist attraction)
    // 400-XXX = Entertainment and leisure (400-4000 = Cinema)
    // 500-XXX = Lodging (500-5000 = Hotel)
    // 600-XXX = Public transit (600-6100 = Train station)
    // 700-XXX = Service (700-7600-0116 = Gas station, 700-7500 = ATM)
    // 800-XXX = Medical services (800-8000 = Hospital, 800-8500 = Pharmacy)
    
    // Create the base URL for POI search
    const url = `${HERE_CONFIG.geocoding_url}/browse?at=${coordinates.lat},${coordinates.lng}&limit=100&categories=100,200,300,400,500,600,700,800&apiKey=${HERE_CONFIG.api_key}`;
    
    console.log("Fetching from URL:", url.replace(HERE_CONFIG.api_key, "API_KEY_HIDDEN"));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`POI search failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data.items?.length || 0} POIs from API`);
    
    // Categorize the results
    const businesses = {
      restaurants: [],
      retail: [],
      fuel: [],
      schools: [],
      healthcare: [],
      transit: [],
      entertainment: [],
      services: []
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
        
        // Create business object with common properties
        const business = {
          name: item.title,
          distance: distanceText,
          address: item.address?.label || 'Unknown address',
          categories: item.categories || [],
          position: item.position,
          distanceMeters: distance // Store raw distance for sorting
        };
        
        // Categorize based on item categories
        if (item.categories) {
          const categoryIds = item.categories.map(cat => cat.id);
          
          // Food category (restaurants, cafes, etc.)
          if (categoryIds.some(id => id.startsWith('100'))) {
            businesses.restaurants.push(business);
          } 
          // Shopping category (retail stores, malls, etc.)
          else if (categoryIds.some(id => id.startsWith('200'))) {
            businesses.retail.push(business);
          } 
          // Gas stations
          else if (categoryIds.some(id => id === '700-7600-0116' || id.startsWith('700-7600'))) {
            businesses.fuel.push(business);
          }
          // Educational institutions (schools, universities)
          else if (categoryIds.some(id => id.startsWith('800-8100') || id.startsWith('800-8200'))) {
            businesses.schools.push(business);
          }
          // Healthcare facilities (hospitals, clinics, pharmacies)
          else if (categoryIds.some(id => id.startsWith('800'))) {
            businesses.healthcare.push(business);
          }
          // Public transit (bus stops, train stations)
          else if (categoryIds.some(id => id.startsWith('600'))) {
            businesses.transit.push(business);
          }
          // Entertainment venues (cinemas, theaters, etc.)
          else if (categoryIds.some(id => id.startsWith('400'))) {
            businesses.entertainment.push(business);
          }
          // Other services (banks, post offices, etc.)
          else if (categoryIds.some(id => id.startsWith('700') && !id.startsWith('700-7600'))) {
            businesses.services.push(business);
          }
          // Tourism and attractions would go to entertainment
          else if (categoryIds.some(id => id.startsWith('300'))) {
            businesses.entertainment.push(business);
          }
        }
      });
    }
    
    // Sort each category by distance
    for (const category in businesses) {
      if (businesses[category].length > 0) {
        businesses[category].sort((a, b) => a.distanceMeters - b.distanceMeters);
      }
    }
    
    console.log("Categorized businesses:", {
      restaurants: businesses.restaurants.length,
      retail: businesses.retail.length,
      fuel: businesses.fuel.length,
      schools: businesses.schools.length,
      healthcare: businesses.healthcare.length,
      transit: businesses.transit.length,
      entertainment: businesses.entertainment.length,
      services: businesses.services.length
    });
    
    return businesses;
  } catch (error) {
    console.error('Error fetching nearby businesses:', error);
    // Return empty results if search fails
    return {
      restaurants: [],
      retail: [],
      fuel: [],
      schools: [],
      healthcare: [],
      transit: [],
      entertainment: [],
      services: []
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