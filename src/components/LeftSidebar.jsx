import React from 'react';

export default function LeftSidebar({ savedProperties = [], onSelectProperty, onRemoveProperty }) {
  return (
    <div className="w-64 bg-indigo-100 p-6 overflow-y-auto shadow-inner">
      <h2 className="text-2xl font-bold text-indigo-800 mb-4">Saved Properties</h2>
      
      {savedProperties.length === 0 ? (
        <p className="text-indigo-600 text-sm">No saved properties yet</p>
      ) : (
        <ul className="space-y-2">
          {savedProperties.map((property, i) => (
            <li 
              key={i} 
              className="text-sm text-indigo-900 bg-white p-2 rounded-lg shadow-sm hover:bg-indigo-50 flex justify-between items-center"
            >
              <span 
                className="cursor-pointer flex-grow truncate"
                onClick={() => onSelectProperty(property)}
              >
                {property}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering onSelectProperty
                  onRemoveProperty(property);
                }}
                className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                aria-label={`Remove ${property}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-indigo-800 mb-2">Quick Stats</h3>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-indigo-900 mb-1">Properties analyzed: {savedProperties.length}</p>
          <p className="text-sm text-indigo-900">Last analysis: {savedProperties.length > 0 ? new Date().toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}