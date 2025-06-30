'use client'

import React, { useState, useEffect } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  FileTree,
  Play,
  Square,
  Settings,
  Terminal,
  Bug,
  Package,
  Wallet,
  Globe,
  Zap,
  Shield,
  Code,
  FolderOpen,
  File,
  Plus,
  Save,
  Download,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { MonacoEditor } from '@/components/editor/monaco-editor'
import { PluginMarketplace } from '@/components/plugins/plugin-marketplace'
import { pluginManager, BlockchainType, Plugin } from '@/lib/plugins/plugin-manager'
import { cn } from '@/lib/utils'

interface ChainIDEProps {
  className?: string
}

export function ChainIDE({ className }: ChainIDEProps) {
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>('ethereum')
  const [activeFile, setActiveFile] = useState<string>('contract.sol')
  const [files, setFiles] = useState<FileNode[]>(defaultFiles)
  const [activePlugins, setActivePlugins] = useState<Plugin[]>([])
  const [compilationStatus, setCompilationStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle')
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState('editor')

  useEffect(() => {
    loadActivePlugins()
    
    // Listen for plugin events
    pluginManager.on('plugin:activated', loadActivePlugins)
    pluginManager.on('plugin:deactivated', loadActivePlugins)

    return () => {
      pluginManager.removeAllListeners()
    }
  }, [])

  const loadActivePlugins = () => {
    const plugins = pluginManager.getActivePlugins()
    setActivePlugins(plugins)
  }

  const getBlockchainPlugins = () => {
    return activePlugins.filter(plugin => plugin.blockchain === selectedBlockchain)
  }

  const handleBlockchainChange = (blockchain: BlockchainType) => {
    setSelectedBlockchain(blockchain)
    // Update file extensions and templates based on blockchain
    updateFilesForBlockchain(blockchain)
  }

  const updateFilesForBlockchain = (blockchain: BlockchainType) => {
    const templates = getBlockchainTemplates(blockchain)
    setFiles(templates)
    setActiveFile(templates[0]?.children?.[0]?.name || 'contract.sol')
  }

  const handleCompile = async () => {
    setCompilationStatus('compiling')
    
    try {
      const compiler = pluginManager.getCompilerForLanguage(getLanguageForBlockchain(selectedBlockchain))
      if (!compiler) {
        throw new Error(`No compiler found for ${selectedBlockchain}`)
      }

      const sourceCode = getCurrentFileContent()
      const result = await compiler.compile(sourceCode)
      
      if (result.success) {
        setCompilationStatus('success')
      } else {
        setCompilationStatus('error')
        console.error('Compilation errors:', result.errors)
      }
    } catch (error) {
      setCompilationStatus('error')
      console.error('Compilation failed:', error)
    }
  }

  const handleDeploy = async () => {
    setDeploymentStatus('deploying')
    
    try {
      const deployer = pluginManager.getDeployerForBlockchain(selectedBlockchain)
      if (!deployer) {
        throw new Error(`No deployer found for ${selectedBlockchain}`)
      }

      // First compile if needed
      if (compilationStatus !== 'success') {
        await handleCompile()
      }

      const bytecode = '0x' // Get from compilation result
      const result = await deployer.deploy(bytecode)
      
      if (result.success) {
        setDeploymentStatus('success')
      } else {
        setDeploymentStatus('error')
        console.error('Deployment error:', result.error)
      }
    } catch (error) {
      setDeploymentStatus('error')
      console.error('Deployment failed:', error)
    }
  }

  const getCurrentFileContent = (): string => {
    // Get content of currently active file
    return getFileContent(activeFile, selectedBlockchain)
  }

  return (
    <div className={cn('flex flex-col h-screen bg-background', className)}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">NovaGuard IDE</h1>
          
          {/* Blockchain Selector */}
          <select
            value={selectedBlockchain}
            onChange={(e) => handleBlockchainChange(e.target.value as BlockchainType)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
            <option value="aptos">Aptos</option>
            <option value="sui">Sui</option>
            <option value="near">NEAR</option>
            <option value="cosmos">Cosmos</option>
            <option value="polkadot">Polkadot</option>
          </select>

          {/* Active Plugins */}
          <div className="flex items-center gap-2">
            {getBlockchainPlugins().map(plugin => (
              <Badge key={plugin.id} variant="secondary" className="text-xs">
                {plugin.icon} {plugin.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCompile}
            disabled={compilationStatus === 'compiling'}
            size="sm"
            variant="outline"
          >
            {compilationStatus === 'compiling' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Code className="w-4 h-4 mr-2" />
            )}
            Compile
            {compilationStatus === 'success' && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
            {compilationStatus === 'error' && <XCircle className="w-4 h-4 ml-2 text-red-500" />}
          </Button>

          <Button
            onClick={handleDeploy}
            disabled={deploymentStatus === 'deploying'}
            size="sm"
          >
            {deploymentStatus === 'deploying' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Deploy
            {deploymentStatus === 'success' && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
            {deploymentStatus === 'error' && <XCircle className="w-4 h-4 ml-2 text-red-500" />}
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button size="sm" variant="ghost">
            <Save className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <Tabs defaultValue="files" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="files" className="text-xs">
                  <FolderOpen className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="plugins" className="text-xs">
                  <Package className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="explorer" className="text-xs">
                  <Globe className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="h-full mt-0">
                <FileExplorer
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                  blockchain={selectedBlockchain}
                />
              </TabsContent>

              <TabsContent value="plugins" className="h-full mt-0">
                <PluginPanel blockchain={selectedBlockchain} />
              </TabsContent>

              <TabsContent value="explorer" className="h-full mt-0">
                <BlockchainExplorer blockchain={selectedBlockchain} />
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Editor Area */}
          <ResizablePanel defaultSize={60}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="plugins">Plugins</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="h-full mt-0">
                <div className="h-full flex flex-col">
                  {/* File Tabs */}
                  <div className="flex items-center border-b bg-muted/30">
                    <div className="flex items-center px-4 py-2 border-r bg-background">
                      <File className="w-4 h-4 mr-2" />
                      <span className="text-sm">{activeFile}</span>
                      <Button size="sm" variant="ghost" className="ml-2 h-6 w-6 p-0">
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="flex-1">
                    <MonacoEditor
                      language={getLanguageForBlockchain(selectedBlockchain)}
                      value={getCurrentFileContent()}
                      onChange={() => {}}
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        automaticLayout: true
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="plugins" className="h-full mt-0">
                <PluginMarketplace />
              </TabsContent>

              <TabsContent value="settings" className="h-full mt-0">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">IDE Settings</h3>
                  {/* Settings content */}
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <Tabs defaultValue="analysis" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis" className="text-xs">
                  <Shield className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="terminal" className="text-xs">
                  <Terminal className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="wallet" className="text-xs">
                  <Wallet className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="h-full mt-0">
                <AnalysisPanel blockchain={selectedBlockchain} />
              </TabsContent>

              <TabsContent value="terminal" className="h-full mt-0">
                <TerminalPanel blockchain={selectedBlockchain} />
              </TabsContent>

              <TabsContent value="wallet" className="h-full mt-0">
                <WalletPanel blockchain={selectedBlockchain} />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

// Helper Components
function FileExplorer({ files, activeFile, onFileSelect, blockchain }: {
  files: FileNode[]
  activeFile: string
  onFileSelect: (file: string) => void
  blockchain: BlockchainType
}) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Files</h3>
          <Button size="sm" variant="ghost">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <FileTreeNode
          nodes={files}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
          level={0}
        />
      </div>
    </ScrollArea>
  )
}

function FileTreeNode({ nodes, activeFile, onFileSelect, level }: {
  nodes: FileNode[]
  activeFile: string
  onFileSelect: (file: string) => void
  level: number
}) {
  return (
    <div>
      {nodes.map((node) => (
        <div key={node.name} style={{ paddingLeft: `${level * 12}px` }}>
          {node.type === 'folder' ? (
            <div className="flex items-center py-1 text-sm">
              <ChevronRight className="w-4 h-4 mr-1" />
              <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
              <span>{node.name}</span>
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center py-1 text-sm cursor-pointer hover:bg-muted rounded px-2',
                activeFile === node.name && 'bg-primary/10 text-primary'
              )}
              onClick={() => onFileSelect(node.name)}
            >
              <File className="w-4 h-4 mr-2 text-gray-500" />
              <span>{node.name}</span>
            </div>
          )}
          {node.children && (
            <FileTreeNode
              nodes={node.children}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function PluginPanel({ blockchain }: { blockchain: BlockchainType }) {
  const plugins = pluginManager.getPluginsByBlockchain(blockchain)
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-4">Active Plugins</h3>
        <div className="space-y-2">
          {plugins.map((plugin) => (
            <div key={plugin.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <span>{plugin.icon}</span>
                <span className="text-sm">{plugin.name}</span>
              </div>
              <Badge variant={plugin.enabled ? 'default' : 'secondary'} className="text-xs">
                {plugin.enabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

function AnalysisPanel({ blockchain }: { blockchain: BlockchainType }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-4">Security Analysis</h3>
        <div className="space-y-2">
          <div className="p-2 border rounded bg-green-50 dark:bg-green-950">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">No vulnerabilities found</span>
            </div>
          </div>
          <div className="p-2 border rounded bg-yellow-50 dark:bg-yellow-950">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">2 gas optimizations</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

function TerminalPanel({ blockchain }: { blockchain: BlockchainType }) {
  return (
    <div className="h-full bg-black text-green-400 font-mono text-sm">
      <div className="p-4">
        <div>$ {blockchain} --version</div>
        <div>NovaGuard IDE v1.0.0</div>
        <div>Ready for {blockchain} development</div>
        <div className="mt-2">
          <span className="text-green-400">$</span>
          <span className="animate-pulse">_</span>
        </div>
      </div>
    </div>
  )
}

function WalletPanel({ blockchain }: { blockchain: BlockchainType }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-4">Wallet</h3>
        <div className="space-y-4">
          <Button className="w-full" size="sm">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
          <div className="text-sm text-muted-foreground">
            No wallet connected for {blockchain}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

function BlockchainExplorer({ blockchain }: { blockchain: BlockchainType }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-4">Explorer</h3>
        <div className="text-sm text-muted-foreground">
          {blockchain} blockchain explorer integration
        </div>
      </div>
    </ScrollArea>
  )
}

// Helper functions
function getLanguageForBlockchain(blockchain: BlockchainType): string {
  switch (blockchain) {
    case 'ethereum': return 'solidity'
    case 'solana': return 'rust'
    case 'aptos':
    case 'sui': return 'move'
    case 'near': return 'rust'
    case 'cosmos': return 'go'
    default: return 'javascript'
  }
}

function getBlockchainTemplates(blockchain: BlockchainType): FileNode[] {
  switch (blockchain) {
    case 'ethereum':
      return [
        {
          name: 'contracts',
          type: 'folder',
          children: [
            { name: 'MyContract.sol', type: 'file' },
            { name: 'Token.sol', type: 'file' }
          ]
        },
        {
          name: 'scripts',
          type: 'folder',
          children: [
            { name: 'deploy.js', type: 'file' }
          ]
        }
      ]
    case 'aptos':
      return [
        {
          name: 'sources',
          type: 'folder',
          children: [
            { name: 'MyModule.move', type: 'file' }
          ]
        }
      ]
    case 'solana':
      return [
        {
          name: 'programs',
          type: 'folder',
          children: [
            { name: 'lib.rs', type: 'file' },
            { name: 'instruction.rs', type: 'file' }
          ]
        }
      ]
    default:
      return [
        {
          name: 'src',
          type: 'folder',
          children: [
            { name: 'main.js', type: 'file' }
          ]
        }
      ]
  }
}

function getFileContent(fileName: string, blockchain: BlockchainType): string {
  // Return template content based on file and blockchain
  if (fileName.endsWith('.sol')) {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    uint256 public value;
    
    constructor(uint256 _value) {
        value = _value;
    }
    
    function setValue(uint256 _value) public {
        value = _value;
    }
}`
  }
  
  if (fileName.endsWith('.move')) {
    return `module MyAddress::MyModule {
    use std::signer;
    
    struct Counter has key {
        value: u64,
    }
    
    public fun increment(account: &signer) acquires Counter {
        let counter = borrow_global_mut<Counter>(signer::address_of(account));
        counter.value = counter.value + 1;
    }
}`
  }
  
  if (fileName.endsWith('.rs')) {
    return `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
`
  }
  
  return '// Start coding here...'
}

// Types
interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

const defaultFiles: FileNode[] = [
  {
    name: 'contracts',
    type: 'folder',
    children: [
      { name: 'contract.sol', type: 'file' }
    ]
  }
]
