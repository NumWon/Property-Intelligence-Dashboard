import React from 'react';

const NotesPanel = ({ data, onViewMore }) => {
  return (
    <div className="bg-white p-4 shadow-md rounded-2xl border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-indigo-700">Notes</h2>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Property Notes</p>
            <p className="text-lg font-medium">{data.length > 0 ? `${data.length} Notes` : 'No Notes'}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded">
          {data.map((note, index) => (
            <p key={index} className={`${index > 0 ? 'mt-2' : ''} text-gray-700`}>{note}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;