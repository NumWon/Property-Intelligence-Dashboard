// src/services/routingService.js
import { HERE_CONFIG } from './hereApiConfig';

/**
 * Calculate offset based on latitude to account for Earth's curvature
 * @param {number} latitude - Current latitude
 * @returns {object} - Latitude and longitude offsets for 1km distance
 */
const calculateOffsets = (latitude) => {
  // Earth's radius in km
  const R = 6371;
  
  // 1km in latitude degrees is fairly constant
  const latOffset = 1 / 111.32;
  
  // 1km in longitude degrees varies with latitude
  const lonOffset = 1 / (111.32 * Math.cos(latitude * (Math.PI / 180)));
  
  return {
    latOffset,
    lonOffset
  };
};

/**
 * Get route with traffic information between two points
 * @param {object} originCoords - Starting coordinates {lat, lng}
 * @param {object} destCoords - Destination coordinates {lat, lng}
 * @returns {object} - Traffic information for the route
 */
const getRouteWithTraffic = async (originCoords, destCoords) => {
  try {
    console.log(`Getting route from ${JSON.stringify(originCoords)} to ${JSON.stringify(destCoords)}`);
    
    // Validate coordinates
    if (!originCoords || !destCoords || 
        !originCoords.lat || !originCoords.lng || 
        !destCoords.lat || !destCoords.lng) {
      console.error("Invalid coordinates provided:", { originCoords, destCoords });
      throw new Error('Invalid coordinates for routing');
    }
    
    // Check if HERE_CONFIG is properly set up
    if (!HERE_CONFIG || !HERE_CONFIG.routing_url || !HERE_CONFIG.api_key) {
      console.error("HERE_CONFIG is missing or incomplete:", HERE_CONFIG);
      throw new Error('HERE Maps configuration is missing');
    }
    
    // Use departure_time=now to get current traffic conditions
    const url = `${HERE_CONFIG.routing_url}/routes?transportMode=car&origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&return=summary,travelSummary&departureTime=now&apiKey=${HERE_CONFIG.api_key}`;
    
    console.log(`Fetching route from API: ${url.replace(HERE_CONFIG.api_key, "API_KEY_HIDDEN")}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Routing API error: ${response.status} ${response.statusText}`);
      throw new Error(`Routing failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received route data:", data);
    
    if (!data.routes || data.routes.length === 0) {
      console.error("No routes found in API response");
      throw new Error('No route found between these points');
    }
    
    const route = data.routes[0];
    const sections = route.sections;
    
    if (!sections || sections.length === 0) {
      console.error("No sections found in route");
      throw new Error('Invalid route data received');
    }
    
    // Extract useful traffic information
    const trafficInfo = {
      totalDistance: sections.reduce((total, section) => total + (section.summary?.length || 0), 0),
      baseTime: sections.reduce((total, section) => total + (section.summary?.baseDuration || section.summary?.duration || 0), 0),
      trafficTime: sections.reduce((total, section) => total + (section.summary?.duration || 0), 0),
      trafficDelayInSeconds: 0,
      trafficCondition: 'Normal',
      route: route
    };
    
    console.log("Extracted traffic info:", trafficInfo);
    
    // Calculate actual traffic delay from API response
    trafficInfo.trafficDelayInSeconds = trafficInfo.trafficTime - trafficInfo.baseTime;
    
    // If API doesn't provide good delay info, calculate a reasonable estimate
    if (trafficInfo.trafficDelayInSeconds <= 0) {
      // Estimate based on road type and distance
      const isUrban = sections.some(section => 
        section.summary?.length < 5000 && section.summary?.duration > 300);
      const isHighway = sections.some(section =>
        section.transport?.mode === 'car' && 
        section.summary?.length > 5000 && 
        section.summary?.duration / section.summary?.length < 0.1);
      
      // Create more realistic delay factors
      let delayFactor = 0;
      
      if (isUrban && isHighway) {
        delayFactor = 0.3; // Urban highways - moderate delay
      } else if (isUrban) {
        delayFactor = 0.4; // Urban roads - higher delay
      } else if (isHighway) {
        delayFactor = 0.15; // Rural highways - lower delay
      } else {
        delayFactor = 0.1; // Rural roads - minimal delay
      }
      
      // Apply time-of-day factor
      const hour = new Date().getHours();
      let timeFactor = 1.0;
      
      // Peak morning hours
      if (hour >= 7 && hour <= 9) {
        timeFactor = 1.5;
      }
      // Peak evening hours
      else if (hour >= 16 && hour <= 19) {
        timeFactor = 1.8;
      }
      // Late night
      else if (hour >= 22 || hour <= 5) {
        timeFactor = 0.5;
      }
      
      trafficInfo.trafficDelayInSeconds = Math.round(trafficInfo.baseTime * delayFactor * timeFactor);
      console.log(`Calculated estimated delay: ${trafficInfo.trafficDelayInSeconds}s (factor: ${delayFactor}, time: ${timeFactor})`);
    }
    
    // Determine traffic condition based on delay
    if (trafficInfo.trafficDelayInSeconds <= 60) {
      trafficInfo.trafficCondition = 'Normal';
    } else if (trafficInfo.trafficDelayInSeconds <= 300) {
      trafficInfo.trafficCondition = 'Moderate';
    } else {
      trafficInfo.trafficCondition = 'Heavy';
    }
    
    console.log(`Final traffic condition: ${trafficInfo.trafficCondition}`);
    return trafficInfo;
  } catch (error) {
    console.error('Routing error:', error);
    throw error;
  }
};

/**
 * Estimate property traffic based on surrounding routes
 * @param {object} coordinates - Property coordinates {lat, lng}
 * @returns {object} - Traffic data for the property
 */
export const estimatePropertyTraffic = async (coordinates) => {
  console.log("Estimating property traffic for coordinates:", coordinates);
  
  try {
    // Validate coordinates
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      console.error("Invalid property coordinates:", coordinates);
      throw new Error('Invalid property coordinates');
    }
    
    // Get the local time hour to estimate peak hours
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    console.log(`Current time: ${now.toLocaleTimeString()}, day: ${dayOfWeek}, isWeekend: ${isWeekend}`);
    
    // Calculate proper offsets based on location (accounts for Earth's curvature)
    const { latOffset, lonOffset } = calculateOffsets(coordinates.lat);
    
    // Distance in km for route points (0.5km for urban, 1km for others)
    const distance = 1.0;
    
    // Create points around the property using proper offsets
    const pointNorth = { lat: coordinates.lat + (latOffset * distance), lng: coordinates.lng };
    const pointSouth = { lat: coordinates.lat - (latOffset * distance), lng: coordinates.lng };
    const pointEast = { lat: coordinates.lat, lng: coordinates.lng + (lonOffset * distance) };
    const pointWest = { lat: coordinates.lat, lng: coordinates.lng - (lonOffset * distance) };
    
    // Add diagonal points for better coverage
    const pointNorthEast = { 
      lat: coordinates.lat + (latOffset * distance * 0.7), 
      lng: coordinates.lng + (lonOffset * distance * 0.7) 
    };
    const pointSouthWest = { 
      lat: coordinates.lat - (latOffset * distance * 0.7), 
      lng: coordinates.lng - (lonOffset * distance * 0.7) 
    };
    
    console.log("Generated points around property:", {
      pointNorth, pointSouth, pointEast, pointWest, pointNorthEast, pointSouthWest
    });
    
    // Get routes between these points to analyze traffic
    console.log("Getting routes between points...");
    
    const routes = await Promise.allSettled([
      getRouteWithTraffic(pointNorth, pointSouth),
      getRouteWithTraffic(pointEast, pointWest),
      getRouteWithTraffic(pointNorthEast, pointSouthWest)
    ]);
    
    console.log(`Received ${routes.length} route responses`);
    
    // Filter for fulfilled promises and extract their values
    const successfulRoutes = routes
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    console.log(`${successfulRoutes.length} routes were successful`);
    
    if (successfulRoutes.length === 0) {
      console.error("No successful routes found");
      throw new Error('Could not calculate traffic for any routes');
    }
    
    // Calculate average traffic conditions
    const avgTrafficDelay = successfulRoutes.reduce(
      (sum, route) => sum + route.trafficDelayInSeconds, 0
    ) / successfulRoutes.length;
    
    // Calculate average route distance
    const avgDistance = successfulRoutes.reduce(
      (sum, route) => sum + route.totalDistance, 0
    ) / successfulRoutes.length;
    
    console.log(`Average traffic delay: ${avgTrafficDelay}s, Average distance: ${avgDistance}m`);
    
    // Improved vehicle count estimation based on road characteristics
    let baseEstimate = 0;
    
    // Determine road type based on the route information
    const hasHighway = successfulRoutes.some(route => 
      route.route.sections.some(section => 
        section.summary.length > 5000 && section.summary.duration / section.summary.length < 0.1)
    );
    
    const hasArterial = successfulRoutes.some(route => 
      route.route.sections.some(section => 
        section.summary.length > 2000 && section.summary.length <= 5000)
    );
    
    console.log(`Road characteristics - hasHighway: ${hasHighway}, hasArterial: ${hasArterial}`);
    
    // More realistic base estimates by road type
    if (hasHighway) {
      // Highway or expressway
      baseEstimate = isWeekend ? 30000 : 45000;
    } else if (hasArterial) {
      // Major arterial or collector road
      baseEstimate = isWeekend ? 15000 : 25000;
    } else if (avgDistance > 2000) {
      // Minor arterial or collector road
      baseEstimate = isWeekend ? 8000 : 15000;
    } else {
      // Local street or residential
      baseEstimate = isWeekend ? 3000 : 6000;
    }
    
    console.log(`Base vehicle estimate: ${baseEstimate}`);
    
    // Apply time-of-day adjustments
    let timeMultiplier = 1.0;
    
    // Morning rush hour
    if (hour >= 7 && hour <= 9 && !isWeekend) {
      timeMultiplier = 1.4;
    }
    // Evening rush hour
    else if (hour >= 16 && hour <= 19 && !isWeekend) {
      timeMultiplier = 1.5;
    }
    // Late night
    else if (hour >= 22 || hour <= 5) {
      timeMultiplier = 0.3;
    }
    // Mid-day
    else if (hour >= 10 && hour <= 15) {
      timeMultiplier = 0.8;
    }
    // Weekend adjustment
    if (isWeekend) {
      if (hour >= 10 && hour <= 16) {
        timeMultiplier = 0.9; // Weekend shopping hours
      } else {
        timeMultiplier = 0.6; // Other weekend times
      }
    }
    
    console.log(`Time multiplier: ${timeMultiplier}`);
    
    // Adjust estimate based on traffic conditions - more reasonable multiplier
    // This represents how current traffic conditions compare to the baseline
    const trafficMultiplier = 1 + Math.min(avgTrafficDelay / 600, 0.5); // Cap at 1.5x
    console.log(`Traffic multiplier: ${trafficMultiplier}`);
    
    // Calculate final vehicle count
    const estimatedDailyVehicles = Math.round(baseEstimate * trafficMultiplier);
    
    // Current hourly vehicle count based on time factor
    const currentHourlyVehicles = Math.round((estimatedDailyVehicles / 24) * timeMultiplier);
    
    console.log(`Final estimates - Daily: ${estimatedDailyVehicles}, Hourly: ${currentHourlyVehicles}`);
    
    // Determine peak hours - more accurately based on day of week
    let morningPeak = isWeekend ? '11 AM-1 PM' : '7-9 AM';
    let eveningPeak = isWeekend ? '2-4 PM' : '4-6 PM';
    
    // Improved foot traffic estimation
    const footTrafficLevel = estimateFootTraffic(
      estimatedDailyVehicles, 
      coordinates, 
      hasHighway,
      isWeekend
    );
    
    console.log(`Foot traffic level: ${footTrafficLevel}`);
    
    // Create the result object
    const result = {
      average: `${estimatedDailyVehicles.toLocaleString()} vehicles/day`,
      peak: `${morningPeak}, ${eveningPeak}`,
      current: `${currentHourlyVehicles.toLocaleString()} vehicles/hour`,
      vehicleCount: estimatedDailyVehicles,
      peakHours: `${morningPeak}, ${eveningPeak}`,
      footTraffic: footTrafficLevel,
      trafficDetails: {
        avgDelay: avgTrafficDelay,
        avgDistance: avgDistance,
        routes: successfulRoutes,
        currentHourlyVolume: currentHourlyVehicles
      }
    };
    
    console.log("Returning traffic estimate:", result);
    return result;
  } catch (error) {
    console.error('Traffic estimation error:', error);
    // Return fallback values if estimation fails
    return {
      average: '10,000-15,000 vehicles/day (estimated)',
      peak: '7-9 AM, 4-6 PM (typical)',
      current: 'Data unavailable',
      vehicleCount: 12000,
      peakHours: '7-9 AM, 4-6 PM',
      footTraffic: 'Moderate (estimated 500-800 pedestrians/day)',
      trafficDetails: {
        avgDelay: 0,
        error: error.message
      }
    };
  }
};

/**
 * Improved foot traffic estimation based on multiple factors
 * @param {number} vehicleCount - Estimated daily vehicle count
 * @param {object} coordinates - Property location
 * @param {boolean} isHighway - Whether the area has highways
 * @param {boolean} isWeekend - Whether it's currently weekend
 * @returns {string} - Foot traffic estimate description
 */
function estimateFootTraffic(vehicleCount, coordinates, isHighway, isWeekend) {
  console.log(`Estimating foot traffic - vehicleCount: ${vehicleCount}, isHighway: ${isHighway}, isWeekend: ${isWeekend}`);
  
  // Start with a more reasonable baseline
  // Higher vehicle counts generally have LESS pedestrian traffic (highways vs downtown)
  let pedestrianScore = 0;
  
  // Base score inversely related to vehicle count but on a reasonable scale
  if (vehicleCount > 40000) {
    // Likely highway, very low pedestrian traffic
    pedestrianScore = 0.5;
  } else if (vehicleCount > 25000) {
    // Major road with some pedestrian traffic
    pedestrianScore = 1.0;
  } else if (vehicleCount > 15000) {
    // Busy road, moderate pedestrian traffic
    pedestrianScore = 1.5;
  } else if (vehicleCount > 8000) {
    // Secondary road, good pedestrian traffic
    pedestrianScore = 2.0;
  } else {
    // Local road, potentially high pedestrian traffic
    pedestrianScore = 2.5;
  }
  
  console.log(`Initial pedestrian score: ${pedestrianScore}`);
  
  // Highways typically have very low pedestrian traffic regardless of other factors
  if (isHighway) {
    pedestrianScore = Math.min(pedestrianScore, 0.8);
    console.log(`Highway adjustment: ${pedestrianScore}`);
  }
  
  // Weekend adjustment - typically higher in commercial areas, lower in business districts
  if (isWeekend) {
    // We'd ideally use land use data here, but for now we'll estimate
    const isLikelyCommercial = vehicleCount > 8000 && vehicleCount < 25000;
    if (isLikelyCommercial) {
      pedestrianScore += 0.5;
      console.log(`Weekend commercial area adjustment: +0.5`);
    } else {
      pedestrianScore -= 0.2;
      console.log(`Weekend non-commercial area adjustment: -0.2`);
    }
  }
  
  console.log(`Final pedestrian score: ${pedestrianScore}`);
  
  // Categorize based on the score (more realistic ranges)
  if (pedestrianScore > 3.0) {
    return 'Very High (estimated 2,000+ pedestrians/day)';
  } else if (pedestrianScore > 2.5) {
    return 'High (estimated 1,000-2,000 pedestrians/day)';
  } else if (pedestrianScore > 2.0) {
    return 'Moderate to High (estimated 800-1,000 pedestrians/day)';
  } else if (pedestrianScore > 1.5) {
    return 'Moderate (estimated 500-800 pedestrians/day)';
  } else if (pedestrianScore > 1.0) {
    return 'Low to Moderate (estimated 300-500 pedestrians/day)';
  } else if (pedestrianScore > 0.5) {
    return 'Low (estimated 100-300 pedestrians/day)';
  } else {
    return 'Very Low (estimated <100 pedestrians/day)';
  }
}