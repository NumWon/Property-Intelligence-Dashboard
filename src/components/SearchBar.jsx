// src/components/SearchBar.jsx (Update if needed)
import React, { useState } from 'react';

export default function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter property address"
        className="flex-1 border border-indigo-300 rounded-l-xl px-3 py-2"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="bg-indigo-600 text-white px-4 py-2 rounded-r-xl hover:bg-indigo-700 flex items-center"
        disabled={isLoading || !query.trim()}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Property'}
      </button>
    </form>
  );
}