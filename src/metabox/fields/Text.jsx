import React from 'react';

export default function TextField({ label, value, onChange, error, placeholder }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-base font-semibold mb-2 text-gray-800">{label}</label>}
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-pink-400 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 text-base transition"
      />
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
} 