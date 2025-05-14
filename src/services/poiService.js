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
        // Log category information for debugging
        console.log(`POI: ${item.title}, Categories:`, item.categories ? item.categories.map(c => `${c.id}:${c.name}`).join(', ') : 'none');
        
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
        
        // More precise category matching using exact category IDs and names
        let categoryAssigned = false;
        
        if (item.categories && item.categories.length > 0) {
          const categoryIds = item.categories.map(cat => cat.id);
          const categoryNames = item.categories.map(cat => cat.name.toLowerCase());
          
          // Helper function to check if any category in list contains specific text
          const hasCategory = (textList) => {
            return categoryNames.some(name => 
              textList.some(text => name.includes(text))
            );
          };
          
          // Schools: Look for education-related categories
          if (categoryIds.some(id => id.startsWith('800-81')) || 
              hasCategory(['school', 'education', 'university', 'college', 'campus'])) {
            // Try to identify school type
            let schoolType = "";
            if (categoryNames.some(name => name.includes('elementary') || name.includes('primary'))) {
              schoolType = "Elementary School";
            } else if (categoryNames.some(name => name.includes('middle') || name.includes('junior high'))) {
              schoolType = "Middle School";
            } else if (categoryNames.some(name => name.includes('high school'))) {
              schoolType = "High School";
            } else if (categoryNames.some(name => name.includes('university') || name.includes('college'))) {
              schoolType = item.title.toLowerCase().includes('university') ? "University" : "College";
            } else {
              schoolType = "School";
            }
            
            // If the title doesn't clearly indicate it's a school, append the type
            const name = item.title;
            const enhancedName = name.toLowerCase().includes('school') || 
                                name.toLowerCase().includes('university') || 
                                name.toLowerCase().includes('college') ? 
                                name : `${name} (${schoolType})`;
            
            businesses.schools.push({
              ...business,
              name: enhancedName
            });
            categoryAssigned = true;
          }
          
          // Healthcare: Look for medical facilities
          else if (categoryIds.some(id => id.startsWith('800') && !id.startsWith('800-81')) || 
                   hasCategory(['hospital', 'clinic', 'medical', 'doctor', 'pharmacy', 'health'])) {
            // Try to identify healthcare type
            let healthcareType = "";
            if (categoryNames.some(name => name.includes('hospital'))) {
              healthcareType = "Hospital";
            } else if (categoryNames.some(name => name.includes('clinic'))) {
              healthcareType = "Clinic";
            } else if (categoryNames.some(name => name.includes('pharmacy'))) {
              healthcareType = "Pharmacy";
            } else if (categoryNames.some(name => name.includes('doctor') || name.includes('physician'))) {
              healthcareType = "Doctor's Office";
            } else {
              healthcareType = "Healthcare";
            }
            
            // If the title doesn't clearly indicate it's a healthcare facility, append the type
            const name = item.title;
            const enhancedName = name.toLowerCase().includes('hospital') || 
                                name.toLowerCase().includes('clinic') || 
                                name.toLowerCase().includes('pharmacy') || 
                                name.toLowerCase().includes('medical') ? 
                                name : `${name} (${healthcareType})`;
            
            businesses.healthcare.push({
              ...business,
              name: enhancedName
            });
            categoryAssigned = true;
          }
          
          // Transit: Public transportation
          else if (categoryIds.some(id => id.startsWith('600')) || 
                  hasCategory(['station', 'stop', 'terminal', 'transit', 'train', 'bus', 'subway', 'metro'])) {
            
            // Check if this is actually a transit point or just a business near transit
            // Look for specific transit keywords in title or categories
            const isActualTransitPoint = 
              item.title.toLowerCase().includes('station') ||
              item.title.toLowerCase().includes('stop') ||
              item.title.toLowerCase().includes('terminal') ||
              item.title.toLowerCase().includes('platform') ||
              item.title.toLowerCase().includes('line') ||
              item.title.toLowerCase().includes('route') ||
              categoryNames.some(name => 
                name.includes('station') || 
                name.includes('stop') || 
                name.includes('terminal') ||
                name.includes('platform')
              );
            
            // If it's an actual transit point, enhance the name to be more descriptive
            if (isActualTransitPoint) {
              // Try to extract transit type from categories or title
              let transitType = "Transit";
              
              // Check for transit type in categories
              if (categoryNames.some(name => name.includes('bus'))) {
                transitType = "Bus";
              } else if (categoryNames.some(name => name.includes('train') || name.includes('rail'))) {
                transitType = "Train";
              } else if (categoryNames.some(name => name.includes('subway') || name.includes('metro'))) {
                transitType = "Subway";
              } else if (categoryNames.some(name => name.includes('tram'))) {
                transitType = "Tram";
              } else if (categoryNames.some(name => name.includes('ferry'))) {
                transitType = "Ferry";
              } else if (categoryNames.some(name => name.includes('airport'))) {
                transitType = "Airport";
              }
              
              // If no transit type in categories, check the title
              if (transitType === "Transit") {
                const title = item.title.toLowerCase();
                if (title.includes('bus')) {
                  transitType = "Bus";
                } else if (title.includes('train') || title.includes('rail')) {
                  transitType = "Train";
                } else if (title.includes('subway') || title.includes('metro')) {
                  transitType = "Subway";
                } else if (title.includes('tram')) {
                  transitType = "Tram";
                } else if (title.includes('ferry')) {
                  transitType = "Ferry";
                } else if (title.includes('airport')) {
                  transitType = "Airport";
                }
              }
              
              // Create a more descriptive transit name
              let transitName = item.title;
              
              // If the title doesn't already have the transit type, add it
              if (!item.title.toLowerCase().includes(transitType.toLowerCase())) {
                // Add the transit type as a prefix
                transitName = `${transitType} - ${item.title}`;
              }
              
              // If it doesn't include station/stop/terminal, add that if it's not already implied
              if (!transitName.toLowerCase().includes('station') && 
                  !transitName.toLowerCase().includes('stop') && 
                  !transitName.toLowerCase().includes('terminal')) {
                // Check if it's likely a station or stop from the category
                if (categoryNames.some(name => name.includes('station'))) {
                  transitName += " Station";
                } else if (categoryNames.some(name => name.includes('stop'))) {
                  transitName += " Stop";
                } else if (categoryNames.some(name => name.includes('terminal'))) {
                  transitName += " Terminal";
                }
              }
              
              businesses.transit.push({
                ...business,
                name: transitName
              });
            } else {
              // It's a business that's categorized as transit-related but isn't a transit point
              // Let's categorize it based on its name instead of blindly putting it as transit
              const name = item.title.toLowerCase();
              let reclassified = false;
              
              if (name.includes('restaurant') || name.includes('cafe') || name.includes('bar')) {
                businesses.restaurants.push(business);
                reclassified = true;
              } else if (name.includes('shop') || name.includes('store') || name.includes('market')) {
                businesses.retail.push(business);
                reclassified = true;
              } else if (name.includes('hospital') || name.includes('clinic') || name.includes('pharmacy')) {
                businesses.healthcare.push(business);
                reclassified = true;
              } else if (name.includes('theater') || name.includes('cinema') || name.includes('park')) {
                businesses.entertainment.push(business);
                reclassified = true;
              } else if (name.includes('gas') || name.includes('petrol') || name.includes('fuel')) {
                businesses.fuel.push(business);
                reclassified = true;
              } else if (name.includes('school') || name.includes('college') || name.includes('university')) {
                businesses.schools.push(business);
                reclassified = true;
              }
              
              // If we couldn't reclassify it, put it as a service
              if (!reclassified) {
                businesses.services.push(business);
              }
            }
            
            categoryAssigned = true;
          }
          
          // Food: Restaurants, cafes, etc.
          else if (categoryIds.some(id => id.startsWith('100')) || 
                  hasCategory(['restaurant', 'cafe', 'bar', 'pub', 'dining', 'food'])) {
            // Try to identify restaurant type
            let restaurantType = "";
            if (categoryNames.some(name => name.includes('cafe') || name.includes('coffee'))) {
              restaurantType = "Café";
            } else if (categoryNames.some(name => name.includes('fast food'))) {
              restaurantType = "Fast Food";
            } else if (categoryNames.some(name => name.includes('bar') || name.includes('pub'))) {
              restaurantType = "Bar & Grill";
            } else {
              restaurantType = "Restaurant";
            }
            
            // If the name doesn't clearly indicate it's a restaurant, append the type
            const name = item.title;
            const isRestaurantNameClear = name.toLowerCase().includes('restaurant') || 
                                          name.toLowerCase().includes('cafe') ||
                                          name.toLowerCase().includes('bar') ||
                                          name.toLowerCase().includes('grill') ||
                                          name.toLowerCase().includes('diner');
            
            const enhancedName = isRestaurantNameClear ? name : `${name} (${restaurantType})`;
            
            businesses.restaurants.push({
              ...business,
              name: enhancedName
            });
            categoryAssigned = true;
          }
          
          // Shopping: Retail, malls, etc.
          else if (categoryIds.some(id => id.startsWith('200')) || 
                  hasCategory(['shop', 'store', 'retail', 'mall', 'market', 'supermarket'])) {
            businesses.retail.push(business);
            categoryAssigned = true;
          }
          
          // Gas stations
          else if (categoryIds.some(id => id === '700-7600-0116' || id.startsWith('700-7600-0')) || 
                  hasCategory(['gas', 'fuel', 'petrol', 'station'])) {
            businesses.fuel.push(business);
            categoryAssigned = true;
          }
          
          // Entertainment: theaters, parks, venues
          else if (categoryIds.some(id => id.startsWith('400') || id.startsWith('300')) || 
                  hasCategory(['entertainment', 'cinema', 'theater', 'venue', 'park', 'recreation'])) {
            businesses.entertainment.push(business);
            categoryAssigned = true;
          }
          
          // Other services (banks, post offices, etc.)
          else if (categoryIds.some(id => id.startsWith('700'))) {
            businesses.services.push(business);
            categoryAssigned = true;
          }
          
          // If not categorized, try to categorize by name
          if (!categoryAssigned) {
            const name = item.title.toLowerCase();
            
            if (name.includes('school') || name.includes('university') || name.includes('college')) {
              let schoolType = "School";
              if (name.includes('elementary') || name.includes('primary')) {
                schoolType = "Elementary School";
              } else if (name.includes('middle') || name.includes('junior high')) {
                schoolType = "Middle School";
              } else if (name.includes('high')) {
                schoolType = "High School";
              } else if (name.includes('university')) {
                schoolType = "University";
              } else if (name.includes('college')) {
                schoolType = "College";
              }
              
              businesses.schools.push({
                ...business,
                name: name.includes('school') || name.includes('university') || name.includes('college') ? 
                      item.title : `${item.title} (${schoolType})`
              });
            } else if (name.includes('hospital') || name.includes('clinic') || name.includes('medical') ||
                      name.includes('pharmacy') || name.includes('doctor')) {
              let healthcareType = "Healthcare";
              if (name.includes('hospital')) {
                healthcareType = "Hospital";
              } else if (name.includes('clinic')) {
                healthcareType = "Clinic";
              } else if (name.includes('pharmacy')) {
                healthcareType = "Pharmacy";
              } else if (name.includes('doctor')) {
                healthcareType = "Doctor's Office";
              }
              
              businesses.healthcare.push({
                ...business,
                name: name.includes('hospital') || name.includes('clinic') || name.includes('pharmacy') ? 
                      item.title : `${item.title} (${healthcareType})`
              });
            } else if (name.includes('station') || name.includes('stop') || name.includes('transit')) {
              let transitType = "Transit";
              if (name.includes('bus')) {
                transitType = "Bus";
              } else if (name.includes('train') || name.includes('rail')) {
                transitType = "Train";
              } else if (name.includes('subway') || name.includes('metro')) {
                transitType = "Subway";
              }
              
              businesses.transit.push({
                ...business,
                name: name.includes('station') || name.includes('stop') ? 
                      item.title : `${transitType} - ${item.title}`
              });
            } else if (name.includes('restaurant') || name.includes('cafe') || name.includes('bar') ||
                      name.includes('grill') || name.includes('food') || name.includes('bakery')) {
              businesses.restaurants.push(business);
            } else if (name.includes('shop') || name.includes('store') || name.includes('market') ||
                      name.includes('mall') || name.includes('center')) {
              businesses.retail.push(business);
            } else if (name.includes('gas') || name.includes('fuel') || name.includes('petrol')) {
              businesses.fuel.push(business);
            } else if (name.includes('theater') || name.includes('cinema') || name.includes('park') ||
                      name.includes('recreation') || name.includes('entertainment')) {
              businesses.entertainment.push(business);
            } else {
              // Default to services for uncategorized items
              businesses.services.push(business);
            }
          }
        } else {
          // No categories available, try to guess from name
          const name = item.title.toLowerCase();
          
          if (name.includes('school') || name.includes('university') || name.includes('college')) {
            businesses.schools.push(business);
          } else if (name.includes('hospital') || name.includes('clinic') || name.includes('medical') ||
                    name.includes('pharmacy') || name.includes('doctor')) {
            businesses.healthcare.push(business);
          } else if (name.includes('station') || name.includes('stop') || name.includes('transit')) {
            businesses.transit.push(business);
          } else if (name.includes('restaurant') || name.includes('cafe') || name.includes('bar') ||
                    name.includes('grill') || name.includes('food') || name.includes('bakery')) {
            businesses.restaurants.push(business);
          } else if (name.includes('shop') || name.includes('store') || name.includes('market') ||
                    name.includes('mall') || name.includes('center')) {
            businesses.retail.push(business);
          } else if (name.includes('gas') || name.includes('fuel') || name.includes('petrol')) {
            businesses.fuel.push(business);
          } else if (name.includes('theater') || name.includes('cinema') || name.includes('park') ||
                    name.includes('recreation') || name.includes('entertainment')) {
            businesses.entertainment.push(business);
          } else {
            // Default to services for uncategorized items
            businesses.services.push(business);
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