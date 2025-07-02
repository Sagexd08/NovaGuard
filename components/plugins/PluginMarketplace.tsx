'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Star, Shield, Code, Palette, Zap, Users, TestTube, Rocket, BarChart3, Settings, Filter, Grid, List } from 'lucide-react';
import { pluginManager, PluginManifest, PluginCategory } from '@/lib/plugins/plugin-manager';

interface PluginMarketplaceProps {
  onInstallPlugin?: (pluginId: string) => void;
  onUninstallPlugin?: (pluginId: string) => void;
}

const categoryIcons: Record<PluginCategory, React.ReactNode> = {
  Security: <Shield className="w-4 h-4" />,
  Languages: <Code className="w-4 h-4" />,
  Themes: <Palette className="w-4 h-4" />,
  Snippets: <Zap className="w-4 h-4" />,
  Debuggers: <Settings className="w-4 h-4" />,
  Formatters: <Grid className="w-4 h-4" />,
  Linters: <List className="w-4 h-4" />,
  Blockchain: <Zap className="w-4 h-4" />,
  AI: <Star className="w-4 h-4" />,
  Collaboration: <Users className="w-4 h-4" />,
  Testing: <TestTube className="w-4 h-4" />,
  Deployment: <Rocket className="w-4 h-4" />,
  Analytics: <BarChart3 className="w-4 h-4" />
};

export default function PluginMarketplace({ onInstallPlugin, onUninstallPlugin }: PluginMarketplaceProps) {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [activePlugins, setActivePlugins] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = () => {
    const allPlugins = pluginManager.getPlugins();
    const active = new Set(pluginManager.getActivePlugins().map(p => p.id));
    
    setPlugins(allPlugins);
    setActivePlugins(active);
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = searchQuery === '' || 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || 
      plugin.categories.includes(selectedCategory as PluginCategory);

    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (pluginId: string) => {
    try {
      await pluginManager.activatePlugin(pluginId);
      setActivePlugins(prev => new Set([...prev, pluginId]));
      onInstallPlugin?.(pluginId);
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    try {
      await pluginManager.deactivatePlugin(pluginId);
      setActivePlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(pluginId);
        return newSet;
      });
      onUninstallPlugin?.(pluginId);
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    }
  };

  const categories: (PluginCategory | 'All')[] = [
    'All', 'Security', 'Languages', 'Themes', 'Blockchain', 'AI', 'Testing', 'Deployment'
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plugin Marketplace</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PluginCategory | 'All')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Plugin List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No plugins found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredPlugins.map(plugin => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                isInstalled={activePlugins.has(plugin.id)}
                onInstall={() => handleInstall(plugin.id)}
                onUninstall={() => handleUninstall(plugin.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PluginCardProps {
  plugin: PluginManifest;
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  viewMode: 'grid' | 'list';
}

function PluginCard({ plugin, isInstalled, onInstall, onUninstall, viewMode }: PluginCardProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {plugin.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{plugin.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{plugin.description}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-400">v{plugin.version}</span>
                <span className="text-xs text-gray-400">by {plugin.author}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              {plugin.categories.slice(0, 2).map(category => (
                <span key={category} className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                  {categoryIcons[category]}
                  <span>{category}</span>
                </span>
              ))}
            </div>
            
            <button
              onClick={isInstalled ? onUninstall : onInstall}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isInstalled
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isInstalled ? 'Uninstall' : 'Install'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          {plugin.name.charAt(0)}
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          v{plugin.version}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{plugin.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{plugin.description}</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {plugin.categories.map(category => (
          <span key={category} className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
            {categoryIcons[category]}
            <span>{category}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">by {plugin.author}</span>
        <button
          onClick={isInstalled ? onUninstall : onInstall}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isInstalled
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isInstalled ? 'Uninstall' : 'Install'}
        </button>
      </div>
    </div>
  );
}
