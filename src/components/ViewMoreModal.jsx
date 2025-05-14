// src/components/ViewMoreModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { HERE_CONFIG } from '../services/hereApiConfig';
import { loadHereMapsScripts } from '../services/hereMapLoader';

// Generate a unique ID for each map instance
const generateUniqueId = () => `modal-map-${Math.random().toString(36).substring(2, 9)}`;

export default function ViewMoreModal({ title, content, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
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
      console.error('Error disposing map in modal:', err);
    }
  };

  useEffect(() => {
    console.log(`ViewMoreModal ${mapIdRef.current}: useEffect triggered`);
    
    // Only proceed if this is a Map View with coordinates
    if (title === 'Map View' && content.coordinates && content.coordinates.lat && 
        content.coordinates.lng && mapRef.current) {
      console.log(`ViewMoreModal ${mapIdRef.current}: Map view detected with coordinates`, content.coordinates);
      
      // Store the current map ID for closure reference
      const currentMapId = mapIdRef.current;
      
      const initializeMap = async () => {
        setIsMapLoading(true);
        setMapError(null);
        
        try {
          console.log(`ViewMoreModal ${currentMapId}: Starting initialization`);
          
          // Clean up existing map instance if it exists
          safeDisposeMap();
          
          // Ensure HERE Maps scripts are loaded
          await loadHereMapsScripts();
          
          // Add a small delay to make sure the modal is fully rendered
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Check if this component is still mounted and the ref is still valid
          if (!mapRef.current) {
            console.log(`ViewMoreModal ${currentMapId}: Map ref no longer valid, aborting`);
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
          
          console.log(`ViewMoreModal ${currentMapId}: Map container size: ${mapWidth}x${mapHeight}`);
          
          if (mapWidth === 0 || mapHeight === 0) {
            throw new Error(`Map container has no size (${mapWidth}x${mapHeight})`);
          }
          
          console.log(`ViewMoreModal ${currentMapId}: Creating platform`);
          
          // Initialize the platform object
          const platform = new window.H.service.Platform({
            apikey: HERE_CONFIG.api_key
          });
          
          // Obtain the default map types from the platform object
          const defaultLayers = platform.createDefaultLayers();
          
          console.log(`ViewMoreModal ${currentMapId}: Creating map in element`, mapRef.current);
          
          // Instantiate the map with FIXED options
          const map = new window.H.Map(
            mapRef.current,
            defaultLayers.vector.normal.map,
            {
              center: { 
                lat: content.coordinates.lat, 
                lng: content.coordinates.lng 
              },
              zoom: 15,
              pixelRatio: window.devicePixelRatio || 1,
              // Add these options to prevent the lookAtManipulator error
              renderBaseBackground: {
                lower: 0,
                higher: 1
              }
            }
          );
          
          // Force a resize immediately after creation
          if (map && map.getViewPort()) {
            map.getViewPort().resize();
          }
          
          // Create a unique marker ID for this map instance
          const markerId = `marker-${currentMapId}`;
          
          // FIXED: Wait a moment before adding UI components
          await new Promise(resolve => setTimeout(resolve, 100));
          
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
            { lat: content.coordinates.lat, lng: content.coordinates.lng },
            { icon: icon, id: markerId }
          );
          
          // Add the marker to the map
          map.addObject(marker);
          
          // Force another resize to be extra sure
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
              console.error(`ViewMoreModal ${currentMapId}: Error in resize handler:`, err);
            }
          };
          
          window.addEventListener('resize', resizeListener);
          
          // Save map instance with ID reference
          mapInstanceRef.current = {
            map: map,
            resizeListener: resizeListener,
            id: currentMapId
          };
          
          console.log(`ViewMoreModal ${currentMapId}: Map initialization complete`);
          setIsMapLoading(false);
        } catch (err) {
          console.error(`ViewMoreModal ${currentMapId}: Error initializing map:`, err);
          setMapError(`Error: ${err.message}`);
          setIsMapLoading(false);
          
          // Clear any partial map instance
          safeDisposeMap();
        }
      };

      // Initialize the map with a longer delay to ensure proper DOM rendering
      const initTimer = setTimeout(() => {
        initializeMap();
      }, 400); // Significantly longer delay for modal to be fully rendered

      return () => {
        console.log(`ViewMoreModal ${currentMapId}: Cleanup running`);
        clearTimeout(initTimer);
        safeDisposeMap();
      };
    }
    
    // Cleanup function if not a map view
    return () => {
      safeDisposeMap();
    };
  }, [title, content]);

  const renderContent = () => {
    if (title === 'Map View') {
      return (
        <div className="space-y-4">
          <div 
            ref={mapRef} 
            className="bg-indigo-100 h-64 w-full flex items-center justify-center rounded-xl border border-indigo-200"
            style={{ 
              position: 'relative', 
              overflow: 'hidden',
              minHeight: '300px',  // FIXED: Ensure minimum height
              display: 'block'     // FIXED: Ensure display is block
            }}
            data-component="modal-map-container"
            data-map-id={mapIdRef.current}
          >
            {isMapLoading && (
              <span className="text-indigo-500 absolute">Loading map...</span>
            )}
            
            {!isMapLoading && mapError && (
              <span className="text-red-500 absolute">{mapError}</span>
            )}
            
            {!content.coordinates && (
              <span className="text-indigo-500 absolute">No coordinates available</span>
            )}
          </div>
          
          {content.coordinates && (
            <div>
              <p><span className="font-medium">Latitude:</span> {content.coordinates.lat}</p>
              <p><span className="font-medium">Longitude:</span> {content.coordinates.lng}</p>
              {content.address && (
                <p><span className="font-medium">Address:</span> {content.address}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    if (title === 'Traffic Data') {
      // Format numbers with commas
      const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      // Determine traffic level color and class
      const getTrafficClass = (vehicleCount) => {
        if (vehicleCount > 30000) return 'text-red-600 bg-red-100';
        if (vehicleCount > 20000) return 'text-orange-600 bg-orange-100';
        if (vehicleCount > 10000) return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
      };

      // Calculate delay in minutes
      const delayMinutes = content.trafficDetails && content.trafficDetails.avgDelay 
        ? Math.round(content.trafficDetails.avgDelay / 60) 
        : 0;

      return (
        <div className="space-y-6">
          {/* Traffic volume section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Traffic Volume</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Daily Average</p>
                <p className={`text-xl font-bold mt-1 ${getTrafficClass(content.vehicleCount)} px-2 py-1 rounded inline-block`}>
                  {formatNumber(content.vehicleCount)} vehicles/day
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Based on road classification and local traffic patterns
                </p>
              </div>
              
              {content.trafficDetails && content.trafficDetails.currentHourlyVolume && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-gray-500">Current Estimated Volume</p>
                  <p className="text-xl font-bold mt-1">
                    {formatNumber(content.trafficDetails.currentHourlyVolume)} vehicles/hour
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Varies by time of day and day of week
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Peak hours section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Traffic Patterns</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Peak Hours</p>
                <p className="font-medium mt-1">{content.peakHours}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Highest traffic volume typically occurs during these times
                </p>
              </div>
              
              {content.trafficDetails && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-gray-500">Current Traffic Delay</p>
                  <p className={`font-medium mt-1 ${delayMinutes > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {delayMinutes} minutes
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Additional travel time due to current conditions
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Pedestrian traffic section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Pedestrian Activity</h3>
            
            <div className="border rounded-lg p-3">
              <div className="flex items-center">
                <div className="mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Foot Traffic Assessment</p>
                  <p className="text-lg font-medium">{content.footTraffic}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Based on road type, location, and vehicle traffic patterns
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes section */}
          <div className="bg-gray-100 p-3 rounded-lg text-sm">
            <p className="font-medium text-gray-700">Notes:</p>
            <ul className="list-disc pl-5 mt-1 text-gray-600 space-y-1">
              <li>Traffic data is estimated based on HERE Maps routing API</li>
              <li>Actual traffic volumes may vary based on seasonal events, construction, or other factors</li>
              <li>Pedestrian estimates are approximate and based on correlations with vehicle traffic</li>
            </ul>
          </div>
        </div>
      );
    }
    
    // Default case - display raw content
    return (
      <div>
        {Object.entries(content).map(([key, value]) => (
          <p key={key}>
            <span className="font-medium">{key}:</span> {
              typeof value === 'object' ? JSON.stringify(value) : value
            }
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-indigo-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          {renderContent()}
        </div>
        
        <div className="flex justify-end mt-4">
          <button 
            onClick={onClose}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}