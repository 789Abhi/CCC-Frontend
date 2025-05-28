"use client"

import { useState, useEffect } from "react"
import axios from "axios"

function PostTypes() {
  const [postTypes, setPostTypes] = useState([])
  const [components, setComponents] = useState([])
  const [selectedPostType, setSelectedPostType] = useState("page")
  const [posts, setPosts] = useState([])
  const [selectedPosts, setSelectedPosts] = useState([])
  const [selectedComponents, setSelectedComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

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
      formData.append("action", "ccc_get_posts")
      formData.append("post_type", postType)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)
      if (response.data.success) {
        setPosts(response.data.data.posts || [])
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAssign = async () => {
    if (selectedPosts.length === 0 || selectedComponents.length === 0) {
      setMessage("Please select both posts and components")
      setMessageType("error")
      return
    }

    try {
      const formData = new FormData()
      formData.append("action", "ccc_bulk_assign_components")
      formData.append("post_ids", JSON.stringify(selectedPosts))
      formData.append("component_ids", JSON.stringify(selectedComponents))
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        setMessage("Components assigned successfully")
        setMessageType("success")
        fetchPosts(selectedPostType)
        setSelectedPosts([])
        setSelectedComponents([])
      } else {
        setMessage(response.data.message || "Failed to assign components")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("Error connecting to server")
      setMessageType("error")
    }

    setTimeout(() => setMessage(""), 5000)
  }

  useEffect(() => {
    fetchPostTypes()
    fetchComponents()
  }, [])

  useEffect(() => {
    if (selectedPostType) {
      fetchPosts(selectedPostType)
      setSelectedPosts([])
    }
  }, [selectedPostType])

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-custom p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Post Type Management</h2>

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
          <label className="block text-gray-700 font-medium mb-2">Select Post Type</label>
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

        {/* Component Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Select Components to Assign</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {components.map((component) => (
              <label
                key={component.id}
                className="flex items-center p-3 border border-gray-200 rounded-custom hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedComponents.includes(component.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedComponents([...selectedComponents, component.id])
                    } else {
                      setSelectedComponents(selectedComponents.filter((id) => id !== component.id))
                    }
                  }}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">{component.name}</div>
                  <div className="text-sm text-gray-500">{component.fields?.length || 0} fields</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Posts List */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">
              {selectedPostType === "page" ? "Pages" : "Posts"} ({posts.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPosts(posts.map((p) => p.id))}
                className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedPosts([])}
                className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bgPrimary"></div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-custom">
              {posts.map((post) => (
                <label
                  key={post.id}
                  className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPosts([...selectedPosts, post.id])
                      } else {
                        setSelectedPosts(selectedPosts.filter((id) => id !== post.id))
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          post.status === "publish" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {post.status}
                      </span>
                      {post.has_components && <span className="text-blue-600">Has Components</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/wp-admin/post.php?post=${post.id}&action=edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </a>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedPosts.length} posts selected, {selectedComponents.length} components selected
          </div>
          <button
            onClick={handleBulkAssign}
            disabled={selectedPosts.length === 0 || selectedComponents.length === 0}
            className={`px-6 py-2 rounded-custom text-white transition-colors ${
              selectedPosts.length === 0 || selectedComponents.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-bgPrimary hover:bg-pink-600"
            }`}
          >
            Assign Components
          </button>
        </div>
      </div>
    </section>
  )
}

export default PostTypes
