import { HERE_CONFIG } from './hereApiConfig';

export const geocodeAddress = async (address) => {
  try {
    const url = `${HERE_CONFIG.geocoding_url}/geocode?q=${encodeURIComponent(address)}&apiKey=${HERE_CONFIG.api_key}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const location = data.items[0];
      return {
        coordinates: {
          lat: location.position.lat,
          lng: location.position.lng
        },
        address: {
          label: location.address.label,
          city: location.address.city,
          state: location.address.stateCode,
          postalCode: location.address.postalCode,
          country: location.address.countryCode
        },
        rawData: location // Save the full response for reference if needed
      };
    }
    
    throw new Error('No results found for this address');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};