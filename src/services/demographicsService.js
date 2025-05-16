// src/services/demographicsService.js
import { GEOAPIFY_CONFIG, getGeoapifyUrl } from './geoapifyApiConfig';

/**
 * Fetch demographics data from Geoapify
 * @param {Object} coordinates - The lat/lng coordinates {lat, lng}
 * @returns {Object} - Demographics data
 */
export const fetchDemographics = async (coordinates) => {
  try {
    console.log("Fetching demographics for coordinates:", coordinates);

    // Use the helper function to get the URL
    const url = getGeoapifyUrl('places', {
      lat: coordinates.lat,
      lon: coordinates.lng,
      type: 'administrative',
      limit: 1
    });
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Places API failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received places data:", data);
    
    // Extract population and location data
    let population = "Data unavailable";
    let location = "";
    
    if (data.features && data.features.length > 0) {
      const properties = data.features[0].properties;
      
      // Get location name
      const city = properties.city || properties.name;
      const state = properties.state || properties.county;
      
      if (city && state) {
        location = `${city}, ${state}`;
      } else if (city) {
        location = city;
      }
      
      // Extract population if available
      if (properties.population) {
        population = `${properties.population.toLocaleString()}`;
      }
    }
    
    return {
      population: population,
      location: location,
      medianIncome: "Data unavailable", // Placeholder for future enhancement
      rawData: data // Store the full response for reference
    };
  } catch (error) {
    console.error('Error fetching demographics data:', error);
    return {
      population: "Data unavailable",
      location: "",
      medianIncome: "Data unavailable",
      rawData: null
    };
  }
};