import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, RefreshCw } from 'lucide-react';

const CssLibrarySelector = () => {
  const [cssLibrary, setCssLibrary] = useState('tailwind');
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [libraryInfo, setLibraryInfo] = useState({});

  useEffect(() => {
    fetchCssLibrary();
    fetchLibraryInfo();
  }, []);

  const fetchCssLibrary = async () => {
    try {
      const response = await fetch(ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_css_library',
          nonce: ccc_ajax.nonce,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCssLibrary(data.data.library);
        }
      }
    } catch (error) {
      console.error('Error fetching CSS library:', error);
    }
  };

  const fetchLibraryInfo = async () => {
    try {
      const response = await fetch(ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_css_library_info',
          nonce: ccc_ajax.nonce,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLibraryInfo(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching library info:', error);
    }
  };

  const handleLibraryChange = async (newLibrary) => {
    if (newLibrary === cssLibrary) return;

    try {
      const warning = await getLibraryWarning(cssLibrary, newLibrary);
      if (warning) {
        setWarningMessage(warning);
        setShowWarning(true);
        return;
      }

      await updateCssLibrary(newLibrary);
    } catch (error) {
      console.error('Error changing CSS library:', error);
    }
  };

  const getLibraryWarning = async (fromLibrary, toLibrary) => {
    try {
      const response = await fetch(ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_css_library_warning',
          nonce: ccc_ajax.nonce,
          from_library: fromLibrary,
          to_library: toLibrary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data.warning;
        }
      }
    } catch (error) {
      console.error('Error getting warning:', error);
    }
    return null;
  };

  const updateCssLibrary = async (newLibrary) => {
    setIsLoading(true);
    try {
      const response = await fetch(ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_set_css_library',
          nonce: ccc_ajax.nonce,
          library: newLibrary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCssLibrary(newLibrary);
          // Refresh library info
          fetchLibraryInfo();
        }
      }
    } catch (error) {
      console.error('Error updating CSS library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLibraryChange = async () => {
    setShowWarning(false);
    const newLibrary = cssLibrary === 'tailwind' ? 'bootstrap' : 'tailwind';
    await updateCssLibrary(newLibrary);
  };

  const regenerateTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_regenerate_templates',
          nonce: ccc_ajax.nonce,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Templates regenerated successfully!');
        }
      }
    } catch (error) {
      console.error('Error regenerating templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Settings className="w-5 h-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">CSS Library Selection</h3>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose CSS Library for All Components
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="cssLibrary"
              value="tailwind"
              checked={cssLibrary === 'tailwind'}
              onChange={(e) => handleLibraryChange(e.target.value)}
              className="mr-2 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Tailwind CSS</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="cssLibrary"
              value="bootstrap"
              checked={cssLibrary === 'bootstrap'}
              onChange={(e) => handleLibraryChange(e.target.value)}
              className="mr-2 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Bootstrap</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Custom CSS will always be applied as default behavior regardless of the selected library.
        </p>
      </div>

      {libraryInfo[cssLibrary] && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">{libraryInfo[cssLibrary].name}</h4>
          <p className="text-sm text-gray-600">{libraryInfo[cssLibrary].description}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={regenerateTemplates}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Regenerate Templates
        </button>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Warning</h3>
            </div>
            <p className="text-gray-600 mb-4">{warningMessage}</p>
            <div className="flex space-x-3">
              <button
                onClick={confirmLibraryChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Continue
              </button>
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CssLibrarySelector;
