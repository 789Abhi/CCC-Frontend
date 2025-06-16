function Taxonomies() {
  return (
    <section className="space-y-6">
      <div className="bg-white rounded-custom p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Taxonomy Management</h2>

        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-600 mb-2">Taxonomy Management</h3>
          <p className="text-gray-500 mb-6">Manage component assignments for categories, tags, and custom taxonomies</p>

          <div className="bg-blue-50 border border-blue-200 rounded-custom p-4 text-blue-800">
            <p className="font-medium">Coming Soon!</p>
            <p className="text-sm mt-1">This feature will allow you to assign components to taxonomy terms.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Taxonomies