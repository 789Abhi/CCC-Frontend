"use client"

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
    </section>
  )
}

export default PostTypes