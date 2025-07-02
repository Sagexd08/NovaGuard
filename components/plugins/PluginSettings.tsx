'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Toggle, Trash2, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { pluginManager, PluginManifest } from '@/lib/plugins/plugin-manager';

interface PluginSettingsProps {
  onClose?: () => void;
}

export default function PluginSettings({ onClose }: PluginSettingsProps) {
  const [activePlugins, setActivePlugins] = useState<PluginManifest[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<PluginManifest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'available' | 'settings'>('active');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = () => {
    const active = pluginManager.getActivePlugins();
    const all = pluginManager.getPlugins();
    const available = all.filter(plugin => !active.some(ap => ap.id === plugin.id));
    
    setActivePlugins(active);
    setAvailablePlugins(available);
  };

  const handleTogglePlugin = async (pluginId: string, isActive: boolean) => {
    setLoading(true);
    try {
      if (isActive) {
        await pluginManager.deactivatePlugin(pluginId);
      } else {
        await pluginManager.activatePlugin(pluginId);
      }
      loadPlugins();
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadPlugin = async (pluginId: string) => {
    setLoading(true);
    try {
      await pluginManager.deactivatePlugin(pluginId);
      await pluginManager.activatePlugin(pluginId);
      loadPlugins();
    } catch (error) {
      console.error('Failed to reload plugin:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Plugin Settings</h1>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setSelectedTab('active')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'active'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Active ({activePlugins.length})
          </button>
          <button
            onClick={() => setSelectedTab('available')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'available'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Available ({availablePlugins.length})
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'settings'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {selectedTab === 'active' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Plugins</h2>
              <button
                onClick={loadPlugins}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {activePlugins.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Plugins</h3>
                <p className="text-gray-500">Activate plugins from the Available tab to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activePlugins.map(plugin => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    isActive={true}
                    onToggle={() => handleTogglePlugin(plugin.id, true)}
                    onReload={() => handleReloadPlugin(plugin.id)}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'available' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Available Plugins</h2>
            
            {availablePlugins.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Plugins Active</h3>
                <p className="text-gray-500">All available plugins are currently active</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availablePlugins.map(plugin => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    isActive={false}
                    onToggle={() => handleTogglePlugin(plugin.id, false)}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Plugin System Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Auto-activate core plugins</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically activate essential plugins on startup</p>
                </div>
                <Toggle defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Plugin update notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when plugin updates are available</p>
                </div>
                <Toggle defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Allow experimental plugins</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable plugins marked as experimental or beta</p>
                </div>
                <Toggle />
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Plugin Security</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Only install plugins from trusted sources. Plugins have access to your workspace and can execute code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PluginCardProps {
  plugin: PluginManifest;
  isActive: boolean;
  onToggle: () => void;
  onReload?: () => void;
  loading?: boolean;
}

function PluginCard({ plugin, isActive, onToggle, onReload, loading }: PluginCardProps) {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            {plugin.name.charAt(0)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{plugin.name}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                v{plugin.version}
              </span>
              {isActive && (
                <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{plugin.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>by {plugin.author}</span>
              <span>{plugin.categories.join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isActive && onReload && (
            <button
              onClick={onReload}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Reload plugin"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          <button
            onClick={onToggle}
            disabled={loading}
            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
            }`}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
