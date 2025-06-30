'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
  Info,
  Package,
  Puzzle,
  Layers,
  Terminal,
  Paintbrush,
  FileText,
  GitBranch,
  Database,
  Cloud,
  Lock,
  Cpu,
  Monitor
} from 'lucide-react'
import { pluginManager, Plugin, PluginCategory, BlockchainType } from '@/lib/plugins/plugin-manager'
import { cn } from '@/lib/utils'

interface PluginExtensionsProps {
  className?: string
}

export function PluginExtensions({ className }: PluginExtensionsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ExtensionCategory | 'all'>('all')
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>([])
  const [availableExtensions, setAvailableExtensions] = useState<Extension[]>([])
  const [activeTab, setActiveTab] = useState('marketplace')

  useEffect(() => {
    loadExtensions()
  }, [])

  const loadExtensions = async () => {
    const installed = await fetchInstalledExtensions()
    setInstalledExtensions(installed)
    
    const available = await fetchAvailableExtensions()
    setAvailableExtensions(available)
  }

  const filteredInstalledExtensions = installedExtensions.filter(extension => {
    const matchesSearch = extension.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         extension.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || extension.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const filteredAvailableExtensions = availableExtensions.filter(extension => {
    const isNotInstalled = !installedExtensions.some(installed => installed.id === extension.id)
    const matchesSearch = extension.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         extension.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || extension.category === selectedCategory
    
    return isNotInstalled && matchesSearch && matchesCategory
  })

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold">Extensions & Plugins</h2>
          <p className="text-muted-foreground">Enhance your development experience with powerful extensions</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Extension Settings
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ExtensionCategory | 'all')}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Categories</option>
            <option value="blockchain">Blockchain</option>
            <option value="editor">Editor</option>
            <option value="debugger">Debugger</option>
            <option value="formatter">Formatter</option>
            <option value="linter">Linter</option>
            <option value="theme">Theme</option>
            <option value="snippet">Snippets</option>
            <option value="git">Git</option>
            <option value="database">Database</option>
            <option value="cloud">Cloud</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="ui">UI/UX</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="installed">Installed ({installedExtensions.length})</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="h-full mt-4">
            <ScrollArea className="h-full px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {filteredAvailableExtensions.map((extension) => (
                  <ExtensionCard
                    key={extension.id}
                    extension={extension}
                    isInstalled={false}
                    onInstall={() => handleInstallExtension(extension.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="installed" className="h-full mt-4">
            <ScrollArea className="h-full px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {filteredInstalledExtensions.map((extension) => (
                  <InstalledExtensionCard
                    key={extension.id}
                    extension={extension}
                    onToggle={() => handleToggleExtension(extension.id)}
                    onUninstall={() => handleUninstallExtension(extension.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="featured" className="h-full mt-4">
            <ScrollArea className="h-full px-6">
              <FeaturedExtensions />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  async function handleInstallExtension(extensionId: string) {
    try {
      // Install extension logic
      console.log('Installing extension:', extensionId)
      await loadExtensions()
    } catch (error) {
      console.error('Failed to install extension:', error)
    }
  }

  async function handleToggleExtension(extensionId: string) {
    try {
      // Toggle extension logic
      console.log('Toggling extension:', extensionId)
      await loadExtensions()
    } catch (error) {
      console.error('Failed to toggle extension:', error)
    }
  }

  async function handleUninstallExtension(extensionId: string) {
    try {
      // Uninstall extension logic
      console.log('Uninstalling extension:', extensionId)
      await loadExtensions()
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
    }
  }
}

interface ExtensionCardProps {
  extension: Extension
  isInstalled: boolean
  onInstall: () => void
}

function ExtensionCard({ extension, isInstalled, onInstall }: ExtensionCardProps) {
  const getCategoryIcon = (category: ExtensionCategory) => {
    switch (category) {
      case 'blockchain': return <Layers className="w-4 h-4" />
      case 'editor': return <Code className="w-4 h-4" />
      case 'debugger': return <Bug className="w-4 h-4" />
      case 'formatter': return <Paintbrush className="w-4 h-4" />
      case 'linter': return <Shield className="w-4 h-4" />
      case 'theme': return <Palette className="w-4 h-4" />
      case 'snippet': return <FileText className="w-4 h-4" />
      case 'git': return <GitBranch className="w-4 h-4" />
      case 'database': return <Database className="w-4 h-4" />
      case 'cloud': return <Cloud className="w-4 h-4" />
      case 'security': return <Lock className="w-4 h-4" />
      case 'performance': return <Cpu className="w-4 h-4" />
      case 'ui': return <Monitor className="w-4 h-4" />
      default: return <Puzzle className="w-4 h-4" />
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{extension.icon}</div>
            <div>
              <CardTitle className="text-lg">{extension.name}</CardTitle>
              <CardDescription className="text-sm">v{extension.version}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">{extension.rating}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {extension.description}
        </p>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {getCategoryIcon(extension.category)}
            <span className="ml-1 capitalize">{extension.category}</span>
          </Badge>
          {extension.verified && (
            <Badge variant="default" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{extension.downloads} downloads</span>
          </div>
          <span>by {extension.author}</span>
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

interface InstalledExtensionCardProps {
  extension: Extension
  onToggle: () => void
  onUninstall: () => void
}

function InstalledExtensionCard({ extension, onToggle, onUninstall }: InstalledExtensionCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{extension.icon}</div>
            <div>
              <CardTitle className="text-lg">{extension.name}</CardTitle>
              <CardDescription className="text-sm">v{extension.version}</CardDescription>
            </div>
          </div>
          <Switch checked={extension.enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {extension.description}
        </p>
        
        <div className="flex items-center gap-2">
          <Badge variant={extension.enabled ? 'default' : 'secondary'} className="text-xs">
            {extension.enabled ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {extension.category}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          
          <Button onClick={onUninstall} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FeaturedExtensions() {
  const featuredExtensions = [
    {
      id: 'solidity-pro',
      name: 'Solidity Pro',
      description: 'Advanced Solidity development with IntelliSense, debugging, and gas optimization',
      icon: '⟠',
      category: 'blockchain' as ExtensionCategory,
      featured: true
    },
    {
      id: 'move-master',
      name: 'Move Master',
      description: 'Complete Move language support for Aptos and Sui development',
      icon: '🚀',
      category: 'blockchain' as ExtensionCategory,
      featured: true
    },
    {
      id: 'rust-analyzer-plus',
      name: 'Rust Analyzer Plus',
      description: 'Enhanced Rust support for Solana and NEAR development',
      icon: '🦀',
      category: 'blockchain' as ExtensionCategory,
      featured: true
    }
  ]

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Featured Extensions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredExtensions.map((extension) => (
            <Card key={extension.id} className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{extension.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{extension.name}</CardTitle>
                    <Badge variant="default" className="text-xs mt-1">Featured</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {extension.description}
                </p>
                <Button className="w-full" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Mock functions
async function fetchInstalledExtensions(): Promise<Extension[]> {
  return [
    {
      id: 'ethereum-tools',
      name: 'Ethereum Tools',
      version: '1.2.0',
      description: 'Complete Ethereum development toolkit',
      author: 'NovaGuard',
      category: 'blockchain',
      icon: '⟠',
      enabled: true,
      rating: 4.8,
      downloads: '15.2k',
      verified: true
    }
  ]
}

async function fetchAvailableExtensions(): Promise<Extension[]> {
  return [
    {
      id: 'solana-suite',
      name: 'Solana Suite',
      version: '2.1.0',
      description: 'Advanced Solana development with Anchor support',
      author: 'Solana Labs',
      category: 'blockchain',
      icon: '🟣',
      enabled: false,
      rating: 4.7,
      downloads: '12.8k',
      verified: true
    },
    {
      id: 'aptos-dev',
      name: 'Aptos Developer',
      version: '1.0.5',
      description: 'Move language support for Aptos blockchain',
      author: 'Aptos Foundation',
      category: 'blockchain',
      icon: '🅰️',
      enabled: false,
      rating: 4.6,
      downloads: '8.9k',
      verified: true
    }
  ]
}

// Types
type ExtensionCategory = 
  | 'blockchain'
  | 'editor'
  | 'debugger'
  | 'formatter'
  | 'linter'
  | 'theme'
  | 'snippet'
  | 'git'
  | 'database'
  | 'cloud'
  | 'security'
  | 'performance'
  | 'ui'

interface Extension {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: ExtensionCategory
  icon: string
  enabled: boolean
  rating: number
  downloads: string
  verified: boolean
  featured?: boolean
}

// Missing icon component
function Palette({ className }: { className?: string }) {
  return <Paintbrush className={className} />
}
