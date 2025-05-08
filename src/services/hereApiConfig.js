export const HERE_CONFIG = {
	app_id: process.env.REACT_APP_HERE_APP_ID,
	api_key: process.env.REACT_APP_HERE_API_KEY,
	geocoding_url: 'https://geocode.search.hereapi.com/v1',
	routing_url: 'https://router.hereapi.com/v8'
};

export const testHereApiConfig = async () => {
  console.log("[API TEST] Testing HERE Maps API configuration");
  
  // Check if API key is set
  if (!HERE_CONFIG.api_key || HERE_CONFIG.api_key === 'YOUR_HERE_API_KEY') {
    console.error("[API TEST] ❌ API key is not set or is using the default value");
    return false;
  }
  
  // Check if routing URL is set
  if (!HERE_CONFIG.routing_url) {
    console.error("[API TEST] ❌ Routing URL is not set");
    return false;
  }
  
  // Test a simple geocoding request
  const testUrl = `https://geocode.search.hereapi.com/v1/geocode?q=200+S+Mathilda+Ave+Sunnyvale+CA&apiKey=${HERE_CONFIG.api_key}`;
  
  try {
    console.log("[API TEST] Sending test request to HERE API");
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      console.error(`[API TEST] ❌ API test failed with status: ${response.status}`);
      
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
    console.log("[API TEST] ✅ API test successful!", data);
    return true;
  } catch (error) {
    console.error("[API TEST] ❌ API test failed with error:", error);
    return false;
  }
};