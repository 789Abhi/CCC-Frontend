import React from 'react';

function Textfield({ label, value, onChange, placeholder }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        type="text"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange && onChange(e.target.value)}
      />
    </div>
  );
}

export default Textfield;
