import React from 'react';

const NotesPanel = ({ data, onViewMore }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-indigo-700">Notes</h2>
        <button 
          onClick={onViewMore}
          className="text-indigo-600 border border-indigo-600 px-3 py-1 rounded hover:bg-indigo-50 text-sm"
        >
          More Info
        </button>
      </div>
      
      <div className="space-y-2">
        {data.map((note, index) => (
          <p key={index} className="text-gray-700">{note}</p>
        ))}
      </div>
    </div>
  );
};

export default NotesPanel;