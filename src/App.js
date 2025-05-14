import React, { useState, useEffect } from 'react';
import { geocodeAddress } from './services/geocodingService';
import { estimatePropertyTraffic } from './services/routingService';
import { getNearbyBusinesses } from './services/poiService';
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
  
  // Load saved properties from local storage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('savedProperties');
    if (savedItems) {
      setSavedProperties(JSON.parse(savedItems));
    }
  }, []);

  // Save properties to local storage when they change
  useEffect(() => {
    if (savedProperties.length >= 0) {
      localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
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
      
      // Step 2: Get traffic data and nearby businesses in parallel
      const [trafficData, businessesData] = await Promise.all([
        estimatePropertyTraffic(coordinates),
        getNearbyBusinesses(coordinates)
      ]);
      
      console.log("Received traffic data:", trafficData);
      
      // Step 3: Construct the property data object
      const newPropertyData = {
        address: geocodeResult.address.label,
        coordinates,
        // Store complete traffic data instead of simplified version
        traffic: trafficData, 
        businesses: {
          businesses: businessesData.restaurants.map(b => b.name)
            .concat(businessesData.retail.map(b => b.name))
            .slice(0, 3),
          distance: `within ${businessesData.restaurants.length > 0 ? 
                    businessesData.restaurants[0].distance : '1-2 km'}`
        },
        demographics: {
          population: '42,500 within 1km',
          medianIncome: '$87,200'
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
          businesses: businessesData,
          coordinates
        }
      };
      
      // Save to saved properties if not already there
      if (!savedProperties.includes(query)) {
        setSavedProperties(prev => [...prev, query]);
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
        coordinates: propertyData.coordinates
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
    const updatedProperties = savedProperties.filter(p => p !== property);
    setSavedProperties(updatedProperties);
    // No need to handle localStorage separately as the useEffect will update it
    
    // If the current search query matches the property being removed, clear it
    if (searchQuery === property) {
      setSearchQuery('');
      setPropertyData(null);
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