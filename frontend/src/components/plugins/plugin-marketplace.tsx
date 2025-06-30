'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Download, 
  Star, 
  Users, 
  Shield, 
  Zap, 
  Code, 
  Wallet,
  Globe,
  Settings,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { pluginManager, Plugin, PluginCategory, BlockchainType } from '@/lib/plugins/plugin-manager'
import { cn } from '@/lib/utils'

interface PluginMarketplaceProps {
  className?: string
}

export function PluginMarketplace({ className }: PluginMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all')
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType | 'all'>('all')
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([])
  const [availablePlugins, setAvailablePlugins] = useState<PluginMetadata[]>([])
  const [activeTab, setActiveTab] = useState('marketplace')

  useEffect(() => {
    loadPlugins()
    
    // Listen for plugin events
    pluginManager.on('plugin:installed', handlePluginInstalled)
    pluginManager.on('plugin:uninstalled', handlePluginUninstalled)
    pluginManager.on('plugin:activated', handlePluginActivated)
    pluginManager.on('plugin:deactivated', handlePluginDeactivated)

    return () => {
      pluginManager.removeAllListeners()
    }
  }, [])

  const loadPlugins = async () => {
    const installed = pluginManager.getInstalledPlugins()
    setInstalledPlugins(installed)
    
    // Load available plugins from marketplace
    const available = await fetchAvailablePlugins()
    setAvailablePlugins(available)
  }

  const handlePluginInstalled = () => {
    loadPlugins()
  }

  const handlePluginUninstalled = () => {
    loadPlugins()
  }

  const handlePluginActivated = () => {
    loadPlugins()
  }

  const handlePluginDeactivated = () => {
    loadPlugins()
  }

  const filteredInstalledPlugins = installedPlugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    const matchesBlockchain = selectedBlockchain === 'all' || plugin.blockchain === selectedBlockchain
    
    return matchesSearch && matchesCategory && matchesBlockchain
  })

  const filteredAvailablePlugins = availablePlugins.filter(plugin => {
    const isNotInstalled = !installedPlugins.some(installed => installed.id === plugin.id)
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    const matchesBlockchain = selectedBlockchain === 'all' || plugin.blockchain === selectedBlockchain
    
    return isNotInstalled && matchesSearch && matchesCategory && matchesBlockchain
  })

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold">Plugin Marketplace</h2>
          <p className="text-muted-foreground">Extend NovaGuard with blockchain-specific tools</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as PluginCategory | 'all')}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Categories</option>
            <option value="compiler">Compilers</option>
            <option value="analyzer">Analyzers</option>
            <option value="deployer">Deployers</option>
            <option value="wallet">Wallets</option>
            <option value="explorer">Explorers</option>
            <option value="debugger">Debuggers</option>
            <option value="formatter">Formatters</option>
            <option value="linter">Linters</option>
            <option value="template">Templates</option>
            <option value="integration">Integrations</option>
          </select>

          <select
            value={selectedBlockchain}
            onChange={(e) => setSelectedBlockchain(e.target.value as BlockchainType | 'all')}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Blockchains</option>
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
            <option value="aptos">Aptos</option>
            <option value="sui">Sui</option>
            <option value="near">NEAR</option>
            <option value="cosmos">Cosmos</option>
            <option value="polkadot">Polkadot</option>
            <option value="cardano">Cardano</option>
            <option value="algorand">Algorand</option>
            <option value="tezos">Tezos</option>
            <option value="flow">Flow</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="installed">Installed ({installedPlugins.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="h-full mt-4">
            <ScrollArea className="h-full px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {filteredAvailablePlugins.map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    isInstalled={false}
                    onInstall={() => handleInstallPlugin(plugin.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="installed" className="h-full mt-4">
            <ScrollArea className="h-full px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {filteredInstalledPlugins.map((plugin) => (
                  <InstalledPluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onActivate={() => handleActivatePlugin(plugin.id)}
                    onDeactivate={() => handleDeactivatePlugin(plugin.id)}
                    onUninstall={() => handleUninstallPlugin(plugin.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  async function handleInstallPlugin(pluginId: string) {
    try {
      await pluginManager.installPlugin(pluginId)
    } catch (error) {
      console.error('Failed to install plugin:', error)
    }
  }

  async function handleActivatePlugin(pluginId: string) {
    try {
      await pluginManager.activatePlugin(pluginId)
    } catch (error) {
      console.error('Failed to activate plugin:', error)
    }
  }

  async function handleDeactivatePlugin(pluginId: string) {
    try {
      await pluginManager.deactivatePlugin(pluginId)
    } catch (error) {
      console.error('Failed to deactivate plugin:', error)
    }
  }

  async function handleUninstallPlugin(pluginId: string) {
    try {
      await pluginManager.uninstallPlugin(pluginId)
    } catch (error) {
      console.error('Failed to uninstall plugin:', error)
    }
  }
}

interface PluginCardProps {
  plugin: PluginMetadata
  isInstalled: boolean
  onInstall: () => void
}

function PluginCard({ plugin, isInstalled, onInstall }: PluginCardProps) {
  const getCategoryIcon = (category: PluginCategory) => {
    switch (category) {
      case 'compiler': return <Code className="w-4 h-4" />
      case 'analyzer': return <Shield className="w-4 h-4" />
      case 'deployer': return <Zap className="w-4 h-4" />
      case 'wallet': return <Wallet className="w-4 h-4" />
      case 'explorer': return <Globe className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getBlockchainColor = (blockchain: BlockchainType) => {
    switch (blockchain) {
      case 'ethereum': return 'bg-blue-500'
      case 'solana': return 'bg-purple-500'
      case 'aptos': return 'bg-green-500'
      case 'sui': return 'bg-cyan-500'
      case 'near': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{plugin.icon}</div>
            <div>
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              <CardDescription className="text-sm">v{plugin.version}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">{plugin.rating || '4.5'}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {plugin.description}
        </p>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {getCategoryIcon(plugin.category)}
            <span className="ml-1 capitalize">{plugin.category}</span>
          </Badge>
          <div className={cn('w-3 h-3 rounded-full', getBlockchainColor(plugin.blockchain))} />
          <span className="text-xs text-muted-foreground capitalize">{plugin.blockchain}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{plugin.downloads || '1.2k'} downloads</span>
          </div>
          <span>by {plugin.author}</span>
        </div>
        
        <Button 
          onClick={onInstall} 
          disabled={isInstalled}
          className="w-full"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          {isInstalled ? 'Installed' : 'Install'}
        </Button>
      </CardContent>
    </Card>
  )
}

interface InstalledPluginCardProps {
  plugin: Plugin
  onActivate: () => void
  onDeactivate: () => void
  onUninstall: () => void
}

function InstalledPluginCard({ plugin, onActivate, onDeactivate, onUninstall }: InstalledPluginCardProps) {
  const getStatusIcon = () => {
    if (plugin.enabled) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{plugin.icon}</div>
            <div>
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              <CardDescription className="text-sm">v{plugin.version}</CardDescription>
            </div>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {plugin.description}
        </p>
        
        <div className="flex items-center gap-2">
          <Badge variant={plugin.enabled ? 'default' : 'secondary'} className="text-xs">
            {plugin.enabled ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {plugin.blockchain}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {plugin.enabled ? (
            <Button onClick={onDeactivate} variant="outline" size="sm" className="flex-1">
              <Pause className="w-4 h-4 mr-2" />
              Deactivate
            </Button>
          ) : (
            <Button onClick={onActivate} size="sm" className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}
          
          <Button onClick={onUninstall} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Mock function to fetch available plugins
async function fetchAvailablePlugins(): Promise<PluginMetadata[]> {
  return [
    {
      id: 'ethereum-solidity',
      name: 'Ethereum Solidity',
      version: '1.0.0',
      description: 'Complete Solidity development environment with compiler, analyzer, and deployer',
      author: 'NovaGuard Team',
      category: 'compiler',
      blockchain: 'ethereum',
      icon: '⟠',
      rating: 4.8,
      downloads: 15420
    },
    {
      id: 'aptos-move',
      name: 'Aptos Move',
      version: '1.0.0',
      description: 'Move language support for Aptos blockchain development',
      author: 'NovaGuard Team',
      category: 'compiler',
      blockchain: 'aptos',
      icon: '🅰️',
      rating: 4.6,
      downloads: 8930
    },
    {
      id: 'solana-rust',
      name: 'Solana Rust',
      version: '1.0.0',
      description: 'Rust and Anchor framework support for Solana development',
      author: 'NovaGuard Team',
      category: 'compiler',
      blockchain: 'solana',
      icon: '🟣',
      rating: 4.7,
      downloads: 12340
    },
    {
      id: 'sui-move',
      name: 'Sui Move',
      version: '1.0.0',
      description: 'Move language support for Sui blockchain development',
      author: 'NovaGuard Team',
      category: 'compiler',
      blockchain: 'sui',
      icon: '🌊',
      rating: 4.5,
      downloads: 6780
    }
  ]
}

interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: PluginCategory
  blockchain: BlockchainType
  icon: string
  rating?: number
  downloads?: number
}
