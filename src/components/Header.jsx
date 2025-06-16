import { useState } from "react"
import PostTypes from "./PostTypes"
import ImportExport from "./ImportExport"
import ComponentList from "./ComponentList"
import Taxonomies from "./Taxonomies"
import logo from "/CCC-Logo.svg"

function Header() {
  const [activeTab, setActiveTab] = useState("components")

  const tabs = [
    {
      id: "components",
      label: "Components",
      description: "Create and manage custom components",
    },
    {
      id: "post-types",
      label: "Post Types",
      description: "Assign components to content types",
      comingSoon: true,
    },
    {
      id: "taxonomies",
      label: "Taxonomies",
      description: "Manage taxonomy assignments",
      comingSoon: true,
    },
    {
      id: "import-export",
      label: "Import/Export",
      description: "Backup and migrate components",
      comingSoon: true,
    },
  ]

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "components":
        return <ComponentList />
      case "post-types":
        return <PostTypes />
      case "taxonomies":
        return <Taxonomies />
      case "import-export":
        return <ImportExport />
      default:
        return <ComponentList />
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div>
        <div>
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-[30px] w-full">
              <div className="h-[110px] w-[160px] flex items-center justify-center">
                <img
                  className="w-full h-full object-contain"
                  src={logo}
                  alt="CCC Logo"
                />
              </div>
              <div className="flex-1 px-10 py-7 bg-customGray text-center rounded-custom">
                <h1 className="text-4xl font-bold text-bgPrimary">Custom Craft Components</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-customGray border-b p-5 rounded-custom mt-3">
        <div>
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group rounded-custom relative flex border border-bgPrimary items-center space-x-2 py-4 px-4 font-medium text-sm transition-colors ${
                    isActive ? "text-white bg-bgPrimary" : "text-bgSecondary"
                  }`}
                >
                  <span className="text-lg font-bold">{tab.label}</span>
                  {tab.comingSoon && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Soon
                    </span>
                  )}
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {tab.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="rounded-custom py-3">{renderActiveComponent()}</main>
    </div>
  )
}

export default Header