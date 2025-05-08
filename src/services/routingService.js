// src/services/routingService.js
import { HERE_CONFIG } from './hereApiConfig';

/**
 * Calculate the distance between two coordinates in kilometers (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} - Distance in kilometers
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} - Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Generate a deterministic variation factor based on coordinates
 * This ensures the same coordinates always produce the same traffic values
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {number} - Variation factor between 0.9 and 1.1
 */
function getCoordinateVariationFactor(lat, lng) {
  // Use the decimal portion of the coordinates to generate a consistent factor
  const latDecimal = Math.abs(lat) % 1;
  const lngDecimal = Math.abs(lng) % 1;
  
  // Combine the decimals to get a value between 0 and 1
  const combined = (latDecimal + lngDecimal) / 2;
  
  // Scale to the range 0.9 to 1.1
  return 0.9 + (combined * 0.2);
}

/**
 * Major urban centers in North America with coordinates and population density indicators
 * Used to estimate traffic based on proximity to urban centers
 */
const urbanCenters = [
  { name: "New York", lat: 40.7128, lng: -74.0060, density: 10 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, density: 9 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, density: 8 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832, density: 8 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194, density: 9 },
  { name: "Boston", lat: 42.3601, lng: -71.0589, density: 8 },
  { name: "Seattle", lat: 47.6062, lng: -122.3321, density: 7 },
  { name: "Miami", lat: 25.7617, lng: -80.1918, density: 7 },
  { name: "Dallas", lat: 32.7767, lng: -96.7970, density: 7 },
  { name: "Houston", lat: 29.7604, lng: -95.3698, density: 7 },
  { name: "Phoenix", lat: 33.4484, lng: -112.0740, density: 6 },
  { name: "Philadelphia", lat: 39.9526, lng: -75.1652, density: 8 },
  { name: "Vancouver", lat: 49.2827, lng: -123.1207, density: 7 },
  { name: "Montreal", lat: 45.5017, lng: -73.5673, density: 7 },
  { name: "Ottawa", lat: 45.4215, lng: -75.6972, density: 6 },
  { name: "Calgary", lat: 51.0447, lng: -114.0719, density: 6 },
  { name: "Edmonton", lat: 53.5461, lng: -113.4938, density: 6 },
  { name: "Winnipeg", lat: 49.8951, lng: -97.1384, density: 5 },
  { name: "Quebec City", lat: 46.8139, lng: -71.2080, density: 6 },
  { name: "Hamilton", lat: 43.2557, lng: -79.8711, density: 6 },
  { name: "London, ON", lat: 42.9849, lng: -81.2453, density: 5 },
  { name: "Kitchener", lat: 43.4516, lng: -80.4925, density: 5 },
  { name: "St. Catharines", lat: 43.1594, lng: -79.2469, density: 5 },
  { name: "Halifax", lat: 44.6488, lng: -63.5752, density: 5 },
  { name: "Atlanta", lat: 33.7490, lng: -84.3880, density: 7 },
  { name: "Denver", lat: 39.7392, lng: -104.9903, density: 6 },
  { name: "Detroit", lat: 42.3314, lng: -83.0458, density: 6 },
  { name: "Minneapolis", lat: 44.9778, lng: -93.2650, density: 6 },
  { name: "San Diego", lat: 32.7157, lng: -117.1611, density: 7 },
  { name: "Tampa", lat: 27.9506, lng: -82.4572, density: 6 }
];

/**
 * Estimate property traffic based on location
 * @param {object} coordinates - Property coordinates {lat, lng}
 * @returns {object} - Traffic data for the property
 */
