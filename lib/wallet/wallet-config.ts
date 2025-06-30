// =============================================
// NOVAGUARD WALLET CONFIGURATION
// Advanced Web3 wallet integration with Wagmi + RainbowKit
// =============================================

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, arbitrum, optimism, base, sepolia, polygonMumbai } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'

// Custom chain configurations
export const supportedChains = [
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  sepolia,
  polygonMumbai
] as const

// Wallet configuration
export const walletConfig = getDefaultConfig({
  appName: 'NovaGuard',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: supportedChains,
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL),
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
    [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [polygonMumbai.id]: http(process.env.NEXT_PUBLIC_POLYGON_MUMBAI_RPC_URL),
  },
  ssr: true
})

// RainbowKit theme configuration
export const rainbowKitTheme = {
  lightMode: {
    accentColor: '#3b82f6',
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
    overlayBlur: 'small'
  },
  darkMode: {
    accentColor: '#3b82f6',
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
    overlayBlur: 'small'
  }
} as const

// Wallet connection options
export const walletOptions = {
  autoConnect: true,
  shimDisconnect: true,
  reconnectOnMount: true
}

// Chain metadata
export const chainMetadata = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '⟠',
    color: '#627EEA',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: 'ETH',
    testnet: false
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '⬟',
    color: '#8247E5',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'MATIC',
    testnet: false
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    icon: '🔵',
    color: '#28A0F0',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: 'ETH',
    testnet: false
  },
  [optimism.id]: {
    name: 'Optimism',
    icon: '🔴',
    color: '#FF0420',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: 'ETH',
    testnet: false
  },
  [base.id]: {
    name: 'Base',
    icon: '🔷',
    color: '#0052FF',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: 'ETH',
    testnet: false
  },
  [sepolia.id]: {
    name: 'Sepolia',
    icon: '⟠',
    color: '#627EEA',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: 'ETH',
    testnet: true
  },
  [polygonMumbai.id]: {
    name: 'Mumbai',
    icon: '⬟',
    color: '#8247E5',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: 'MATIC',
    testnet: true
  }
} as const

// Wallet provider names
export const walletProviders = {
  METAMASK: 'MetaMask',
  WALLET_CONNECT: 'WalletConnect',
  COINBASE: 'Coinbase Wallet',
  RAINBOW: 'Rainbow',
  TRUST: 'Trust Wallet',
  LEDGER: 'Ledger',
  TREZOR: 'Trezor'
} as const

// Contract addresses for different chains
export const contractAddresses = {
  [mainnet.id]: {
    USDC: '0xA0b86a33E6441b8C4505E2c8c5B5e8b5e5e5e5e5',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  },
  [polygon.id]: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  },
  [arbitrum.id]: {
    USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  }
} as const

// Gas price configurations
export const gasPriceConfig = {
  [mainnet.id]: {
    slow: 20,
    standard: 25,
    fast: 30,
    instant: 40
  },
  [polygon.id]: {
    slow: 30,
    standard: 35,
    fast: 40,
    instant: 50
  },
  [arbitrum.id]: {
    slow: 0.1,
    standard: 0.2,
    fast: 0.3,
    instant: 0.5
  }
} as const

// Transaction confirmation requirements
export const confirmationRequirements = {
  [mainnet.id]: 2,
  [polygon.id]: 3,
  [arbitrum.id]: 1,
  [optimism.id]: 1,
  [base.id]: 1,
  [sepolia.id]: 1,
  [polygonMumbai.id]: 1
} as const

// Wallet security settings
export const securitySettings = {
  requireSignatureForTransactions: true,
  enableTransactionSimulation: true,
  showGasEstimates: true,
  warnOnHighGasFees: true,
  maxGasPrice: {
    [mainnet.id]: 100, // gwei
    [polygon.id]: 200, // gwei
    [arbitrum.id]: 5   // gwei
  }
} as const

// Utility functions
export const getChainMetadata = (chainId: number) => {
  return chainMetadata[chainId as keyof typeof chainMetadata]
}

export const isTestnet = (chainId: number): boolean => {
  const metadata = getChainMetadata(chainId)
  return metadata?.testnet || false
}

export const getExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string => {
  const metadata = getChainMetadata(chainId)
  if (!metadata) return ''
  
  return `${metadata.explorerUrl}/${type}/${hash}`
}

export const formatAddress = (address: string, length: number = 4): string => {
  if (!address) return ''
  return `${address.slice(0, 2 + length)}...${address.slice(-length)}`
}

export const getContractAddress = (chainId: number, token: string): string | undefined => {
  const addresses = contractAddresses[chainId as keyof typeof contractAddresses]
  return addresses?.[token as keyof typeof addresses]
}

// Wallet connection utilities
export const walletUtils = {
  // Check if wallet is connected
  isConnected: (address?: string): boolean => {
    return !!address && address !== '0x0000000000000000000000000000000000000000'
  },

  // Validate Ethereum address
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  // Format balance with proper decimals
  formatBalance: (balance: bigint, decimals: number = 18, precision: number = 4): string => {
    const divisor = BigInt(10 ** decimals)
    const quotient = balance / divisor
    const remainder = balance % divisor
    
    const remainderStr = remainder.toString().padStart(decimals, '0')
    const decimalPart = remainderStr.slice(0, precision).replace(/0+$/, '')
    
    return decimalPart ? `${quotient}.${decimalPart}` : quotient.toString()
  },

  // Parse amount to wei
  parseAmount: (amount: string, decimals: number = 18): bigint => {
    const [whole, decimal = ''] = amount.split('.')
    const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals)
    return BigInt(whole + paddedDecimal)
  },

  // Get gas price recommendation
  getGasPrice: (chainId: number, speed: 'slow' | 'standard' | 'fast' | 'instant' = 'standard'): number => {
    const config = gasPriceConfig[chainId as keyof typeof gasPriceConfig]
    return config?.[speed] || 25
  },

  // Check if gas price is too high
  isHighGasPrice: (chainId: number, gasPrice: number): boolean => {
    const maxPrice = securitySettings.maxGasPrice[chainId as keyof typeof securitySettings.maxGasPrice]
    return gasPrice > (maxPrice || 100)
  }
}

// Export default configuration
export default walletConfig
