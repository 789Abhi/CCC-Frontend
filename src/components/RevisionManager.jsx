import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function RevisionManager({ postId, postTitle }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingRevision, setCreatingRevision] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  // Load revisions for this post
  const loadRevisions = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_field_revisions',
          nonce: cccData.nonce,
          post_id: postId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setRevisions(data.revisions);
      } else {
        console.error('Failed to load revisions:', data.message);
      }
    } catch (error) {
      console.error('Error loading revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new revision
  const createRevision = async () => {
    if (!postId) return;
    
    setCreatingRevision(true);
    try {
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_create_field_revision',
          nonce: cccData.nonce,
          post_id: postId,
          revision_note: revisionNote
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Revision created successfully!');
        setRevisionNote('');
        loadRevisions(); // Reload the list
      } else {
        toast.error('Failed to create revision: ' + data.message);
      }
    } catch (error) {
      toast.error('Error creating revision: ' + error.message);
    } finally {
      setCreatingRevision(false);
    }
  };

  // Restore a revision
  const restoreRevision = async (revisionId) => {
    if (!postId || !revisionId) return;
    
    if (!confirm('Are you sure you want to restore this revision? This will overwrite all current field values.')) {
      return;
    }
    
    try {
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_restore_field_revision',
          nonce: cccData.nonce,
          revision_id: revisionId,
          post_id: postId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Revision restored successfully!');
        // Optionally reload the page to show restored data
        window.location.reload();
      } else {
        toast.error('Failed to restore revision: ' + data.message);
      }
    } catch (error) {
      toast.error('Error restoring revision: ' + error.message);
    }
  };

  // Delete a revision
  const deleteRevision = async (revisionId) => {
    if (!revisionId) return;
    
    if (!confirm('Are you sure you want to delete this revision? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_delete_field_revision',
          nonce: cccData.nonce,
          revision_id: revisionId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Revision deleted successfully!');
        loadRevisions(); // Reload the list
      } else {
        toast.error('Failed to delete revision: ' + data.message);
      }
    } catch (error) {
      toast.error('Error deleting revision: ' + error.message);
    }
  };

  useEffect(() => {
    loadRevisions();
  }, [postId]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Field Value Revisions</h3>
        <div className="text-sm text-gray-500">
          Post: {postTitle} (ID: {postId})
        </div>
      </div>

      {/* Create New Revision */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-3">Create New Revision</h4>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Revision note (optional)"
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            onClick={createRevision}
            disabled={creatingRevision}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:opacity-50"
          >
            {creatingRevision ? 'Creating...' : 'Create Revision'}
          </button>
        </div>
      </div>

      {/* Revisions List */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Revision History</h4>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading revisions...</p>
          </div>
        ) : revisions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>No revisions found for this post.</p>
            <p className="text-sm">Create a revision to save the current state of your field values.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {revisions.map((revision) => (
              <div key={revision.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Revision #{revision.id}
                      </span>
                      <span className="text-xs text-gray-500">
                        {revision.created_at_formatted}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Created by: {revision.created_by_name}
                    </div>
                    {revision.revision_note && (
                      <div className="text-sm text-gray-600 italic">
                        Note: {revision.revision_note}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => restoreRevision(revision.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => deleteRevision(revision.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RevisionManager; 