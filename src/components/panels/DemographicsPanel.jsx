// src/components/panels/DemographicsPanel.jsx
import React from 'react';

const DemographicsPanel = ({ data, onViewMore }) => {
  const hasPopulation = data.population && data.population !== "Data unavailable";
  
  return (
    <div className="bg-white p-4 shadow-md rounded-2xl border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-indigo-700">Demographics</h2>
        <button 
          onClick={onViewMore}
          className="text-sm text-indigo-600 border border-indigo-300 px-2 py-1 rounded hover:bg-indigo-50"
        >
          More Info
        </button>
      </div>
      
      <div className="space-y-3">
        {data.location && (
          <div className="text-sm text-gray-600 mb-2">{data.location}</div>
        )}
        
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Population</p>
            <p className={`text-lg font-medium ${hasPopulation ? 'text-gray-800' : 'text-gray-400 italic'}`}>
              {hasPopulation ? data.population : "Data unavailable"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Median Income</p>
            <p className="text-lg font-medium text-gray-400 italic">Data unavailable</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemographicsPanel;