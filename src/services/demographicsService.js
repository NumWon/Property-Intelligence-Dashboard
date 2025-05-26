// src/services/demographicsService.js - Canadian-only demographics service
import { fetchCanadianDemographics } from './censusMapperService';

/**
 * Determine if coordinates are in Canada
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if coordinates are in Canada
 */
const isInCanada = (lat, lng) => {
  // Rough bounding box for Canada
  return lat >= 41.7 && lat <= 83.1 && lng >= -141.0 && lng <= -52.6;
};

/**
 * Fetch demographics data for Canadian coordinates
 * @param {Object} coordinates - The lat/lng coordinates {lat, lng}
 * @returns {Object} - Demographics data
 */
export const fetchDemographics = async (coordinates) => {
  try {
    console.log("Fetching demographics for coordinates:", coordinates);

    // Check if coordinates are in Canada
    if (!isInCanada(coordinates.lat, coordinates.lng)) {
      console.log("Coordinates are outside Canada");
      return {
        population: "Data unavailable",
        location: "Location outside Canada",
        medianIncome: "Data unavailable",
        dataSource: "Service limited to Canadian locations",
        rawData: null
      };
    }

    console.log("Coordinates are in Canada, using CensusMapper API");
    
    try {
      // Use CensusMapper API for Canadian demographics
      const censusMapperData = await fetchCanadianDemographics(coordinates);
      
      if (censusMapperData && censusMapperData.population !== "Data unavailable") {
        return {
          population: censusMapperData.population,
          location: censusMapperData.location,
          medianIncome: censusMapperData.medianIncome,
          averageIncome: censusMapperData.averageIncome,
          medianAge: censusMapperData.medianAge,
          medianHomeValue: censusMapperData.medianHomeValue,
          averageHomeValue: censusMapperData.averageHomeValue,
          unemploymentRate: censusMapperData.unemploymentRate,
          labourParticipationRate: censusMapperData.labourParticipationRate,
          universityEducation: censusMapperData.universityEducation,
          populationDensity: censusMapperData.populationDensity,
          province: censusMapperData.province,
          dataSource: censusMapperData.dataSource,
          regionLevel: censusMapperData.regionLevel,
          distance: censusMapperData.distance,
          rawData: censusMapperData.rawData
        };
      }
    } catch (error) {
      console.warn('CensusMapper API failed:', error.message);
    }
    
    // If CensusMapper fails, return basic Canadian location info
    return {
      population: "Data temporarily unavailable",
      location: "Canadian location",
      medianIncome: "Data temporarily unavailable",
      dataSource: "CensusMapper API (temporarily unavailable)",
      rawData: null
    };
    
  } catch (error) {
    console.error('Error fetching Canadian demographics:', error);
    return {
      population: "Data unavailable",
      location: "Unknown Canadian location",
      medianIncome: "Data unavailable",
      dataSource: "Error occurred",
      rawData: null
    };
  }
};

/**
 * Test the demographics service with known Canadian coordinates
 * @param {Object} testCoordinates - Optional test coordinates
 * @returns {Object} - Test results
 */
export const testDemographicsService = async (testCoordinates) => {
  const testLocations = [
    { name: "Toronto, ON", lat: 43.6532, lng: -79.3832 },
    { name: "Vancouver, BC", lat: 49.2827, lng: -123.1207 },
    { name: "Montreal, QC", lat: 45.5017, lng: -73.5673 },
    { name: "Calgary, AB", lat: 51.0447, lng: -114.0719 },
    ...(testCoordinates ? [{ name: "Test Location", ...testCoordinates }] : [])
  ];
  
  console.log('Testing Canadian demographics service...');
  
  const results = [];
  
  for (const location of testLocations) {
    try {
      console.log(`Testing ${location.name}...`);
      const demographics = await fetchDemographics({
        lat: location.lat,
        lng: location.lng
      });
      
      results.push({
        location: location.name,
        success: demographics.population !== "Data unavailable",
        data: demographics
      });
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Test failed for ${location.name}:`, error);
      results.push({
        location: location.name,
        success: false,
        error: error.message
      });
    }
  }
  
  console.log('Test results:', results);
  return results;
};