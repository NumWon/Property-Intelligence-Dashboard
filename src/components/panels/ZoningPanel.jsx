import React from 'react';

const ZoningPanel = ({ data, onViewMore }) => {
  return (
    <div className="bg-white p-4 shadow-md rounded-2xl border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-indigo-700">Zoning Info</h2>
        <button 
          onClick={onViewMore}
          className="text-sm text-indigo-600 border border-indigo-300 px-2 py-1 rounded hover:bg-indigo-50"
        >
          More Info
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Classification</p>
            <p className="text-lg font-medium">{data.zoning}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-sm text-gray-500">Bylaw Document</p>
          <p className="font-medium">{data.bylawLink}</p>
        </div>
      </div>
    </div>
  );
};

export default ZoningPanel;