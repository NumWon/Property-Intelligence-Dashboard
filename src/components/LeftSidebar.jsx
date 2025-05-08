// src/components/LeftSidebar.jsx (Update if needed)
import React from 'react';

export default function LeftSidebar({ savedProperties = [], onSelectProperty }) {
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
              className="text-sm text-indigo-900 bg-white p-2 rounded-lg shadow-sm cursor-pointer hover:bg-indigo-50"
              onClick={() => onSelectProperty(property)}
            >
              {property}
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