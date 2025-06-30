'use client'

// =============================================
// NOVAGUARD WALLET PROVIDER
// Comprehensive Web3 wallet integration
// =============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useUser } from '@clerk/nextjs'
import { useAccount, useBalance, useChainId, useDisconnect, useSwitchChain } from 'wagmi'
import { walletConfig, chainMetadata, walletUtils } from '@/lib/wallet/wallet-config'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
    },
  },
})

interface WalletContextType {
  // Connection state
  isConnected: boolean
  address: string | undefined
  chainId: number | undefined
  balance: string | undefined
  
  // Chain management
  currentChain: any
  switchChain: (chainId: number) => Promise<void>
  
  // Wallet operations
  disconnect: () => void
  
  // User integration
  linkWalletToUser: () => Promise<void>
  unlinkWalletFromUser: () => Promise<void>
  isWalletLinked: boolean
  
  // Transaction helpers
  estimateGas: (to: string, data?: string, value?: bigint) => Promise<bigint>
  sendTransaction: (params: any) => Promise<string>
  
  // Utilities
  formatAddress: (address: string) => string
  formatBalance: (balance: bigint, decimals?: number) => string
  getExplorerUrl: (hash: string, type?: 'tx' | 'address') => string
}

const WalletContext = createContext<WalletContextType | null>(null)

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: React.ReactNode
}

function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  
  // Balance query
  const { data: balanceData } = useBalance({
    address: address,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  })
  
  // State
  const [isWalletLinked, setIsWalletLinked] = useState(false)
  const [isLinking, setIsLinking] = useState(false)

  // Get current chain metadata
  const currentChain = chainId ? chainMetadata[chainId] : null

  // Check if wallet is linked to user
  useEffect(() => {
    if (user && address) {
      checkWalletLink()
    } else {
      setIsWalletLinked(false)
    }
  }, [user, address])

  const checkWalletLink = async () => {
    if (!user || !address) return

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('wallet_address', address.toLowerCase())
        .single()

      setIsWalletLinked(!!data && !error)
    } catch (error) {
      console.error('Error checking wallet link:', error)
      setIsWalletLinked(false)
    }
  }

  // Link wallet to user account
  const linkWalletToUser = useCallback(async () => {
    if (!user || !address || isLinking) {
      toast.error('Unable to link wallet')
      return
    }

    setIsLinking(true)
    try {
      // Check if wallet is already linked to another user
      const { data: existingLink } = await supabase
        .from('user_wallets')
        .select('user_id')
        .eq('wallet_address', address.toLowerCase())
        .single()

      if (existingLink && existingLink.user_id !== user.id) {
        throw new Error('Wallet is already linked to another account')
      }

      // Link wallet to current user
      const { error } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: user.id,
          wallet_address: address.toLowerCase(),
          chain_id: chainId,
          wallet_type: 'external', // Could be enhanced to detect wallet type
          is_primary: false,
          linked_at: new Date().toISOString()
        })

      if (error) throw error

      setIsWalletLinked(true)
      toast.success('Wallet linked successfully')

      // Update user metadata in Clerk
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          hasLinkedWallet: true,
          primaryWallet: address.toLowerCase()
        }
      })

    } catch (error) {
      console.error('Error linking wallet:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to link wallet')
    } finally {
      setIsLinking(false)
    }
  }, [user, address, chainId, isLinking])

  // Unlink wallet from user account
  const unlinkWalletFromUser = useCallback(async () => {
    if (!user || !address) {
      toast.error('Unable to unlink wallet')
      return
    }

    try {
      const { error } = await supabase
        .from('user_wallets')
        .delete()
        .eq('user_id', user.id)
        .eq('wallet_address', address.toLowerCase())

      if (error) throw error

      setIsWalletLinked(false)
      toast.success('Wallet unlinked successfully')

      // Update user metadata in Clerk
      const { data: remainingWallets } = await supabase
        .from('user_wallets')
        .select('wallet_address')
        .eq('user_id', user.id)

      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          hasLinkedWallet: remainingWallets && remainingWallets.length > 0,
          primaryWallet: remainingWallets?.[0]?.wallet_address || null
        }
      })

    } catch (error) {
      console.error('Error unlinking wallet:', error)
      toast.error('Failed to unlink wallet')
    }
  }, [user, address])

  // Switch chain with error handling
  const handleSwitchChain = useCallback(async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId })
      toast.success(`Switched to ${chainMetadata[targetChainId]?.name}`)
    } catch (error) {
      console.error('Error switching chain:', error)
      toast.error('Failed to switch network')
    }
  }, [switchChain])

  // Estimate gas for transaction
  const estimateGas = useCallback(async (to: string, data?: string, value?: bigint): Promise<bigint> => {
    // This would need to be implemented with wagmi's gas estimation
    // For now, return a default estimate
    return BigInt(21000)
  }, [])

  // Send transaction
  const sendTransaction = useCallback(async (params: any): Promise<string> => {
    // This would need to be implemented with wagmi's transaction sending
    // For now, throw an error
    throw new Error('Transaction sending not implemented')
  }, [])

  // Utility functions
  const formatAddress = useCallback((addr: string) => {
    return walletUtils.formatAddress(addr)
  }, [])

  const formatBalance = useCallback((balance: bigint, decimals: number = 18) => {
    return walletUtils.formatBalance(balance, decimals)
  }, [])

  const getExplorerUrl = useCallback((hash: string, type: 'tx' | 'address' = 'tx') => {
    if (!chainId) return ''
    const metadata = chainMetadata[chainId]
    return metadata ? `${metadata.explorerUrl}/${type}/${hash}` : ''
  }, [chainId])

  // Auto-link wallet when connected
  useEffect(() => {
    if (isConnected && address && user && !isWalletLinked && !isLinking) {
      // Auto-link after a short delay to avoid rapid state changes
      const timer = setTimeout(() => {
        linkWalletToUser()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isConnected, address, user, isWalletLinked, isLinking, linkWalletToUser])

  const contextValue: WalletContextType = {
    // Connection state
    isConnected,
    address,
    chainId,
    balance: balanceData ? formatBalance(balanceData.value, balanceData.decimals) : undefined,
    
    // Chain management
    currentChain,
    switchChain: handleSwitchChain,
    
    // Wallet operations
    disconnect,
    
    // User integration
    linkWalletToUser,
    unlinkWalletFromUser,
    isWalletLinked,
    
    // Transaction helpers
    estimateGas,
    sendTransaction,
    
    // Utilities
    formatAddress,
    formatBalance,
    getExplorerUrl
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { theme } = useTheme()

  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={theme === 'dark' ? darkTheme() : lightTheme()}
          showRecentTransactions={true}
          coolMode={true}
        >
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default WalletProvider
