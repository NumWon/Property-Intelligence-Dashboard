// src/components/panels/MapPanel.jsx
import React, { useEffect, useRef, useState } from 'react';
import { HERE_CONFIG } from '../../services/hereApiConfig';
import { loadHereMapsScripts } from '../../services/hereMapLoader';

// Generate a unique ID for each MapPanel instance
const generateUniqueId = () => `map-${Math.random().toString(36).substring(2, 9)}`;

export default function MapPanel({ coordinates, onViewMore }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapIdRef = useRef(generateUniqueId());
  
  // Safe map dispose function
  const safeDisposeMap = () => {
    try {
      if (!mapInstanceRef.current) {
        return;
      }

      if (typeof mapInstanceRef.current.dispose === 'function') {
        mapInstanceRef.current.dispose();
      } else if (mapInstanceRef.current.map && typeof mapInstanceRef.current.map.dispose === 'function') {
        mapInstanceRef.current.map.dispose();
        
        if (mapInstanceRef.current.resizeListener) {
          window.removeEventListener('resize', mapInstanceRef.current.resizeListener);
        }
      }
      
      mapInstanceRef.current = null;
    } catch (err) {
      console.error('Error disposing map:', err);
    }
  };

  useEffect(() => {
    console.log(`MapPanel ${mapIdRef.current}: useEffect triggered`);
    
    // Skip if no coordinates
    if (!coordinates || !coordinates.lat || !coordinates.lng || !mapRef.current) {
      console.log(`MapPanel ${mapIdRef.current}: Missing coordinates or map ref, skipping initialization`);
      return;
    }
    
    // Store the current map ID for closure reference
    const currentMapId = mapIdRef.current;

    const initializeMap = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`MapPanel ${currentMapId}: Starting initialization`);
        
        // Clean up existing map instance if it exists
        safeDisposeMap();
        
        // Ensure HERE Maps scripts are loaded
        await loadHereMapsScripts();
        
        // Check if this component is still mounted and the ref is still valid
        if (!mapRef.current) {
          console.log(`MapPanel ${currentMapId}: Map ref no longer valid, aborting`);
          return;
        }
        
        // Add a data attribute to help distinguish map containers
        mapRef.current.setAttribute('data-map-id', currentMapId);
        
        // Verify API key is available
        if (!HERE_CONFIG || !HERE_CONFIG.api_key) {
          throw new Error('HERE Maps API key is missing');
        }
        
        // Check if the map div has a valid size
        const mapWidth = mapRef.current.offsetWidth;
        const mapHeight = mapRef.current.offsetHeight;
        
        if (mapWidth === 0 || mapHeight === 0) {
          throw new Error(`Map container has no size (${mapWidth}x${mapHeight})`);
        }
        
        console.log(`MapPanel ${currentMapId}: Creating platform`);
        
        // Initialize the platform object
        const platform = new window.H.service.Platform({
          apikey: HERE_CONFIG.api_key
        });
        
        // Obtain the default map types from the platform object
        const defaultLayers = platform.createDefaultLayers();
        
        console.log(`MapPanel ${currentMapId}: Creating map in element`, mapRef.current);
        
        // FIXED: Make sure the map div is visible and properly sized before creating the map
        // Create a small delay to ensure proper DOM rendering and layout calculation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check again if the component is still mounted
        if (!mapRef.current) {
          console.log(`MapPanel ${currentMapId}: Map ref no longer valid after delay, aborting`);
          return;
        }
        
        // Instantiate the map with FIXED options
        const map = new window.H.Map(
          mapRef.current,
          defaultLayers.vector.normal.map,
          {
            center: { lat: coordinates.lat, lng: coordinates.lng },
            zoom: 14,
            pixelRatio: window.devicePixelRatio || 1,
            // Add these options to prevent the lookAtManipulator error
            renderBaseBackground: {
              lower: 0,
              higher: 1
            }
          }
        );
        
        // Create a unique marker ID for this map instance
        const markerId = `marker-${currentMapId}`;
        
        // FIXED: Wait to ensure map is fully initialized before adding UI and behavior
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Create default UI and add zoom, panning, etc.
        const ui = window.H.ui.UI.createDefault(map, defaultLayers);
        
        // Enable the event system and map behavior
        const behavior = new window.H.mapevents.Behavior(
          new window.H.mapevents.MapEvents(map)
        );
        
        // Create a marker icon
        const icon = new window.H.map.Icon(
          'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-32.png'
        );
        
        // Create a marker for the property location
        const marker = new window.H.map.Marker(
          { lat: coordinates.lat, lng: coordinates.lng },
          { icon: icon, id: markerId }
        );
        
        // Add the marker to the map
        map.addObject(marker);
        
        // Force a resize after initialization to ensure proper sizing
        if (map && map.getViewPort()) {
          map.getViewPort().resize();
        }
        
        // Add resize listener
        const resizeListener = () => {
          try {
            if (map && map.getViewPort()) {
              map.getViewPort().resize();
            }
          } catch (err) {
            console.error(`MapPanel ${currentMapId}: Error in resize handler:`, err);
          }
        };
        
        window.addEventListener('resize', resizeListener);
        
        // Save map instance with ID reference
        mapInstanceRef.current = {
          map: map,
          resizeListener: resizeListener,
          id: currentMapId
        };
        
        console.log(`MapPanel ${currentMapId}: Map initialization complete`);
        setIsLoading(false);
      } catch (err) {
        console.error(`MapPanel ${currentMapId}: Error initializing map:`, err);
        setError(`Map error: ${err.message}`);
        setIsLoading(false);
        
        // Clear any partial map instance
        safeDisposeMap();
      }
    };

    // Initialize the map with a delay to ensure proper DOM rendering
    const initTimer = setTimeout(() => {
      initializeMap();
    }, 250); // FIXED: Increased from 50ms to 250ms for more reliable initialization

    // Cleanup function
    return () => {
      console.log(`MapPanel ${currentMapId}: Cleanup running`);
      clearTimeout(initTimer);
      safeDisposeMap();
    };
  }, [coordinates]);

  return (
    <div className="bg-white p-4 shadow-md rounded-2xl border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-indigo-700">Map View</h2>
        <button 
          className="text-sm text-indigo-600 border border-indigo-300 px-2 py-1 rounded hover:bg-indigo-50"
          onClick={onViewMore}
          aria-label="View more map information"
        >
          More Info
        </button>
      </div>
      
      {/* FIXED: Added explicit height and width styles */}
      <div 
        ref={mapRef} 
        className="h-48 w-full rounded-xl border border-indigo-200 flex items-center justify-center"
        style={{ 
          position: 'relative', 
          overflow: 'hidden',
          minHeight: '200px',  // Ensure minimum height
          display: 'block'     // Ensure display is block
        }} 
        data-component="map-container"
        data-map-id={mapIdRef.current}
      >
        {!coordinates && (
          <span className="text-indigo-500 absolute">Enter an address to see map</span>
        )}
        
        {coordinates && isLoading && (
          <span className="text-indigo-500 absolute">Loading map...</span>
        )}
        
        {coordinates && error && (
          <span className="text-red-500 absolute">{error}</span>
        )}
      </div>
    </div>
  );
}