export const estimatePropertyTraffic = async (coordinates) => {
  console.log("🔍 Estimating traffic for coordinates:", coordinates);
  
  try {
    // Validate coordinates
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      throw new Error('Invalid property coordinates');
    }
    
    // Find closest urban center and calculate distance
    let closestCity = null;
    let shortestDistance = Infinity;
    
    urbanCenters.forEach(city => {
      const distance = getDistanceFromLatLonInKm(
        coordinates.lat, coordinates.lng, city.lat, city.lng
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestCity = city;
      }
    });
    
    console.log(`Closest city: ${closestCity.name} (${shortestDistance.toFixed(1)} km)`);
    
    // Calculate base traffic based on proximity to urban centers
    // - Higher values for coordinates closer to urban centers
    // - Scaled by population density factor
    
    // Distance factor (inverse relationship - closer means more traffic)
    // Scale from 0.5 (far) to 2.0 (very close)
    let distanceFactor;
    if (shortestDistance < 5) {
      distanceFactor = 2.0;  // Downtown
    } else if (shortestDistance < 15) {
      distanceFactor = 1.5;  // Urban
    } else if (shortestDistance < 30) {
      distanceFactor = 1.2;  // Suburban
    } else if (shortestDistance < 60) {
      distanceFactor = 0.9;  // Exurban
    } else if (shortestDistance < 100) {
      distanceFactor = 0.7;  // Rural near city
    } else {
      distanceFactor = 0.5;  // Rural
    }
    
    // Base traffic volume depends on closest city's density
    // and distance factor
    const baseTraffic = closestCity.density * 4000 * distanceFactor;
    
    // Time of day and day of week adjustments
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Day factor
    const dayFactor = isWeekend ? 0.7 : 1.0;
    
    // Time factor
    let timeFactor;
    if (hour >= 7 && hour <= 9) {
      timeFactor = isWeekend ? 0.8 : 1.8; // Morning rush hour
    } else if (hour >= 16 && hour <= 18) {
      timeFactor = isWeekend ? 1.1 : 1.9; // Evening rush hour
    } else if (hour >= 10 && hour <= 15) {
      timeFactor = 1.2; // Midday
    } else if (hour >= 19 && hour <= 22) {
      timeFactor = 0.8; // Evening
    } else {
      timeFactor = 0.3; // Late night/early morning
    }
    
    // Get a deterministic variation factor based on the coordinates
    // This ensures the same address always gives the same result
    const variationFactor = getCoordinateVariationFactor(coordinates.lat, coordinates.lng);
    console.log(`Coordinate variation factor: ${variationFactor.toFixed(4)}`);
    
    // Calculate final traffic values
    const dailyVehicleCount = Math.round(baseTraffic * dayFactor);
    const hourlyVehicleCount = Math.round((dailyVehicleCount / 24) * timeFactor);
    
    // Apply the deterministic variation factor
    const finalDailyCount = Math.round(dailyVehicleCount * variationFactor);
    const finalHourlyCount = Math.round(hourlyVehicleCount * variationFactor);
    
    console.log(`Calculated traffic: ${finalDailyCount} vehicles/day, ${finalHourlyCount} vehicles/hour`);
    
    // Determine area type based on distance
    const isUrban = shortestDistance < 30;
    
    // Determine peak hours
    const morningPeak = isWeekend ? '10 AM-12 PM' : '7-9 AM';
    const eveningPeak = isWeekend ? '2-4 PM' : '4-6 PM';
    
    // Estimate foot traffic based on proximity to urban centers
    let footTrafficLevel;
    let footTrafficCount;
    
    if (shortestDistance < 5) {
      // Downtown
      footTrafficCount = Math.round(finalDailyCount * 0.2); // 20% of vehicle count
      if (footTrafficCount > 3000) {
        footTrafficLevel = `Very High (estimated ${footTrafficCount.toLocaleString()} pedestrians/day)`;
      } else {
        footTrafficLevel = `High (estimated ${footTrafficCount.toLocaleString()} pedestrians/day)`;
      }
    } else if (shortestDistance < 15) {
      // Urban
      footTrafficCount = Math.round(finalDailyCount * 0.1); // 10% of vehicle count
      footTrafficLevel = `Moderate to High (estimated ${footTrafficCount.toLocaleString()} pedestrians/day)`;
    } else if (shortestDistance < 30) {
      // Suburban
      footTrafficCount = Math.round(finalDailyCount * 0.05); // 5% of vehicle count
      footTrafficLevel = `Moderate (estimated ${footTrafficCount.toLocaleString()} pedestrians/day)`;
    } else if (shortestDistance < 60) {
      // Exurban
      footTrafficCount = Math.round(finalDailyCount * 0.02); // 2% of vehicle count
      footTrafficLevel = `Low to Moderate (estimated ${footTrafficCount.toLocaleString()} pedestrians/day)`;
    } else {
      // Rural
      footTrafficCount = Math.round(finalDailyCount * 0.01); // 1% of vehicle count
      footTrafficLevel = `Low (estimated ${footTrafficCount.toLocaleString()} pedestrians/day)`;
    }
    
    // Create result object
    const result = {
      average: `${finalDailyCount.toLocaleString()} vehicles/day`,
      peak: `${morningPeak}, ${eveningPeak}`,
      current: `${finalHourlyCount.toLocaleString()} vehicles/hour`,
      vehicleCount: finalDailyCount,
      peakHours: `${morningPeak}, ${eveningPeak}`,
      footTraffic: footTrafficLevel,
      trafficDetails: {
        nearestCity: closestCity.name,
        distanceToCity: Math.round(shortestDistance * 10) / 10,
        isUrban: isUrban,
        areaType: shortestDistance < 5 ? 'Downtown' : 
                  shortestDistance < 15 ? 'Urban' : 
                  shortestDistance < 30 ? 'Suburban' : 
                  shortestDistance < 60 ? 'Exurban' : 'Rural',
        currentHourlyVolume: finalHourlyCount
      }
    };
    
    console.log("Returning traffic estimate:", result.average);
    return result;
  } catch (error) {
    console.error('Error estimating traffic:', error);
    
    // Use coordinates to generate a deterministic fallback value
    // This ensures the same address always gets the same fallback value
    let fallbackBase = 10000; // Default
    
    if (coordinates && coordinates.lat && coordinates.lng) {
      // Use coordinate values to create a deterministic variation
      const latValue = Math.abs(coordinates.lat * 100) % 10000;
      const lngValue = Math.abs(coordinates.lng * 100) % 5000;
      fallbackBase = 8000 + latValue + lngValue;
      
      // Cap at a reasonable maximum
      fallbackBase = Math.min(fallbackBase, 20000);
    }
    
    const formattedCount = fallbackBase.toLocaleString();
    
    return {
      average: `${formattedCount} vehicles/day (estimated)`,
      peak: '7-9 AM, 4-6 PM (typical)',
      current: 'Data unavailable',
      vehicleCount: fallbackBase,
      peakHours: '7-9 AM, 4-6 PM',
      footTraffic: 'Moderate (estimated 500-800 pedestrians/day)',
      trafficDetails: {
        error: error.message,
        isFallback: true,
        coordinates: coordinates
      }
    };
  }
};