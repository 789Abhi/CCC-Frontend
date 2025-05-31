"use client"

import { useState, useEffect } from "react"
import logo from "/CCC-Logo.svg"
import settingsLogo from "/Settings.svg"
import Components from "./Components"
import PostTypes from "./PostTypes"


const CustomCraftComponent = () => {
  const [activeTab, setActiveTab] = useState("Components")

  // Sync with WordPress admin menu
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const page = urlParams.get("page")
    const subpage = urlParams.get("subpage")

    if (page === "custom-craft-component") {
      switch (subpage) {
        case "post-types":
          setActiveTab("Post Types")
          break
        case "taxonomies":
          setActiveTab("Taxonomies")
          break
        case "import-export":
          setActiveTab("Import - Export")
          break
        default:
          setActiveTab("Components")
      }
    }
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)

    // Update WordPress admin URL
    const baseUrl = window.location.pathname + "?page=custom-craft-component"
    let newUrl = baseUrl

    switch (tab) {
      case "Post Types":
        newUrl += "&subpage=post-types"
        break
      case "Taxonomies":
        newUrl += "&subpage=taxonomies"
        break
      case "Import - Export":
        newUrl += "&subpage=import-export"
        break
      default:
        newUrl = baseUrl
    }

    window.history.pushState({}, "", newUrl)
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "Components":
        return <Components />
      case "Post Types":
        return <PostTypes />
      case "Taxonomies":
        return <Taxonomies />
      case "Import - Export":
        return <ImportExport />
      default:
        return <Components />
    }
  }

  const isTabActive = (tab) => {
    // Only Components and Post Types are fully functional
    return ["Components", "Post Types"].includes(tab)
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="flex gap-4 mb-6">
        <div className="h-[69px]">
          <img className="h-full object-contain" src={logo || "/placeholder.svg"} alt="CCC Logo" />
        </div>
        <div className="bg-white rounded-custom flex-1 py-3 px-6 flex justify-center items-center shadow-sm border border-gray-200">
          <h1 className="text-bgPrimary font-bold lg:text-[28px] text-lg text-center">
            Custom Craft Component Manager
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-custom p-2 mb-6 flex max-w-[800px] mx-auto items-center justify-between shadow-sm border border-gray-200">
        <div className="flex gap-1 w-full">
          {["Components", "Post Types", "Taxonomies", "Import - Export"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              disabled={!isTabActive(tab)}
              className={`rounded-custom py-3 px-6 font-medium transition-all duration-200 flex-1 text-center relative ${
                activeTab === tab
                  ? "bg-bgPrimary text-white shadow-md transform scale-105"
                  : isTabActive(tab)
                    ? "text-gray-600 hover:bg-gray-50 hover:text-bgPrimary"
                    : "text-gray-400 cursor-not-allowed bg-gray-100"
              }`}
            >
              {tab}
              {!isTabActive(tab) && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  Soon
                </span>
              )}
            </button>
          ))}
          <button className="p-3 hover:bg-gray-50 rounded-custom transition-colors">
            <img src={settingsLogo || "/placeholder.svg"} alt="Settings" className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="transition-all duration-300">
        {isTabActive(activeTab) ? (
          renderActiveComponent()
        ) : (
          <div className="bg-white rounded-custom p-8 shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">{activeTab}</h3>
              <p className="text-gray-500 mb-6">This feature is coming soon!</p>
              <div className="bg-blue-50 border border-blue-200 rounded-custom p-4 text-blue-800 max-w-md mx-auto">
                <p className="font-medium">Under Development</p>
                <p className="text-sm mt-1">We're working hard to bring you this feature. Stay tuned for updates!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomCraftComponent
