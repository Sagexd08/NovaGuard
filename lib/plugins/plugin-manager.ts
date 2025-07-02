/**
 * NovaGuard Plugin Manager - VS Code-like Extension System
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  contributes: {
    commands?: Command[];
    languages?: Language[];
    themes?: Theme[];
    snippets?: Snippet[];
    analyzers?: Analyzer[];
    chains?: ChainSupport[];
  };
  dependencies?: Record<string, string>;
  engines: {
    novaguard: string;
  };
  categories: PluginCategory[];
  keywords: string[];
  icon?: string;
  repository?: string;
  license: string;
}

export interface Command {
  command: string;
  title: string;
  category?: string;
  when?: string;
}

export interface Language {
  id: string;
  aliases: string[];
  extensions: string[];
  configuration?: string;
  grammar?: string;
}

export interface Theme {
  id: string;
  label: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
  path: string;
}

export interface Snippet {
  language: string;
  path: string;
}

export interface Analyzer {
  id: string;
  name: string;
  languages: string[];
  patterns: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ChainSupport {
  chainId: string | number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: string;
  type: 'evm' | 'starknet' | 'solana' | 'cosmos' | 'other';
}

export type PluginCategory = 
  | 'Security' 
  | 'Languages' 
  | 'Themes' 
  | 'Snippets' 
  | 'Debuggers' 
  | 'Formatters' 
  | 'Linters' 
  | 'Blockchain' 
  | 'AI' 
  | 'Collaboration' 
  | 'Testing' 
  | 'Deployment' 
  | 'Analytics';

export interface PluginContext {
  subscriptions: any[];
  workspaceState: any;
  globalState: any;
  extensionPath: string;
  storagePath: string;
  logPath: string;
}

export interface Plugin {
  manifest: PluginManifest;
  activate(context: PluginContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();
  private pluginContexts: Map<string, PluginContext> = new Map();

  constructor() {
    this.loadCorePlugins();
  }

  /**
   * Load core built-in plugins
   */
  private loadCorePlugins() {
    // Core security analyzer plugin
    this.registerPlugin({
      manifest: {
        id: 'novaguard.security-analyzer',
        name: 'Security Analyzer',
        version: '1.0.0',
        description: 'Core security analysis for smart contracts',
        author: 'NovaGuard Team',
        main: './security-analyzer.js',
        contributes: {
          analyzers: [
            {
              id: 'reentrancy-detector',
              name: 'Reentrancy Detector',
              languages: ['solidity'],
              patterns: ['call{value:', 'delegatecall', 'callcode'],
              severity: 'high'
            },
            {
              id: 'overflow-detector',
              name: 'Integer Overflow Detector',
              languages: ['solidity'],
              patterns: ['unchecked', '++', '--', '+', '-', '*'],
              severity: 'medium'
            }
          ]
        },
        engines: { novaguard: '^1.0.0' },
        categories: ['Security'],
        keywords: ['security', 'vulnerability', 'analysis'],
        license: 'MIT'
      },
      activate: async (context) => {
        console.log('Security Analyzer plugin activated');
      }
    });

    // Solidity language support
    this.registerPlugin({
      manifest: {
        id: 'novaguard.solidity',
        name: 'Solidity Language Support',
        version: '1.0.0',
        description: 'Solidity language support with syntax highlighting',
        author: 'NovaGuard Team',
        main: './solidity-support.js',
        contributes: {
          languages: [
            {
              id: 'solidity',
              aliases: ['Solidity', 'solidity'],
              extensions: ['.sol'],
              configuration: './language-configuration.json',
              grammar: './syntaxes/solidity.tmGrammar.json'
            }
          ],
          snippets: [
            {
              language: 'solidity',
              path: './snippets/solidity.json'
            }
          ]
        },
        engines: { novaguard: '^1.0.0' },
        categories: ['Languages'],
        keywords: ['solidity', 'ethereum', 'smart-contracts'],
        license: 'MIT'
      },
      activate: async (context) => {
        console.log('Solidity Language Support activated');
      }
    });

    // Cairo language support
    this.registerPlugin({
      manifest: {
        id: 'novaguard.cairo',
        name: 'Cairo Language Support',
        version: '1.0.0',
        description: 'Cairo language support for Starknet',
        author: 'NovaGuard Team',
        main: './cairo-support.js',
        contributes: {
          languages: [
            {
              id: 'cairo',
              aliases: ['Cairo', 'cairo'],
              extensions: ['.cairo'],
              configuration: './language-configuration.json',
              grammar: './syntaxes/cairo.tmGrammar.json'
            }
          ],
          chains: [
            {
              chainId: 'SN_MAIN',
              name: 'Starknet Mainnet',
              rpcUrl: 'https://alpha-mainnet.starknet.io',
              explorerUrl: 'https://starkscan.co',
              currency: 'ETH',
              type: 'starknet'
            }
          ]
        },
        engines: { novaguard: '^1.0.0' },
        categories: ['Languages', 'Blockchain'],
        keywords: ['cairo', 'starknet', 'zk-rollup'],
        license: 'MIT'
      },
      activate: async (context) => {
        console.log('Cairo Language Support activated');
      }
    });

    // Load additional blockchain plugins
    this.loadBlockchainPlugins();
  }

  /**
   * Load blockchain-specific plugins
   */
  private loadBlockchainPlugins() {
    // Avalanche plugin
    this.registerPlugin({
      manifest: {
        id: 'novaguard.avalanche',
        name: 'Avalanche Support',
        version: '1.0.0',
        description: 'Complete Avalanche ecosystem support including C-Chain and Subnets',
        author: 'NovaGuard Team',
        main: './avalanche-plugin.js',
        contributes: {
          chains: [
            {
              chainId: 43114,
              name: 'Avalanche C-Chain',
              rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
              explorerUrl: 'https://snowtrace.io',
              currency: 'AVAX',
              type: 'evm'
            }
          ]
        },
        engines: { novaguard: '^1.0.0' },
        categories: ['Blockchain'],
        keywords: ['avalanche', 'avax', 'subnet'],
        license: 'MIT'
      },
      activate: async (context) => {
        console.log('Avalanche Support activated');
      }
    });

    // Starknet plugin
    this.registerPlugin({
      manifest: {
        id: 'novaguard.starknet-advanced',
        name: 'Starknet Advanced',
        version: '1.0.0',
        description: 'Advanced Starknet support with Cairo analysis and ZK-STARK verification',
        author: 'NovaGuard Team',
        main: './starknet-plugin.js',
        contributes: {
          chains: [
            {
              chainId: 'SN_MAIN',
              name: 'Starknet Mainnet',
              rpcUrl: 'https://alpha-mainnet.starknet.io',
              explorerUrl: 'https://starkscan.co',
              currency: 'ETH',
              type: 'starknet'
            }
          ],
          analyzers: [
            {
              id: 'cairo-security',
              name: 'Cairo Security Analyzer',
              languages: ['cairo'],
              patterns: ['assert', 'felt', 'storage_var'],
              severity: 'high'
            }
          ]
        },
        engines: { novaguard: '^1.0.0' },
        categories: ['Blockchain', 'Security'],
        keywords: ['starknet', 'cairo', 'zk-stark'],
        license: 'MIT'
      },
      activate: async (context) => {
        console.log('Starknet Advanced activated');
      }
    });
  }

  /**
   * Register a new plugin
   */
  registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin ${plugin.manifest.id} is already registered`);
    }

    this.plugins.set(plugin.manifest.id, plugin);
    console.log(`Plugin registered: ${plugin.manifest.name} v${plugin.manifest.version}`);
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (this.activePlugins.has(pluginId)) {
      console.log(`Plugin ${pluginId} is already active`);
      return;
    }

    // Create plugin context
    const context: PluginContext = {
      subscriptions: [],
      workspaceState: new Map(),
      globalState: new Map(),
      extensionPath: `/plugins/${pluginId}`,
      storagePath: `/storage/${pluginId}`,
      logPath: `/logs/${pluginId}.log`
    };

    this.pluginContexts.set(pluginId, context);

    try {
      await plugin.activate(context);
      this.activePlugins.add(pluginId);
      console.log(`Plugin activated: ${plugin.manifest.name}`);
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!this.activePlugins.has(pluginId)) {
      console.log(`Plugin ${pluginId} is not active`);
      return;
    }

    try {
      if (plugin.deactivate) {
        await plugin.deactivate();
      }
      
      this.activePlugins.delete(pluginId);
      this.pluginContexts.delete(pluginId);
      console.log(`Plugin deactivated: ${plugin.manifest.name}`);
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(plugin => plugin.manifest);
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): PluginManifest[] {
    return Array.from(this.activePlugins)
      .map(id => this.plugins.get(id))
      .filter(plugin => plugin !== undefined)
      .map(plugin => plugin!.manifest);
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: PluginCategory): PluginManifest[] {
    return this.getPlugins().filter(plugin => 
      plugin.categories.includes(category)
    );
  }

  /**
   * Search plugins
   */
  searchPlugins(query: string): PluginManifest[] {
    const lowerQuery = query.toLowerCase();
    return this.getPlugins().filter(plugin => 
      plugin.name.toLowerCase().includes(lowerQuery) ||
      plugin.description.toLowerCase().includes(lowerQuery) ||
      plugin.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): PluginManifest | undefined {
    return this.plugins.get(pluginId)?.manifest;
  }

  /**
   * Check if plugin is active
   */
  isPluginActive(pluginId: string): boolean {
    return this.activePlugins.has(pluginId);
  }

  /**
   * Get all contributed analyzers
   */
  getAnalyzers(): Analyzer[] {
    const analyzers: Analyzer[] = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.manifest.contributes.analyzers) {
        analyzers.push(...plugin.manifest.contributes.analyzers);
      }
    }
    
    return analyzers;
  }

  /**
   * Get all supported languages
   */
  getLanguages(): Language[] {
    const languages: Language[] = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.manifest.contributes.languages) {
        languages.push(...plugin.manifest.contributes.languages);
      }
    }
    
    return languages;
  }

  /**
   * Get all supported chains
   */
  getChains(): ChainSupport[] {
    const chains: ChainSupport[] = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.manifest.contributes.chains) {
        chains.push(...plugin.manifest.contributes.chains);
      }
    }
    
    return chains;
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManager();
