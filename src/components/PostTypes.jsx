"use client"

import { useState, useEffect } from "react"
import axios from "axios"

function PostTypes() {
  const [postTypes, setPostTypes] = useState([])
  const [components, setComponents] = useState([])
  const [selectedPostType, setSelectedPostType] = useState("page")
  const [posts, setPosts] = useState([])
  const [postComponentAssignments, setPostComponentAssignments] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const fetchPostTypes = async () => {
    try {
      const formData = new FormData()
      formData.append("action", "ccc_get_post_types")
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)
      if (response.data.success) {
        setPostTypes(response.data.data.post_types || [])
      }
    } catch (error) {
      console.error("Failed to fetch post types:", error)
    }
  }

  const fetchComponents = async () => {
    try {
      const formData = new FormData()
      formData.append("action", "ccc_get_components")
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)
      if (response.data.success) {
        setComponents(response.data.data.components || [])
      }
    } catch (error) {
      console.error("Failed to fetch components:", error)
    }
  }

  const fetchPosts = async (postType) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("action", "ccc_get_posts_with_components")
      formData.append("post_type", postType)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)
      if (response.data.success) {
        const postsData = response.data.data.posts || []
        setPosts(postsData)

        // Build component assignments map
        const assignments = {}
        postsData.forEach((post) => {
          assignments[post.id] = post.assigned_components || []
        })
        setPostComponentAssignments(assignments)
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleComponentAssignmentChange = (postId, componentId, isAssigned) => {
    setPostComponentAssignments((prev) => {
      const newAssignments = { ...prev }
      if (!newAssignments[postId]) {
        newAssignments[postId] = []
      }

      if (isAssigned) {
        // Add component if not already assigned
        if (!newAssignments[postId].includes(componentId)) {
          newAssignments[postId] = [...newAssignments[postId], componentId]
        }
      } else {
        // Remove component
        newAssignments[postId] = newAssignments[postId].filter((id) => id !== componentId)
      }

      return newAssignments
    })
  }

  const handleSaveAssignments = async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("action", "ccc_save_component_assignments")
      formData.append("assignments", JSON.stringify(postComponentAssignments))
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage("Component assignments saved successfully", "success")
        fetchPosts(selectedPostType) // Refresh the posts data
      } else {
        showMessage(response.data.message || "Failed to save assignments", "error")
      }
    } catch (error) {
      showMessage("Error connecting to server", "error")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchPostTypes()
    fetchComponents()
  }, [])

  useEffect(() => {
    if (selectedPostType) {
      fetchPosts(selectedPostType)
    }
  }, [selectedPostType])

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-custom p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Components to Content</h2>

        {message && (
          <div
            className={`mb-4 p-4 rounded-custom ${
              messageType === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Post Type Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Select Content Type</label>
          <select
            value={selectedPostType}
            onChange={(e) => setSelectedPostType(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary"
          >
            {postTypes.map((postType) => (
              <option key={postType.name} value={postType.name}>
                {postType.label} ({postType.count})
              </option>
            ))}
          </select>
        </div>

        {/* Component Assignment Matrix */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Component Assignments</h3>
          <p className="text-sm text-gray-600 mb-4">
            Check the boxes to assign components to specific {selectedPostType === "page" ? "pages" : "posts"}. Click
            "Save Assignments" to apply changes.
          </p>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bgPrimary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-300 rounded-custom">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-gray-300 px-4 py-3 text-left font-medium">
                      {selectedPostType === "page" ? "Page" : "Post"}
                    </th>
                    {components.map((component) => (
                      <th
                        key={component.id}
                        className="border-b border-l border-gray-300 px-3 py-3 text-center min-w-[120px]"
                      >
                        <div className="text-sm font-medium">{component.name}</div>
                        <div className="text-xs text-gray-500">{component.fields?.length || 0} fields</div>
                      </th>
                    ))}
                    <th className="border-b border-l border-gray-300 px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, index) => (
                    <tr key={post.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              post.status === "publish"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {post.status}
                          </span>
                          {postComponentAssignments[post.id]?.length > 0 && (
                            <span className="text-blue-600 text-xs">
                              {postComponentAssignments[post.id].length} component(s)
                            </span>
                          )}
                        </div>
                      </td>
                      {components.map((component) => (
                        <td key={component.id} className="border-b border-l border-gray-200 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={postComponentAssignments[post.id]?.includes(component.id) || false}
                            onChange={(e) => handleComponentAssignmentChange(post.id, component.id, e.target.checked)}
                            className="w-4 h-4 text-bgPrimary focus:ring-bgPrimary border-gray-300 rounded"
                          />
                        </td>
                      ))}
                      <td className="border-b border-l border-gray-200 px-4 py-3 text-center">
                        <a
                          href={`/wp-admin/post.php?post=${post.id}&action=edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 text-sm underline"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {posts.length} {selectedPostType === "page" ? "pages" : "posts"} • {components.length} components available
          </div>
          <button
            onClick={handleSaveAssignments}
            disabled={loading || saving}
            className={`px-6 py-3 rounded-custom text-white font-medium transition-colors ${
              loading || saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-bgPrimary hover:bg-pink-600 shadow-md hover:shadow-lg"
            }`}
          >
            {saving ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Assignments"
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

export default PostTypes
