import React, { useState, useEffect } from 'react';
import { Save, Clock, Settings as SettingsIcon, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    api_key: '',
    other_settings: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load settings via AJAX
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_settings',
          nonce: cccData.nonce
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_save_settings',
          nonce: cccData.nonce,
          settings: JSON.stringify(settings)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Settings saved successfully!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
          setMessage({ type: 'error', text: data.data || 'Failed to save settings' });
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Plugin Settings</h1>
              <p className="text-sm text-gray-600">Configure global settings for Custom Craft Component</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mx-6 mt-4 p-4 rounded-md flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Settings Form */}
        <div className="p-6 space-y-6">
          {/* Future Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Plugin Settings</h3>
            </div>
            <p className="text-sm text-gray-600">
              More settings will be added here in future updates.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
