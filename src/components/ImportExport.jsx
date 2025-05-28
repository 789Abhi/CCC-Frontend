"use client"

import { useState } from "react"
import axios from "axios"

function ImportExport() {
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const showMessage = (msg, type) => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 5000)
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const formData = new FormData()
      formData.append("action", "ccc_export_components")
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
          type: "application/json",
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ccc-components-export-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        showMessage("Components exported successfully", "success")
      } else {
        showMessage(response.data.message || "Export failed", "error")
      }
    } catch (error) {
      showMessage("Error connecting to server", "error")
    } finally {
      setExportLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      showMessage("Please select a file to import", "error")
      return
    }

    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append("action", "ccc_import_components")
      formData.append("nonce", window.cccData.nonce)
      formData.append("import_file", importFile)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage("Components imported successfully", "success")
        setImportFile(null)
        // Reset file input
        document.getElementById("import-file").value = ""
      } else {
        showMessage(response.data.message || "Import failed", "error")
      }
    } catch (error) {
      showMessage("Error connecting to server", "error")
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-custom p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Import & Export</h2>

        {message && (
          <div
            className={`mb-6 p-4 rounded-custom ${
              messageType === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Export Section */}
          <div className="border border-gray-200 rounded-custom p-6">
            <div className="text-center mb-6">
              <div className="text-blue-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Export Components</h3>
              <p className="text-gray-600 text-sm mb-4">
                Download all your components and fields as a JSON file for backup or migration.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded p-4">
                <h4 className="font-medium text-gray-700 mb-2">What's included:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All component definitions</li>
                  <li>• Field configurations</li>
                  <li>• Component settings</li>
                  <li>• Template information</li>
                </ul>
              </div>

              <button
                onClick={handleExport}
                disabled={exportLoading}
                className={`w-full py-3 px-4 rounded-custom text-white transition-colors ${
                  exportLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {exportLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Exporting...
                  </span>
                ) : (
                  "Export Components"
                )}
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="border border-gray-200 rounded-custom p-6">
            <div className="text-center mb-6">
              <div className="text-green-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Import Components</h3>
              <p className="text-gray-600 text-sm mb-4">
                Upload a JSON file to import components from another site or backup.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Existing components with same handles will be overwritten</li>
                  <li>• Only import files from trusted sources</li>
                  <li>• Create a backup before importing</li>
                </ul>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Select Import File</label>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary"
                />
                <p className="text-xs text-gray-500 mt-1">Only JSON files are supported</p>
              </div>

              <button
                onClick={handleImport}
                disabled={importLoading || !importFile}
                className={`w-full py-3 px-4 rounded-custom text-white transition-colors ${
                  importLoading || !importFile ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {importLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Importing...
                  </span>
                ) : (
                  "Import Components"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-gray-50 rounded-custom p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Migration Guide</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Best Practices:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Always export before making major changes</li>
                <li>• Test imports on staging sites first</li>
                <li>• Keep regular backups of your components</li>
                <li>• Document custom field configurations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">File Format:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• JSON format with UTF-8 encoding</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Includes component metadata</li>
                <li>• Compatible across plugin versions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ImportExport
