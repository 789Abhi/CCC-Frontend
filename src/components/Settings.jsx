import React, { useState, useEffect } from 'react';
import { Save, Clock, Settings as SettingsIcon, CheckCircle, AlertCircle, Key, Shield } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    license_key: '',
    license_status: null,
    license_info: null
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
      
      // Load license settings
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_license_info',
          nonce: cccData.nonce
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings({
            license_key: data.data.license_key || '',
            license_status: data.data.status,
            license_info: data.data.info
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load license settings' });
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
          action: 'ccc_save_license_key',
          nonce: cccData.nonce,
          license_key: settings.license_key
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'License key saved and validated successfully!' });
          setSettings(prev => ({
            ...prev,
            license_status: data.data.status,
            license_info: data.data.info
          }));
          setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } else {
          setMessage({ type: 'error', text: data.data || 'Failed to validate license key' });
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save license key' });
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
          {/* License Key Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">License Key</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="license_key" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your license key
                </label>
                <input
                  type="text"
                  id="license_key"
                  value={settings.license_key}
                  onChange={(e) => handleSettingChange('license_key', e.target.value)}
                  placeholder="Enter your license key here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the license key you received after purchasing Basic, Pro, or Max plan.
                </p>
              </div>

              {/* License Status */}
              {settings.license_status && (
                <div className={`p-4 rounded-md border ${
                  settings.license_status === 'valid' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${
                      settings.license_status === 'valid' ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        settings.license_status === 'valid' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {settings.license_status === 'valid' ? 'License Active' : 'License Invalid'}
                      </p>
                      {settings.license_info && (
                        <p className={`text-xs ${
                          settings.license_status === 'valid' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {settings.license_info}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
