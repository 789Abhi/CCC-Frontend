"use client"

import RevisionManager from './RevisionManager'

function PostTypes() {
  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Post Type Management</h2>

        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-600 mb-2">Post Type Management</h3>
          <p className="text-gray-500 mb-6">Create and manage custom post types for your WordPress site</p>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-800">
            <p className="font-medium">Coming Soon!</p>
            <p className="text-sm mt-1">This feature will allow you to create and manage custom post types.</p>
          </div>
        </div>
      </div>

      {/* Field Value Revisions Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Field Value Revisions</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Manage revisions of field values for your components. This allows you to restore previous versions of your data.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            <p className="font-medium">Revision System</p>
            <p className="text-sm mt-1">
              • Automatic revisions are created when field values are saved<br/>
              • Manual revisions can be created with custom notes<br/>
              • Revisions are preserved even when plugin is uninstalled<br/>
              • Restore any previous version of your field data
            </p>
          </div>
        </div>

        {/* Revision Manager for Global Management */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Global Revision Management</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select a post to manage its field value revisions:
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p>Revision management interface will be available here.</p>
              <p className="text-sm mt-1">You can manage revisions directly from individual post pages.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PostTypes