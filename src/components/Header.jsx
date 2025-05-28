import React, { useState } from "react";
import logo from "/CCC-Logo.svg";
import settingsLogo from "/Settings.svg";
import Components from "./Components";
import ComponentList from "./ComponentList";

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
            Custom Craft Component Updates
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-customGray rounded-custom p-4 mb-6 flex max-w-[700px] mx-auto items-center justify-between mt-5">
        <div className="flex gap-2 w-full justify-between">
          {["Components", "Post Types", "Taxonomies", "Import - Export"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-custom py-2 px-6 font-medium ${
                  activeTab === tab
                    ? "bg-bgPrimary text-white"
                    : "text-gray-700 "
                }`}
              >
                {tab}
              </button>
            )
          )}
          <button className="">
            <img src={settingsLogo} alt="" />
          </button>
        </div>
      </div>

      <ComponentList />
    </div>
  );
};

export default CustomCraftComponent;
