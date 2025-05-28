import React from "react";

function Components() {
  return (
    <section>
      <div className="bg-customGray rounded-custom p-4">
        {/* Add New Button */}
        <button className=" border-2 border-bgPrimary  rounded-full text-bgSecondary font-medium  px-6 py-2 mb-6 flex items-center gap-2">
          Add New
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>

        {/* Component Card */}
        <div className="bg-white p-6 rounded-custom">
          <div className="border-2 border-bgPrimary bg-customGray rounded-custom p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium">Home Banner</h3>
              <div className="flex gap-2">
                <button className=" border border-bgPrimary rounded-custom px-4 py-1 text-sm">
                  Import
                </button>
                <button className=" border border-bgPrimary rounded-custom px-4 py-1 text-sm">
                  Export
                </button>
                <button className=" border border-bgPrimary rounded-custom px-4 py-1 text-sm">
                  Edit
                </button>
                <button className=" border border-bgPrimary rounded-custom px-4 py-1 text-sm">
                  Delete
                </button>
              </div>
            </div>

            <div className="border-2 border-bgPrimary rounded-3xl p-4 mb-4 text-center text-gray-500">
              Add Or Drag Here
            </div>

            <div className="flex gap-2">
              <button className="border-2 border-bgPrimary rounded-full px-4 py-1 text-sm">
                Link Existing
              </button>
              <button className="border-2 border-bgPrimary rounded-full px-4 py-1 text-sm">
                Create Field
              </button>
            </div>
          </div>

          {/* Add New Component Button */}
          <div className="border-2 border-bgPrimary bg-customGray rounded-custom p-6 flex items-center justify-center gap-2 text-lg">
            Add New Component
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Components;
