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
    
    if (title === 'Nearby Businesses') {
      // Handle the case for displaying nearby businesses
      const { 
        restaurants = [], 
        retail = [], 
        fuel = [],
        schools = [],
        healthcare = [],
        transit = [],
        entertainment = [],
        services = []
      } = content;
      
      // Combine all businesses and sort by distance
      const allBusinesses = [
        ...restaurants, 
        ...retail, 
        ...fuel,
        ...schools,
        ...healthcare,
        ...transit,
        ...entertainment,
        ...services
      ];
      
      // Sort businesses by distanceMeters if available, or parse from distance string
      const sortedBusinesses = [...allBusinesses].sort((a, b) => {
        if (a.distanceMeters !== undefined && b.distanceMeters !== undefined) {
          return a.distanceMeters - b.distanceMeters;
        }
        
        // Fallback to parsing from distance string
        const getDistanceValue = (distance) => {
          const match = distance.match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[0]) : 999; // Default to high value if parsing fails
        };
        
        return getDistanceValue(a.distance) - getDistanceValue(b.distance);
      });
      
      // Function to get icon for business type
      const getBusinessIcon = (type) => {
        switch(type) {
          case 'restaurant':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.325 14.322c3.981 2.295 7.502-1.226 5.207-5.207M8.794 9.679c-3.981-2.295-7.502 1.226-5.207 5.207M12 6c1.657 0 3 1.343 3 3 0 1.657-1.343 3-3 3-1.657 0-3-1.343-3-3 0-1.657 1.343-3 3-3z" />
              </svg>
            );
          case 'retail':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            );
          case 'fuel':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            );
          case 'school':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            );
          case 'healthcare':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            );
          case 'transit':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            );
          case 'entertainment':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            );
          case 'service':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            );
          default:
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            );
        }
      };
      
      // Helper to determine the type of a business for icons
      const getBusinessType = (business) => {
        if (restaurants.includes(business)) return 'restaurant';
        if (retail.includes(business)) return 'retail';
        if (fuel.includes(business)) return 'fuel';
        if (schools.includes(business)) return 'school';
        if (healthcare.includes(business)) return 'healthcare';
        if (transit.includes(business)) return 'transit';
        if (entertainment.includes(business)) return 'entertainment';
        if (services.includes(business)) return 'service';
        return 'other';
      };
      
      // Calculate distances for analytics
      const calculateDistanceAnalytics = () => {
        if (allBusinesses.length === 0) return null;
        
        // Sort by distance
        const sorted = [...allBusinesses].sort((a, b) => {
          if (a.distanceMeters !== undefined && b.distanceMeters !== undefined) {
            return a.distanceMeters - b.distanceMeters;
          }
          
          // Parse from distance string
          const getDistanceValue = (distance) => {
            const match = distance.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[0]) : 999;
          };
          
          return getDistanceValue(a.distance) - getDistanceValue(b.distance);
        });
        
        // Get closest, furthest, and average distances
        const closest = sorted[0].distance;
        const furthest = sorted[sorted.length - 1].distance;
        
        // Calculate how many are within 0.5km
        const withinHalfKm = sorted.filter(b => {
          const dist = b.distanceMeters || parseFloat(b.distance) * 1000;
          return dist <= 500;
        }).length;
        
        // Calculate how many are within 1km
        const withinOneKm = sorted.filter(b => {
          const dist = b.distanceMeters || parseFloat(b.distance) * 1000;
          return dist <= 1000;
        }).length;
        
        return {
          closest,
          furthest,
          withinHalfKm,
          withinOneKm,
          total: allBusinesses.length
        };
      };
      
      const distanceAnalytics = calculateDistanceAnalytics();
      
      return (
        <div className="space-y-6">
          {/* Summary section */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-700">Nearby Points of Interest</h3>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="bg-white p-2 rounded shadow-sm text-center">
                <p className="text-xs text-gray-500">Restaurants</p>
                <p className="text-lg font-bold text-red-500">{restaurants.length}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm text-center">
                <p className="text-xs text-gray-500">Retail</p>
                <p className="text-lg font-bold text-blue-500">{retail.length}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm text-center">
                <p className="text-xs text-gray-500">Gas Stations</p>
                <p className="text-lg font-bold text-green-500">{fuel.length}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm text-center">
                <p className="text-xs text-gray-500">Schools</p>
                <p className="text-lg font-bold text-yellow-500">{schools.length}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm text-center">
                <p className="text-xs text-gray-500">Healthcare</p>
                <p className="text-lg font-bold text-pink-500">{healthcare.length}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm text-center">
                <p className="text-xs text-gray-500">Transit</p>
                <p className="text-lg font-bold text-purple-500">{transit.length}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm text-center">
                <p className="text-xs text-gray-500">Entertainment</p>
                <p className="text-lg font-bold text-amber-500">{entertainment.length}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm text-center">
                <p className="text-xs text-gray-500">Services</p>
                <p className="text-lg font-bold text-cyan-500">{services.length}</p>
              </div>
            </div>
          </div>
          
          {/* Distance analytics section */}
          {distanceAnalytics && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Location Analytics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Within 0.5 km</p>
                  <p className="text-lg font-bold text-indigo-600">{distanceAnalytics.withinHalfKm} POIs</p>
                  <p className="text-xs text-gray-600">
                    {Math.round((distanceAnalytics.withinHalfKm / distanceAnalytics.total) * 100)}% of total
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Within 1 km</p>
                  <p className="text-lg font-bold text-indigo-600">{distanceAnalytics.withinOneKm} POIs</p>
                  <p className="text-xs text-gray-600">
                    {Math.round((distanceAnalytics.withinOneKm / distanceAnalytics.total) * 100)}% of total
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Closest POI</p>
                  <p className="text-lg font-bold text-green-600">{distanceAnalytics.closest}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Furthest POI</p>
                  <p className="text-lg font-bold text-blue-600">{distanceAnalytics.furthest}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Closest POIs list */}
          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Closest Points of Interest</h3>
            
            {sortedBusinesses.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {sortedBusinesses.slice(0, 8).map((business, index) => {
                  const type = getBusinessType(business);
                  
                  return (
                    <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition duration-150">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="mr-3">
                            {getBusinessIcon(type)}
                          </div>
                          <div>
                            <p className="font-medium">{business.name}</p>
                            <p className="text-sm text-gray-600">{business.address}</p>
                          </div>
                        </div>
                        <div className="bg-indigo-100 px-2 py-1 rounded text-sm text-indigo-700">
                          {business.distance}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sortedBusinesses.length > 8 && (
                  <p className="text-sm text-gray-500 italic text-center mt-2">
                    + {sortedBusinesses.length - 8} more points of interest
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No points of interest found nearby.</p>
            )}
          </div>
          
          {/* Categories accordion */}
          <div className="space-y-4">
            {/* Restaurants section */}
            {restaurants.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-red-50 border-b border-red-200 p-2 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-red-800">
                    <span className="inline-block mr-2">
                      {getBusinessIcon('restaurant')}
                    </span>
                    Restaurants ({restaurants.length})
                  </h3>
                </div>
                <div className="p-2 max-h-40 overflow-y-auto">
                  {restaurants.map((restaurant, index) => (
                    <div key={index} className="border-b border-gray-100 py-1 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-600">{restaurant.distance}</p>
                      </div>
                      <p className="text-xs text-gray-500">{restaurant.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Retail section */}
            {retail.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-50 border-b border-blue-200 p-2 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-blue-800">
                    <span className="inline-block mr-2">
                      {getBusinessIcon('retail')}
                    </span>
                    Retail Stores ({retail.length})
                  </h3>
                </div>
                <div className="p-2 max-h-40 overflow-y-auto">
                  {retail.map((shop, index) => (
                    <div key={index} className="border-b border-gray-100 py-1 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{shop.name}</p>
                        <p className="text-sm text-gray-600">{shop.distance}</p>
                      </div>
                      <p className="text-xs text-gray-500">{shop.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Fuel stations section */}
            {fuel.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-green-50 border-b border-green-200 p-2 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-green-800">
                    <span className="inline-block mr-2">
                      {getBusinessIcon('fuel')}
                    </span>
                    Gas Stations ({fuel.length})
                  </h3>
                </div>
                <div className="p-2 max-h-40 overflow-y-auto">
                  {fuel.map((station, index) => (
                    <div key={index} className="border-b border-gray-100 py-1 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{station.name}</p>
                        <p className="text-sm text-gray-600">{station.distance}</p>
                      </div>
                      <p className="text-xs text-gray-500">{station.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Schools section */}
            {schools.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-yellow-50 border-b border-yellow-200 p-2 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-yellow-800">
                    <span className="inline-block mr-2">
                      {getBusinessIcon('school')}
                    </span>
                    Schools ({schools.length})
                  </h3>
                </div>
                <div className="p-2 max-h-40 overflow-y-auto">
                  {schools.map((school, index) => (
                    <div key={index} className="border-b border-gray-100 py-1 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-gray-600">{school.distance}</p>
                      </div>
                      <p className="text-xs text-gray-500">{school.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Healthcare section */}
            {healthcare.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-pink-50 border-b border-pink-200 p-2 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-pink-800">
                    <span className="inline-block mr-2">
                      {getBusinessIcon('healthcare')}
                    </span>
                    Healthcare ({healthcare.length})
                  </h3>
                </div>
                <div className="p-2 max-h-40 overflow-y-auto">
                  {healthcare.map((facility, index) => (
                    <div key={index} className="border-b border-gray-100 py-1 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{facility.name}</p>
                        <p className="text-sm text-gray-600">{facility.distance}</p>
                      </div>
                      <p className="text-xs text-gray-500">{facility.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Transit section */}
            {transit.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-purple-50 border-b border-purple-200 p-2 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-purple-800">
                    <span className="inline-block mr-2">
                      {getBusinessIcon('transit')}
                    </span>
                    Public Transit ({transit.length})
                  </h3>
                </div>
                <div className="p-2 max-h-40 overflow-y-auto">
                  {transit.map((stop, index) => (
                    <div key={index} className="border-b border-gray-100 py-1 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{stop.name}</p>
                        <p className="text-sm text-gray-600">{stop.distance}</p>
                      </div>
                      <p className="text-xs text-gray-500">{stop.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Entertainment section */}
            {entertainment.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-200 p-2 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-amber-800">
                    <span className="inline-block mr-2">
                      {getBusinessIcon('entertainment')}
                    </span>
                    Entertainment ({entertainment.length})
                  </h3>
                </div>
                <div className="p-2 max-h-40 overflow-y-auto">
                  {entertainment.map((venue, index) => (
                    <div key={index} className="border-b border-gray-100 py-1 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{venue.name}</p>
                        <p className="text-sm text-gray-600">{venue.distance}</p>
                      </div>
                      <p className="text-xs text-gray-500">{venue.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Services section */}
            {services.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-cyan-50 border-b border-cyan-200 p-2 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-cyan-800">
                    <span className="inline-block mr-2">
                      {getBusinessIcon('service')}
                    </span>
                    Services ({services.length})
                  </h3>
                </div>
                <div className="p-2 max-h-40 overflow-y-auto">
                  {services.map((service, index) => (
                    <div key={index} className="border-b border-gray-100 py-1 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.distance}</p>
                      </div>
                      <p className="text-xs text-gray-500">{service.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Analysis note */}
          <div className="bg-indigo-50 p-3 rounded-lg text-sm border border-indigo-200">
            <p className="font-medium text-indigo-700">Property Analysis:</p>
            <p className="text-indigo-600 mt-1">
              The proximity and variety of nearby businesses can significantly impact property value. 
              This property has {allBusinesses.length} points of interest within roughly 1 km, 
              making it {allBusinesses.length > 20 ? 'very well-connected' : 
                         allBusinesses.length > 10 ? 'well-connected' : 
                         allBusinesses.length > 5 ? 'adequately connected' : 'somewhat isolated'}.
            </p>
            <p className="text-indigo-600 mt-2">
              {distanceAnalytics && distanceAnalytics.withinHalfKm >= 5 ? 
                'The high number of businesses within walking distance (0.5 km) indicates excellent walkability.' : 
                'Consider the distance to essential services when evaluating this property.'}
            </p>
          </div>
        </div>
      );
    }

    if (title === 'Demographics') {
      return (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">About This Area</h3>
            
            {content.location && (
              <p className="mb-2"><span className="font-medium">Location:</span> {content.location}</p>
            )}
            
            <p className="mb-2">
              <span className="font-medium">Population:</span> {content.population}
            </p>
            
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                <span className="font-medium">Coming Soon:</span> Enhanced demographics including median income, age distribution, and education levels.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
            <p className="font-medium mb-1">Data Sources:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Population data: Geoapify Places API</li>
              <li>Future income data will use Statistics Canada census information</li>
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