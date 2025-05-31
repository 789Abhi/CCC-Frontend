"use client"

import { useState } from "react"
import ComponentList from "./ComponentList" // Corrected import
import PostTypes from "./PostTypes"
import Taxonomies from "./Taxonomies"
import ImportExport from "./ImportExport"

function Header() {
  const [activeTab, setActiveTab] = useState("components")

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "components":
        return <ComponentList /> // Corrected component name
      case "post-types":
        return <PostTypes />
      case "taxonomies":
        return <Taxonomies />
      case "import-export":
        return <ImportExport />
      default:
        return <ComponentList /> // Corrected component name
    }
  }

  return (
    <div className=" text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Custom Craft Componentskk</h1>
      <nav className="flex space-x-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "components" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveTab("components")}
        >
          Components
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "post-types" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveTab("post-types")}
        >
          Post Types
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "taxonomies" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveTab("taxonomies")}
        >
          Taxonomies (Coming Soon)
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "import-export" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveTab("import-export")}
        >
          Import/Export (Coming Soon)
        </button>
      </nav>
      <div className="mt-6">{renderActiveComponent()}</div>
    </div>
  )
}

export default Header
