// src/services/hereMapLoader.js

// Track loading state globally
let isLoading = false;
let isLoaded = false;
let loadError = null;
let loadPromise = null;

/**
 * Load the HERE Maps scripts and CSS if not already loaded
 * @returns {Promise} A promise that resolves when all scripts are loaded
 */
export const loadHereMapsScripts = () => {
  // If scripts are already loaded, return a resolved promise
  if (isLoaded && window.H && window.H.service && window.H.service.Platform) {
    return Promise.resolve();
  }
  
  // If loading is in progress, return the existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }
  
  // Reset error state
  loadError = null;
  
  // Helper function to load a script and return a promise
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = (error) => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };
  
  // Start loading
  isLoading = true;
  
  // Create and store the loading promise
  loadPromise = (async () => {
    try {
      // Load CSS if not already loaded
      if (!document.querySelector('link[href*="mapsjs-ui.css"]')) {
        const uiCss = document.createElement('link');
        uiCss.rel = 'stylesheet';
        uiCss.type = 'text/css';
        uiCss.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
        document.head.appendChild(uiCss);
      }
  
      // Load scripts in sequence
      await loadScript('https://js.api.here.com/v3/3.1/mapsjs-core.js');
      await loadScript('https://js.api.here.com/v3/3.1/mapsjs-service.js');
      await loadScript('https://js.api.here.com/v3/3.1/mapsjs-ui.js');
      await loadScript('https://js.api.here.com/v3/3.1/mapsjs-mapevents.js');
      
      // Add a small delay to ensure everything is initialized
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify the API is available
      if (!window.H || !window.H.service || !window.H.service.Platform) {
        throw new Error('HERE Maps API failed to initialize properly');
      }
      
      isLoaded = true;
      isLoading = false;
      
      return true;
    } catch (error) {
      console.error('Error loading HERE Maps scripts:', error);
      loadError = error.message;
      isLoading = false;
      isLoaded = false;
      throw error;
    }
  })();
  
  return loadPromise;
};

/**
 * Check if HERE Maps scripts are loaded
 * @returns {Boolean} True if all HERE Maps scripts are loaded
 */
export const isHereMapsLoaded = () => {
  return isLoaded && window.H && window.H.service && window.H.service.Platform;
};

/**
 * Get the current loading error if any
 * @returns {String|null} The error message or null if no error
 */
export const getLoadError = () => {
  return loadError;
};