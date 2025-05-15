import React, { useState, useEffect } from 'react';
import { geocodeAddress } from './services/geocodingService';
import { estimatePropertyTraffic } from './services/routingService';
import { getNearbyBusinesses } from './services/poiService';
import { fetchDemographics } from './services/demographicsService';
import { testGeoapifyApiConfig } from './services/geoapifyApiConfig';
import LeftSidebar from './components/LeftSidebar';
import SearchBar from './components/SearchBar';
import TrafficPanel from './components/panels/TrafficPanel';
import BusinessesPanel from './components/panels/BusinessesPanel';
import DemographicsPanel from './components/panels/DemographicsPanel';
import ZoningPanel from './components/panels/ZoningPanel';
import NotesPanel from './components/panels/NotesPanel';
import MapPanel from './components/panels/MapPanel';
import ViewMoreModal from './components/ViewMoreModal';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showViewMore, setShowViewMore] = useState(false);
  const [viewMoreContent, setViewMoreContent] = useState({ title: '', content: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [propertyData, setPropertyData] = useState(null);
  const [savedProperties, setSavedProperties] = useState([]);

  useEffect(() => {
    // Test API configurations when the app loads
    const testApis = async () => {
      await testGeoapifyApiConfig();
      // You could also test your HERE API here if needed
    };
    
    testApis();
  }, []);
  
  // Load saved properties from local storage on component mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('savedProperties');
      // Only update state if there are actually saved items
      if (savedItems && savedItems !== "[]") {
        try {
          const parsedItems = JSON.parse(savedItems);
          
          // Validate that we have an array
          if (Array.isArray(parsedItems)) {
            console.log("Loaded saved properties from localStorage:", parsedItems);
            setSavedProperties(parsedItems);
          } else {
            console.error("Saved properties is not an array:", parsedItems);
            // Reset if data is invalid
            localStorage.removeItem('savedProperties');
          }
        } catch (parseError) {
          console.error("Error parsing saved properties JSON:", parseError);
          // Remove invalid data from localStorage
          localStorage.removeItem('savedProperties');
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  // Save properties to local storage when they change
  useEffect(() => {
    try {
      // Only save to localStorage if we have properties to save
      if (savedProperties.length > 0) {
        console.log("Saving properties to localStorage:", savedProperties);
        localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
      }
    } catch (error) {
      console.error("Error saving properties to localStorage:", error);
    }
  }, [savedProperties]);
  
  const analyzeProperty = async (query) => {
    if (!query) return;
    
    setSearchQuery(query);
    setIsLoading(true);
    
    try {
      // Step 1: Geocode the address
      const geocodeResult = await geocodeAddress(query);
      const coordinates = geocodeResult.coordinates;
      
      console.log("Analyzing property at coordinates:", coordinates);
      
      // Step 2: Get traffic data, demographics, and nearby businesses in parallel
      const [trafficData, demographicsData, businessesData] = await Promise.all([
        estimatePropertyTraffic(coordinates),
        fetchDemographics(coordinates),
        getNearbyBusinesses(coordinates)
      ]);
      
      console.log("Received traffic data:", trafficData);
      console.log("Received demographics data:", demographicsData);
      
      // Step 3: Construct the property data object
      const newPropertyData = {
        address: geocodeResult.address.label,
        coordinates,
        // Store complete traffic data instead of simplified version
        traffic: trafficData, 
        businesses: {
          ...businessesData,
          coordinates: coordinates 
        },
        demographics: {
          population: demographicsData.population,
          medianIncome: demographicsData.medianIncome,
          // Additional demographics data available for the "More Info" view
          ageDistribution: demographicsData.ageDistribution,
          education: demographicsData.education,
          householdSize: demographicsData.householdSize,
          employmentRate: demographicsData.employmentRate
        },
        zoning: {
          zoning: 'CR (Commercial Residential)',
          bylawLink: '[PDF]'
        },
        notes: [
          'Property visit scheduled on May 10',
          'Follow-up with city planner next week'
        ],
        // Save the raw data for advanced views (now contains full objects)
        rawData: {
          traffic: trafficData,
          businesses: {
            ...businessesData,
            coordinates: coordinates
          },
          demographics: demographicsData.rawData,
          coordinates
        }
      };
      
      // Save to saved properties if not already there
      try {
        if (!savedProperties.includes(query)) {
          console.log("Adding new property to saved list:", query);
          setSavedProperties(prev => [...prev, query]);
        }
        
        // Update state with the fetched data
        setPropertyData(newPropertyData);
      } catch (error) {
        console.error("Error saving property to list:", error);
        // Still set the property data even if saving fails
        setPropertyData(newPropertyData);
      }
      
      // Update state with the fetched data
      setPropertyData(newPropertyData);
      
    } catch (error) {
      console.error('Error analyzing property:', error);
      alert('Error analyzing property. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (query) => {
    console.log('Analyzing property:', query);
    analyzeProperty(query);
  };
  
  const handleViewMore = (title, content) => {
    // For traffic data, use the complete raw data object directly
    if (title === 'Traffic Data' && propertyData?.rawData?.traffic) {
      setViewMoreContent({ 
        title, 
        content: propertyData.rawData.traffic 
      });
    } 
    // For businesses, use the complete raw data
    else if (title === 'Nearby Businesses' && propertyData?.rawData?.businesses) {
      setViewMoreContent({ 
        title, 
        content: propertyData.rawData.businesses,
      });
    } 
    // For map view, include coordinates and address
    else if (title === 'Map View' && propertyData?.rawData?.coordinates) {
      setViewMoreContent({ 
        title, 
        content: {
          coordinates: propertyData.rawData.coordinates,
          address: propertyData.address
        }
      });
    }
    // For other panels, use the provided content
    else {
      setViewMoreContent({ title, content });
    }
    
    setShowViewMore(true);
  };
  
  // Show an empty state when no search has been performed
  const renderEmptyState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700">No property data to display</h3>
        <p className="text-gray-500 mt-2">Enter an address in the search bar to analyze a property</p>
      </div>
    </div>
  );

  // Handle property removal from saved properties
  const handleRemoveProperty = (property) => {
    try {
      console.log("Removing property:", property);
      
      // Create the updated array 
      const updatedProperties = savedProperties.filter(p => p !== property);
      
      // Update state
      setSavedProperties(updatedProperties);
      
      // If the updated array is empty, clear localStorage manually
      if (updatedProperties.length === 0) {
        console.log("Clearing saved properties from localStorage");
        localStorage.removeItem('savedProperties');
      }
      
      // If the current search query matches the property being removed, clear it
      if (searchQuery === property) {
        setSearchQuery('');
        setPropertyData(null);
      }
    } catch (error) {
      console.error("Error removing property:", error);
      alert("There was an issue removing the property. Please try again.");
    }
  };
  
  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Left Sidebar */}
      <LeftSidebar savedProperties={savedProperties} onSelectProperty={handleSearch} onRemoveProperty={handleRemoveProperty} />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
        
        {/* Property Information (if available) */}
        {propertyData && !isLoading && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-indigo-800">{propertyData.address}</h2>
            <p className="text-gray-600">Last analyzed: {new Date().toLocaleString()}</p>
          </div>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-3 text-indigo-600">Analyzing property data...</p>
          </div>
        )}
        
        {/* Empty State when no search has been performed */}
        {!isLoading && !propertyData && renderEmptyState()}
        
        {/* Panels Grid */}
        {!isLoading && propertyData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TrafficPanel 
              data={propertyData.traffic}
              coordinates={propertyData.coordinates}
              onViewMore={() => handleViewMore('Traffic Data', propertyData.traffic)} 
            />
            
            <BusinessesPanel 
              data={propertyData.businesses} 
              onViewMore={() => handleViewMore('Nearby Businesses', propertyData.businesses)} 
            />
            
            <DemographicsPanel 
              data={propertyData.demographics} 
              onViewMore={() => handleViewMore('Demographics', propertyData.demographics)} 
            />
            
            <ZoningPanel 
              data={propertyData.zoning} 
              onViewMore={() => handleViewMore('Zoning Info', propertyData.zoning)} 
            />
            
            <NotesPanel 
              data={propertyData.notes} 
              onViewMore={() => handleViewMore('Notes', {
                notes: propertyData.notes
              })} 
            />
            
            <MapPanel 
              coordinates={propertyData.coordinates}
              onViewMore={() => handleViewMore('Map View', {
                coordinates: propertyData.coordinates,
                address: propertyData.address
              })} 
            />
          </div>
        )}
      </div>
      
      {/* View More Modal */}
      {showViewMore && (
        <ViewMoreModal 
          title={viewMoreContent.title}
          content={viewMoreContent.content}
          onClose={() => setShowViewMore(false)} 
        />
      )}
    </div>
  );
};

export default App;