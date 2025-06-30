import { EventEmitter } from 'events'

// Plugin system types
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: PluginCategory
  blockchain: BlockchainType
  icon: string
  enabled: boolean
  dependencies?: string[]
  permissions: PluginPermission[]
  config?: Record<string, any>
  
  // Plugin lifecycle methods
  activate(): Promise<void>
  deactivate(): Promise<void>
  install(): Promise<void>
  uninstall(): Promise<void>
  
  // Plugin capabilities
  getCompiler?(): CompilerPlugin
  getAnalyzer?(): AnalyzerPlugin
  getDeployer?(): DeployerPlugin
  getWallet?(): WalletPlugin
  getExplorer?(): ExplorerPlugin
}

export type PluginCategory = 
  | 'compiler'
  | 'analyzer' 
  | 'deployer'
  | 'wallet'
  | 'explorer'
  | 'debugger'
  | 'formatter'
  | 'linter'
  | 'template'
  | 'integration'

export type BlockchainType = 
  | 'ethereum'
  | 'solana'
  | 'aptos'
  | 'sui'
  | 'near'
  | 'cosmos'
  | 'polkadot'
  | 'cardano'
  | 'algorand'
  | 'tezos'
  | 'flow'
  | 'avalanche'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'linea'
  | 'scroll'
  | 'zksync'

export type PluginPermission = 
  | 'filesystem'
  | 'network'
  | 'wallet'
  | 'compiler'
  | 'debugger'
  | 'storage'

export interface CompilerPlugin {
  compile(source: string, options?: any): Promise<CompilationResult>
  getSupportedLanguages(): string[]
  getCompilerVersion(): string
}

export interface AnalyzerPlugin {
  analyze(source: string, options?: any): Promise<AnalysisResult>
  getSupportedPatterns(): string[]
  getAnalyzerVersion(): string
}

export interface DeployerPlugin {
  deploy(bytecode: string, options?: any): Promise<DeploymentResult>
  estimateGas(bytecode: string): Promise<number>
  getSupportedNetworks(): string[]
}

export interface WalletPlugin {
  connect(): Promise<WalletConnection>
  disconnect(): Promise<void>
  getAccounts(): Promise<string[]>
  signTransaction(tx: any): Promise<string>
  getSupportedWallets(): string[]
}

export interface ExplorerPlugin {
  getTransactionDetails(hash: string): Promise<any>
  getAccountDetails(address: string): Promise<any>
  getBlockDetails(block: string | number): Promise<any>
  getExplorerUrl(): string
}

export interface CompilationResult {
  success: boolean
  bytecode?: string
  abi?: any
  errors?: string[]
  warnings?: string[]
  metadata?: any
}

export interface AnalysisResult {
  vulnerabilities: Vulnerability[]
  gasOptimizations: GasOptimization[]
  codeQuality: CodeQualityIssue[]
  score: number
}

export interface DeploymentResult {
  success: boolean
  transactionHash?: string
  contractAddress?: string
  gasUsed?: number
  error?: string
}

export interface WalletConnection {
  address: string
  balance: string
  network: string
  provider: any
}

export interface Vulnerability {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  line?: number
  recommendation: string
}

export interface GasOptimization {
  id: string
  type: string
  title: string
  description: string
  estimatedSavings: number
  line?: number
}

export interface CodeQualityIssue {
  id: string
  type: string
  severity: 'error' | 'warning' | 'info'
  message: string
  line?: number
}

