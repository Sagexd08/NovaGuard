// main.ts - WalletConnect configuration for NovaGuard
import { createAppKit } from '@reown/appkit'
import { mainnet, arbitrum, polygon, avalanche } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// WalletConnect Project ID
const projectId = 'cc60126d352dc8388cdd05810fb003a3'

// Define custom Starknet network (if needed)
const starknet = {
  id: 'starknet',
  name: 'Starknet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_8/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
    },
    public: {
      http: ['https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_8/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
    },
  },
  blockExplorers: {
    default: { name: 'StarkScan', url: 'https://starkscan.co' },
  },
  testnet: false,
}

// Configure supported networks
export const networks = [
  {
    ...mainnet,
    rpcUrls: {
      default: {
        http: ['https://eth-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
      },
      public: {
        http: ['https://eth-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
      },
    },
  },
  {
    ...polygon,
    rpcUrls: {
      default: {
        http: ['https://polygon-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
      },
      public: {
        http: ['https://polygon-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
      },
    },
  },
  {
    ...arbitrum,
    rpcUrls: {
      default: {
        http: ['https://arb-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
      },
      public: {
        http: ['https://arb-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
      },
    },
  },
  {
    ...avalanche,
    rpcUrls: {
      default: {
        http: ['https://avax-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
      },
      public: {
        http: ['https://avax-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO'],
      },
    },
  },
]

// Set up Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

// Configure the metadata
const metadata = {
  name: 'NovaGuard',
  description: 'AI-Powered Smart Contract Security Auditing Platform',
  url: 'https://novaguard.vercel.app', // Update with your actual domain
  icons: ['https://novaguard.vercel.app/favicon.ico'] // Update with your actual icon
}

// Create the AppKit modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Enable analytics
    email: true, // Enable email login
    socials: ['google', 'github', 'apple'], // Enable social logins
    emailShowWallets: true, // Show wallet options in email flow
  },
  themeMode: 'dark', // Default theme mode
  themeVariables: {
    '--w3m-color-mix': '#3B82F6',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-border-radius-master': '8px',
  }
})

// Export the modal for programmatic control
export { modal, wagmiAdapter }

// Utility functions for wallet interaction
export const walletUtils = {
  // Open connect modal
  openConnectModal: () => modal.open(),
  
  // Open network modal
  openNetworkModal: () => modal.open({ view: 'Networks' }),
  
  // Open account modal
  openAccountModal: () => modal.open({ view: 'Account' }),
  
  // Close modal
  closeModal: () => modal.close(),
  
  // Get current connection state
  getState: () => modal.getState(),
  
  // Subscribe to state changes
  subscribeState: (callback: (state: any) => void) => modal.subscribeState(callback),
}

// Initialize wallet connection on page load
if (typeof window !== 'undefined') {
  // Auto-connect if previously connected
  const autoConnect = async () => {
    try {
      const state = modal.getState()
      if (state.selectedNetworkId) {
        console.log('Auto-connecting to previously selected network:', state.selectedNetworkId)
      }
    } catch (error) {
      console.warn('Auto-connect failed:', error)
    }
  }
  
  // Run auto-connect after a short delay
  setTimeout(autoConnect, 1000)
}

// Network configuration for different chains
export const networkConfig = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://avax-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }
  },
  solana: {
    chainId: 'solana:mainnet',
    name: 'Solana',
    rpcUrl: 'https://solana-mainnet.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 }
  },
  starknet: {
    chainId: 'starknet:mainnet',
    name: 'Starknet',
    rpcUrl: 'https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_8/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO',
    explorerUrl: 'https://starkscan.co',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  }
}

// Export for use in components
export default modal
