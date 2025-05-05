import React, { useState } from "react";
import logo from "/CCC-Logo.svg";
import settingsLogo from "/Settings.svg";

const CustomCraftComponent = () => {
  const [activeTab, setActiveTab] = useState("Components");
  
  return (
    <div className=" ">
   <div className="flex gap-4">
        <div className="h-[69px]">
          <img className="h-full object-contain" src={logo} alt="CCC Logo" />
        </div>
        <div className="bg-customGray rounded-custom flex-1 py-3 px-3 flex justify-center items-center">
          <h1 className="text-bgPrimary font-bold lg:text-[30px] text-lg text-center">
            Custom Craft Component
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-customGray rounded-full p-2 mb-6 flex items-center justify-between mt-5">
        <div className="flex gap-2 w-full justify-between">
          {["Components", "Post Types", "Taxonomies", "Import - Export"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full py-2 px-6 font-medium ${
                activeTab === tab 
                  ? "bg-bgPrimary text-white" 
                  : "text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
                 <button className="">
      <img src={settingsLogo} alt="" />
        </button>
        </div>
 
      </div>

      {/* Content Section */}
      <div className="bg-gray-200 rounded-3xl p-4">
        {/* Add New Button */}
        <button className="bg-white border-2 border-bgPrimary text-bgPrimary rounded-full px-6 py-2 mb-6 flex items-center gap-2">
          Add New
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>

        {/* Component Card */}
        <div className="border-2 border-bgPrimary rounded-3xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">Home Banner</h3>
            <div className="flex gap-2">
              <button className="bg-white border border-gray-300 rounded-full px-4 py-1 text-sm">Import</button>
              <button className="bg-white border border-gray-300 rounded-full px-4 py-1 text-sm">Export</button>
              <button className="bg-white border border-gray-300 rounded-full px-4 py-1 text-sm">Edit</button>
              <button className="bg-white border border-gray-300 rounded-full px-4 py-1 text-sm">Delete</button>
            </div>
          </div>

          <div className="border-2 border-bgPrimary rounded-3xl p-4 mb-4 text-center text-gray-500">
            Add Or Drag Here
          </div>

          <div className="flex gap-2">
            <button className="border-2 border-bgPrimary rounded-full px-4 py-1 text-sm">Link Existing</button>
            <button className="border-2 border-bgPrimary rounded-full px-4 py-1 text-sm">Create Field</button>
          </div>
        </div>

        {/* Add New Component Button */}
        <div className="border-2 border-bgPrimary rounded-3xl p-6 flex items-center justify-center gap-2 text-lg">
          Add New Component
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CustomCraftComponent;