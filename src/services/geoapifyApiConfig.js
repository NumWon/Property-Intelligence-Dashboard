export const GEOAPIFY_CONFIG = {
	api_key: process.env.REACT_APP_GEOAPIFY_API_KEY,
	base_url: 'https://api.geoapify.com/v2',
	places_url: 'https://api.geoapify.com/v2/places',
	geocoding_url: 'https://api.geoapify.com/v1/geocode'
  };
  
  /**
   * Test the Geoapify API configuration
   * @returns {Promise<boolean>} True if the configuration is valid
   */
  export const testGeoapifyApiConfig = async () => {
	console.log("[API TEST] Testing Geoapify API configuration");
	
	// Check if API key is set
	if (!GEOAPIFY_CONFIG.api_key || GEOAPIFY_CONFIG.api_key === 'YOUR_GEOAPIFY_API_KEY') {
	  console.error("[API TEST] ❌ Geoapify API key is not set or is using the default value");
	  return false;
	}
	
	// Test a simple demographics request
	const testUrl = `${GEOAPIFY_CONFIG.demographics_url}?lat=40.7128&lon=-74.0060&apiKey=${GEOAPIFY_CONFIG.api_key}`;
	
	try {
	  console.log("[API TEST] Sending test request to Geoapify API");
	  const response = await fetch(testUrl);
	  
	  if (!response.ok) {
		console.error(`[API TEST] ❌ Geoapify API test failed with status: ${response.status}`);
		
		// Try to get more error details
		try {
		  const errorData = await response.json();
		  console.error("[API TEST] Error details:", errorData);
		} catch (e) {
		  const errorText = await response.text();
		  console.error("[API TEST] Error response:", errorText);
		}
		
		return false;
	  }
	  
	  const data = await response.json();
	  console.log("[API TEST] ✅ Geoapify API test successful!", data);
	  return true;
	} catch (error) {
	  console.error("[API TEST] ❌ Geoapify API test failed with error:", error);
	  return false;
	}
  };
  
  /**
   * Get a formatted URL for Geoapify API calls
   * @param {string} endpoint - The API endpoint to use
   * @param {Object} params - Query parameters
   * @returns {string} - Formatted URL
   */
  export const getGeoapifyUrl = (endpoint, params = {}) => {
	// Start with the base URL for the endpoint
	let url;
	
	switch (endpoint) {
	  case 'demographics':
		url = GEOAPIFY_CONFIG.demographics_url;
		break;
	  case 'places':
		url = GEOAPIFY_CONFIG.places_url;
		break;
	  case 'geocode':
		url = GEOAPIFY_CONFIG.geocoding_url;
		break;
	  default:
		url = GEOAPIFY_CONFIG.base_url + '/' + endpoint;
	}
	
	// Add parameters
	const queryParams = new URLSearchParams();
	
	// Add all provided parameters
	for (const [key, value] of Object.entries(params)) {
	  queryParams.append(key, value);
	}
	
	// Always add the API key
	queryParams.append('apiKey', GEOAPIFY_CONFIG.api_key);
	
	// Return the complete URL
	return `${url}?${queryParams.toString()}`;
  };