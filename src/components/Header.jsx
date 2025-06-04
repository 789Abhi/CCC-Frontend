"use client"

import { useState } from "react"
import { Blocks, FileType, Tags, Download, Settings, Sparkles } from "lucide-react"
import PostTypes from "./PostTypes"
import ImportExport from "./ImportExport"
import ComponentList from "./ComponentList"
import Taxonomies from "./Taxonomies"

function Header() {
  const [activeTab, setActiveTab] = useState("components")

  const tabs = [
    {
      id: "components",
      label: "Components",
      icon: Blocks,
      description: "Create and manage custom components",
    },
    {
      id: "post-types",
      label: "Post Types",
      icon: FileType,
      description: "Assign components to content types",
    },
    {
      id: "taxonomies",
      label: "Taxonomies",
      icon: Tags,
      description: "Manage taxonomy assignments",
      comingSoon: true,
    },
    {
      id: "import-export",
      label: "Import/Export",
      icon: Download,
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
    <div className="min-h-screen ">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Custom Craft Components</h1>
                <p className="text-sm text-slate-500">Build dynamic content with ease</p>
              </div>
            </div>

            {/* Settings Button */}
            <button className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-purple-500" : "text-slate-400 group-hover:text-slate-500"}`}
                  />
                  <span>{tab.label}</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderActiveComponent()}</main>
    </div>
  )
}

export default Header