// Plugin Manager class
export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map()
  private activePlugins: Set<string> = new Set()
  private pluginRegistry: Map<string, PluginMetadata> = new Map()

  constructor() {
    super()
    this.initializeBuiltinPlugins()
  }

  // Plugin lifecycle management
  async installPlugin(pluginId: string): Promise<void> {
    const metadata = this.pluginRegistry.get(pluginId)
    if (!metadata) {
      throw new Error(`Plugin ${pluginId} not found in registry`)
    }

    try {
      // Download and load plugin
      const plugin = await this.loadPlugin(metadata)
      
      // Check dependencies
      await this.checkDependencies(plugin)
      
      // Install plugin
      await plugin.install()
      
      this.plugins.set(pluginId, plugin)
      this.emit('plugin:installed', { pluginId, plugin })
      
    } catch (error) {
      this.emit('plugin:install-error', { pluginId, error })
      throw error
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not installed`)
    }

    try {
      // Deactivate if active
      if (this.activePlugins.has(pluginId)) {
        await this.deactivatePlugin(pluginId)
      }
      
      // Uninstall plugin
      await plugin.uninstall()
      
      this.plugins.delete(pluginId)
      this.emit('plugin:uninstalled', { pluginId })
      
    } catch (error) {
      this.emit('plugin:uninstall-error', { pluginId, error })
      throw error
    }
  }

  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not installed`)
    }

    if (this.activePlugins.has(pluginId)) {
      return // Already active
    }

    try {
      await plugin.activate()
      this.activePlugins.add(pluginId)
      plugin.enabled = true
      this.emit('plugin:activated', { pluginId, plugin })
      
    } catch (error) {
      this.emit('plugin:activation-error', { pluginId, error })
      throw error
    }
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not installed`)
    }

    if (!this.activePlugins.has(pluginId)) {
      return // Already inactive
    }

    try {
      await plugin.deactivate()
      this.activePlugins.delete(pluginId)
      plugin.enabled = false
      this.emit('plugin:deactivated', { pluginId, plugin })
      
    } catch (error) {
      this.emit('plugin:deactivation-error', { pluginId, error })
      throw error
    }
  }

  // Plugin discovery and management
  getInstalledPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => this.activePlugins.has(p.id))
  }

  getPluginsByCategory(category: PluginCategory): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.category === category)
  }

  getPluginsByBlockchain(blockchain: BlockchainType): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.blockchain === blockchain)
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  // Plugin capabilities
  getCompilerForLanguage(language: string): CompilerPlugin | undefined {
    const compilerPlugins = this.getPluginsByCategory('compiler')
    for (const plugin of compilerPlugins) {
      const compiler = plugin.getCompiler?.()
      if (compiler?.getSupportedLanguages().includes(language)) {
        return compiler
      }
    }
    return undefined
  }

  getAnalyzerForBlockchain(blockchain: BlockchainType): AnalyzerPlugin | undefined {
    const analyzerPlugins = this.getPluginsByBlockchain(blockchain).filter(p => p.category === 'analyzer')
    return analyzerPlugins[0]?.getAnalyzer?.()
  }

  getDeployerForBlockchain(blockchain: BlockchainType): DeployerPlugin | undefined {
    const deployerPlugins = this.getPluginsByBlockchain(blockchain).filter(p => p.category === 'deployer')
    return deployerPlugins[0]?.getDeployer?.()
  }

  getWalletForBlockchain(blockchain: BlockchainType): WalletPlugin | undefined {
    const walletPlugins = this.getPluginsByBlockchain(blockchain).filter(p => p.category === 'wallet')
    return walletPlugins[0]?.getWallet?.()
  }

  // Private methods
  private async loadPlugin(metadata: PluginMetadata): Promise<Plugin> {
    // In a real implementation, this would download and dynamically load the plugin
    // For now, we'll use a factory pattern
    return this.createPluginFromMetadata(metadata)
  }

  private async checkDependencies(plugin: Plugin): Promise<void> {
    if (!plugin.dependencies) return

    for (const depId of plugin.dependencies) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Missing dependency: ${depId}`)
      }
    }
  }

  private createPluginFromMetadata(metadata: PluginMetadata): Plugin {
    // Factory method to create plugins based on metadata
    // This would be replaced with dynamic loading in production
    throw new Error('Plugin loading not implemented')
  }

  private initializeBuiltinPlugins(): void {
    // Initialize built-in plugins for major blockchains
    this.registerBuiltinPlugins()
  }

  private registerBuiltinPlugins(): void {
    // Register built-in plugin metadata
    const builtinPlugins: PluginMetadata[] = [
      {
        id: 'ethereum-solidity',
        name: 'Ethereum Solidity',
        version: '1.0.0',
        description: 'Solidity compiler and tools for Ethereum',
        blockchain: 'ethereum',
        category: 'compiler',
        url: 'builtin://ethereum-solidity'
      },
      {
        id: 'aptos-move',
        name: 'Aptos Move',
        version: '1.0.0',
        description: 'Move compiler and tools for Aptos',
        blockchain: 'aptos',
        category: 'compiler',
        url: 'builtin://aptos-move'
      },
      {
        id: 'solana-rust',
        name: 'Solana Rust',
        version: '1.0.0',
        description: 'Rust compiler and tools for Solana',
        blockchain: 'solana',
        category: 'compiler',
        url: 'builtin://solana-rust'
      },
      {
        id: 'sui-move',
        name: 'Sui Move',
        version: '1.0.0',
        description: 'Move compiler and tools for Sui',
        blockchain: 'sui',
        category: 'compiler',
        url: 'builtin://sui-move'
      },
      {
        id: 'near-rust',
        name: 'NEAR Rust',
        version: '1.0.0',
        description: 'Rust compiler and tools for NEAR Protocol',
        blockchain: 'near',
        category: 'compiler',
        url: 'builtin://near-rust'
      },
      {
        id: 'cosmos-go',
        name: 'Cosmos SDK',
        version: '1.0.0',
        description: 'Go SDK for Cosmos blockchain development',
        blockchain: 'cosmos',
        category: 'compiler',
        url: 'builtin://cosmos-go'
      },
      {
        id: 'polkadot-rust',
        name: 'Polkadot Substrate',
        version: '1.0.0',
        description: 'Rust framework for Polkadot and Substrate',
        blockchain: 'polkadot',
        category: 'compiler',
        url: 'builtin://polkadot-rust'
      },
      {
        id: 'cardano-plutus',
        name: 'Cardano Plutus',
        version: '1.0.0',
        description: 'Plutus smart contract platform for Cardano',
        blockchain: 'cardano',
        category: 'compiler',
        url: 'builtin://cardano-plutus'
      },
      {
        id: 'algorand-teal',
        name: 'Algorand TEAL',
        version: '1.0.0',
        description: 'TEAL smart contract language for Algorand',
        blockchain: 'algorand',
        category: 'compiler',
        url: 'builtin://algorand-teal'
      },
      {
        id: 'tezos-michelson',
        name: 'Tezos Michelson',
        version: '1.0.0',
        description: 'Michelson smart contract language for Tezos',
        blockchain: 'tezos',
        category: 'compiler',
        url: 'builtin://tezos-michelson'
      },
      {
        id: 'flow-cadence',
        name: 'Flow Cadence',
        version: '1.0.0',
        description: 'Cadence smart contract language for Flow',
        blockchain: 'flow',
        category: 'compiler',
        url: 'builtin://flow-cadence'
      }
    ]

    builtinPlugins.forEach(plugin => {
      this.pluginRegistry.set(plugin.id, plugin)
    })
  }
}

export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  blockchain: BlockchainType
  category: PluginCategory
  url: string
  author?: string
  icon?: string
  dependencies?: string[]
  permissions?: PluginPermission[]
}

// Global plugin manager instance
export const pluginManager = new PluginManager()
