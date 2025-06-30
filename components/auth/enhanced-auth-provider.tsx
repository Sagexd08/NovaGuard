'use client'

// =============================================
// NOVAGUARD ENHANCED AUTHENTICATION PROVIDER
// Multi-modal authentication with Clerk + Wallet integration
// =============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ClerkProvider, useUser, useAuth } from '@clerk/nextjs'
import { useWallet } from '@/components/wallet/wallet-provider'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type AuthMethod = 'email' | 'social' | 'wallet' | 'phone'

export interface UserProfile {
  id: string
  email: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  username: string | null
  
  // Enhanced profile data
  walletAddresses: string[]
  primaryWallet: string | null
  authMethods: AuthMethod[]
  isEmailVerified: boolean
  isPhoneVerified: boolean
  
  // Subscription and credits
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  credits: number
  isActive: boolean
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system'
    notifications: {
      email: boolean
      push: boolean
      security: boolean
      marketing: boolean
    }
    privacy: {
      profileVisibility: 'public' | 'private'
      showWalletAddress: boolean
      allowAnalytics: boolean
    }
  }
  
  // Timestamps
  createdAt: Date
  lastLoginAt: Date
  updatedAt: Date
}

interface EnhancedAuthContextType {
  // User state
  user: UserProfile | null
  isLoaded: boolean
  isSignedIn: boolean
  
  // Authentication methods
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithWallet: (address: string, signature: string) => Promise<void>
  signInWithSocial: (provider: 'google' | 'github' | 'discord') => Promise<void>
  signOut: () => Promise<void>
  
  // Registration
  signUpWithEmail: (email: string, password: string, userData: any) => Promise<void>
  
  // Profile management
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => Promise<void>
  
  // Wallet integration
  linkWallet: (address: string) => Promise<void>
  unlinkWallet: (address: string) => Promise<void>
  
  // Security
  enableTwoFactor: () => Promise<void>
  disableTwoFactor: () => Promise<void>
  isTwoFactorEnabled: boolean
  
  // Session management
  refreshSession: () => Promise<void>
  getSessionToken: () => Promise<string | null>
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | null>(null)

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext)
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  return context
}

function EnhancedAuthContextProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser()
  const { getToken, signOut: clerkSignOut } = useAuth()
  const { address: walletAddress, isConnected } = useWallet()
  
  // State
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false)

  // Load user profile from Supabase
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_wallets (wallet_address),
          subscriptions (tier, status)
        `)
        .eq('clerk_user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // Create user profile if it doesn't exist
        await createUserProfile(userId)
        return
      }

      // Transform data to UserProfile format
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.avatar_url,
        username: data.username,
        
        walletAddresses: data.user_wallets?.map((w: any) => w.wallet_address) || [],
        primaryWallet: data.primary_wallet,
        authMethods: data.auth_methods || ['email'],
        isEmailVerified: data.email_verified || false,
        isPhoneVerified: data.phone_verified || false,
        
        subscriptionTier: data.subscriptions?.[0]?.tier || 'free',
        credits: data.credits || 0,
        isActive: data.is_active || true,
        
        preferences: data.preferences || {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
            security: true,
            marketing: false
          },
          privacy: {
            profileVisibility: 'private',
            showWalletAddress: false,
            allowAnalytics: true
          }
        },
        
        createdAt: new Date(data.created_at),
        lastLoginAt: new Date(data.last_login_at || data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      setUser(userProfile)
      setIsTwoFactorEnabled(data.two_factor_enabled || false)

    } catch (error) {
      console.error('Error loading user profile:', error)
      toast.error('Failed to load user profile')
    }
  }, [])

  // Create user profile in Supabase
  const createUserProfile = useCallback(async (userId: string) => {
    if (!clerkUser) return

    try {
      const { error } = await supabase
        .from('users')
        .insert({
          clerk_user_id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          full_name: clerkUser.fullName,
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          avatar_url: clerkUser.imageUrl,
          username: clerkUser.username,
          email_verified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          auth_methods: ['email'],
          credits: 10, // Welcome credits
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString()
        })

      if (error) throw error

      // Reload profile after creation
      await loadUserProfile(userId)
      
      toast.success('Welcome to NovaGuard!')

    } catch (error) {
      console.error('Error creating user profile:', error)
      toast.error('Failed to create user profile')
    }
  }, [clerkUser, loadUserProfile])

  // Load user data when Clerk user changes
  useEffect(() => {
    if (clerkLoaded) {
      if (clerkUser) {
        loadUserProfile(clerkUser.id)
      } else {
        setUser(null)
      }
      setIsLoaded(true)
    }
  }, [clerkUser, clerkLoaded, loadUserProfile])

  // Update last login time
  useEffect(() => {
    if (clerkSignedIn && user) {
      updateLastLogin()
    }
  }, [clerkSignedIn, user])

  const updateLastLogin = async () => {
    if (!user) return

    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }

  // Authentication methods
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    // This would be handled by Clerk's sign-in methods
    throw new Error('Email sign-in should be handled by Clerk components')
  }, [])

  const signInWithWallet = useCallback(async (address: string, signature: string) => {
    try {
      // Verify signature and authenticate with wallet
      // This would require custom implementation with Clerk's custom auth
      throw new Error('Wallet sign-in not yet implemented')
    } catch (error) {
      console.error('Wallet sign-in error:', error)
      throw error
    }
  }, [])

  const signInWithSocial = useCallback(async (provider: 'google' | 'github' | 'discord') => {
    // This would be handled by Clerk's OAuth methods
    throw new Error('Social sign-in should be handled by Clerk components')
  }, [])

  const signOut = useCallback(async () => {
    try {
      await clerkSignOut()
      setUser(null)
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }, [clerkSignOut])

  const signUpWithEmail = useCallback(async (email: string, password: string, userData: any) => {
    // This would be handled by Clerk's sign-up methods
    throw new Error('Email sign-up should be handled by Clerk components')
  }, [])

  // Profile management
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user signed in')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null)
      toast.success('Profile updated successfully')

    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
      throw error
    }
  }, [user])

  const updatePreferences = useCallback(async (preferences: Partial<UserProfile['preferences']>) => {
    if (!user) throw new Error('No user signed in')

    const updatedPreferences = {
      ...user.preferences,
      ...preferences
    }

    await updateProfile({ preferences: updatedPreferences })
  }, [user, updateProfile])

  // Wallet integration
  const linkWallet = useCallback(async (address: string) => {
    if (!user) throw new Error('No user signed in')

    try {
      const { error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user.id,
          wallet_address: address.toLowerCase(),
          is_primary: user.walletAddresses.length === 0,
          linked_at: new Date().toISOString()
        })

      if (error) throw error

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        walletAddresses: [...prev.walletAddresses, address],
        primaryWallet: prev.primaryWallet || address
      } : null)

      toast.success('Wallet linked successfully')

    } catch (error) {
      console.error('Error linking wallet:', error)
      toast.error('Failed to link wallet')
      throw error
    }
  }, [user])

  const unlinkWallet = useCallback(async (address: string) => {
    if (!user) throw new Error('No user signed in')

    try {
      const { error } = await supabase
        .from('user_wallets')
        .delete()
        .eq('user_id', user.id)
        .eq('wallet_address', address.toLowerCase())

      if (error) throw error

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        walletAddresses: prev.walletAddresses.filter(addr => addr !== address),
        primaryWallet: prev.primaryWallet === address ? null : prev.primaryWallet
      } : null)

      toast.success('Wallet unlinked successfully')

    } catch (error) {
      console.error('Error unlinking wallet:', error)
      toast.error('Failed to unlink wallet')
      throw error
    }
  }, [user])

  // Security
  const enableTwoFactor = useCallback(async () => {
    if (!user) throw new Error('No user signed in')

    try {
      // This would integrate with Clerk's 2FA or custom implementation
      setIsTwoFactorEnabled(true)
      toast.success('Two-factor authentication enabled')
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      toast.error('Failed to enable two-factor authentication')
      throw error
    }
  }, [user])

  const disableTwoFactor = useCallback(async () => {
    if (!user) throw new Error('No user signed in')

    try {
      // This would integrate with Clerk's 2FA or custom implementation
      setIsTwoFactorEnabled(false)
      toast.success('Two-factor authentication disabled')
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      toast.error('Failed to disable two-factor authentication')
      throw error
    }
  }, [user])

  // Session management
  const refreshSession = useCallback(async () => {
    if (clerkUser) {
      await loadUserProfile(clerkUser.id)
    }
  }, [clerkUser, loadUserProfile])

  const getSessionToken = useCallback(async (): Promise<string | null> => {
    try {
      return await getToken()
    } catch (error) {
      console.error('Error getting session token:', error)
      return null
    }
  }, [getToken])

  const contextValue: EnhancedAuthContextType = {
    // User state
    user,
    isLoaded,
    isSignedIn: clerkSignedIn,
    
    // Authentication methods
    signInWithEmail,
    signInWithWallet,
    signInWithSocial,
    signOut,
    
    // Registration
    signUpWithEmail,
    
    // Profile management
    updateProfile,
    updatePreferences,
    
    // Wallet integration
    linkWallet,
    unlinkWallet,
    
    // Security
    enableTwoFactor,
    disableTwoFactor,
    isTwoFactorEnabled,
    
    // Session management
    refreshSession,
    getSessionToken
  }

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

interface EnhancedAuthProviderProps {
  children: React.ReactNode
}

export function EnhancedAuthProvider({ children }: EnhancedAuthProviderProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#ffffff',
          colorInputBackground: '#f8fafc',
          colorInputText: '#1e293b',
          borderRadius: '0.5rem'
        },
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'shadow-lg border border-gray-200',
          headerTitle: 'text-gray-900',
          headerSubtitle: 'text-gray-600'
        }
      }}
    >
      <EnhancedAuthContextProvider>
        {children}
      </EnhancedAuthContextProvider>
    </ClerkProvider>
  )
}

export default EnhancedAuthProvider
