// =============================================
// NOVAGUARD PAYMENT SERVICE
// Multi-gateway payment processing system
// =============================================

import Stripe from 'stripe'
import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Payment methods
export type PaymentMethod = 'stripe' | 'metamask' | 'upi'

// Credit packages
export const CREDIT_PACKAGES = {
  starter: {
    credits: 100,
    price: 9.99,
    currency: 'USD',
    description: 'Perfect for small projects',
    features: ['100 audit credits', '5 deployments', 'Basic support']
  },
  professional: {
    credits: 500,
    price: 39.99,
    currency: 'USD',
    description: 'For professional developers',
    features: ['500 audit credits', '25 deployments', 'Priority support', 'Advanced features']
  },
  enterprise: {
    credits: 2000,
    price: 149.99,
    currency: 'USD',
    description: 'For teams and enterprises',
    features: ['2000 audit credits', 'Unlimited deployments', '24/7 support', 'Custom integrations']
  }
} as const

export type CreditPackage = keyof typeof CREDIT_PACKAGES

// Crypto payment configuration
const CRYPTO_CONFIG = {
  ethereum: {
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL!,
    usdcAddress: '0xA0b86a33E6441b8C4505E2c8c5B5e8b5e5e5e5e5', // USDC on Ethereum
    recipientAddress: process.env.CRYPTO_RECIPIENT_ADDRESS!
  },
  polygon: {
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL!,
    usdcAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
    recipientAddress: process.env.CRYPTO_RECIPIENT_ADDRESS!
  }
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  method: PaymentMethod
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  userId: string
  packageId: CreditPackage
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CryptoPaymentRequest {
  amount: number
  currency: 'USDC' | 'ETH'
  chain: 'ethereum' | 'polygon'
  recipientAddress: string
  userAddress: string
}

export class PaymentService {
  // Create Stripe payment intent
  async createStripePayment(
    userId: string,
    packageId: CreditPackage,
    metadata: Record<string, any> = {}
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const package_ = CREDIT_PACKAGES[packageId]

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(package_.price * 100), // Convert to cents
        currency: package_.currency.toLowerCase(),
        metadata: {
          userId,
          packageId,
          credits: package_.credits.toString(),
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      })

      // Store payment intent in database
      await this.storePaymentIntent({
        id: paymentIntent.id,
        amount: package_.price,
        currency: package_.currency,
        method: 'stripe',
        status: 'pending',
        userId,
        packageId,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id
      }
    } catch (error) {
      console.error('Stripe payment creation failed:', error)
      throw new Error('Failed to create payment intent')
    }
  }

  // Create crypto payment request
  async createCryptoPayment(
    userId: string,
    packageId: CreditPackage,
    currency: 'USDC' | 'ETH',
    chain: 'ethereum' | 'polygon' = 'polygon'
  ): Promise<CryptoPaymentRequest> {
    try {
      const package_ = CREDIT_PACKAGES[packageId]
      const chainConfig = CRYPTO_CONFIG[chain]

      // Get current crypto prices
      const cryptoPrice = await this.getCryptoPrice(currency)
      const amount = package_.price / cryptoPrice

      const paymentRequest: CryptoPaymentRequest = {
        amount: parseFloat(amount.toFixed(currency === 'USDC' ? 6 : 18)),
        currency,
        chain,
        recipientAddress: chainConfig.recipientAddress,
        userAddress: '' // Will be filled by frontend
      }

      // Generate unique payment ID
      const paymentId = `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Store payment intent
      await this.storePaymentIntent({
        id: paymentId,
        amount: package_.price,
        currency: 'USD',
        method: 'metamask',
        status: 'pending',
        userId,
        packageId,
        metadata: {
          cryptoAmount: paymentRequest.amount,
          cryptoCurrency: currency,
          chain,
          recipientAddress: chainConfig.recipientAddress
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return paymentRequest
    } catch (error) {
      console.error('Crypto payment creation failed:', error)
      throw new Error('Failed to create crypto payment request')
    }
  }

  // Create UPI payment (for Indian users)
  async createUPIPayment(
    userId: string,
    packageId: CreditPackage,
    upiId: string
  ): Promise<{ paymentUrl: string; paymentId: string }> {
    try {
      const package_ = CREDIT_PACKAGES[packageId]

      // Convert USD to INR (approximate rate)
      const usdToInr = 83 // This should be fetched from a real API
      const amountInr = Math.round(package_.price * usdToInr)

      const paymentId = `upi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Generate UPI payment URL
      const paymentUrl = `upi://pay?pa=${process.env.UPI_MERCHANT_ID}&pn=NovaGuard&am=${amountInr}&cu=INR&tn=NovaGuard Credits - ${packageId}&tr=${paymentId}`

      // Store payment intent
      await this.storePaymentIntent({
        id: paymentId,
        amount: package_.price,
        currency: 'USD',
        method: 'upi',
        status: 'pending',
        userId,
        packageId,
        metadata: {
          amountInr,
          upiId,
          paymentUrl
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return { paymentUrl, paymentId }
    } catch (error) {
      console.error('UPI payment creation failed:', error)
      throw new Error('Failed to create UPI payment')
    }
  }

  // Verify crypto payment
  async verifyCryptoPayment(
    paymentId: string,
    transactionHash: string,
    userAddress: string
  ): Promise<boolean> {
    try {
      const payment = await this.getPaymentIntent(paymentId)
      if (!payment || payment.method !== 'metamask') {
        throw new Error('Invalid payment')
      }

      const { chain, cryptoAmount, cryptoCurrency, recipientAddress } = payment.metadata!
      const chainConfig = CRYPTO_CONFIG[chain as keyof typeof CRYPTO_CONFIG]

      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl)
      const receipt = await provider.getTransactionReceipt(transactionHash)

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or not found')
      }

      // Verify transaction details
      const transaction = await provider.getTransaction(transactionHash)
      if (!transaction) {
        throw new Error('Transaction not found')
      }

      // Check if transaction is to correct recipient
      if (transaction.to?.toLowerCase() !== recipientAddress.toLowerCase()) {
        throw new Error('Invalid recipient address')
      }

      // Check if transaction is from correct user
      if (transaction.from.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('Invalid sender address')
      }

      // For ETH payments, check value
      if (cryptoCurrency === 'ETH') {
        const expectedAmount = ethers.parseEther(cryptoAmount.toString())
        if (transaction.value < expectedAmount) {
          throw new Error('Insufficient payment amount')
        }
      } else {
        // For USDC payments, check transfer event
        const usdcContract = new ethers.Contract(
          chainConfig.usdcAddress,
          ['event Transfer(address indexed from, address indexed to, uint256 value)'],
          provider
        )

        const transferEvents = await usdcContract.queryFilter(
          usdcContract.filters.Transfer(userAddress, recipientAddress),
          receipt.blockNumber,
          receipt.blockNumber
        )

        if (transferEvents.length === 0) {
          throw new Error('USDC transfer not found')
        }

        const transferAmount = transferEvents[0].args.value
        const expectedAmount = ethers.parseUnits(cryptoAmount.toString(), 6) // USDC has 6 decimals

        if (transferAmount < expectedAmount) {
          throw new Error('Insufficient USDC payment amount')
        }
      }

  // Validate UPI payment (manual verification for now)
  async validateUPIPayment(
    paymentId: string,
    transactionRef: string,
    amount: number
  ): Promise<boolean> {
    try {
      const payment = await this.getPaymentIntent(paymentId)
      if (!payment || payment.method !== 'upi') {
        throw new Error('Invalid UPI payment')
      }

      // In a real implementation, you would integrate with UPI payment gateway
      // For now, we'll do basic validation
      if (!transactionRef || transactionRef.length < 10) {
        throw new Error('Invalid transaction reference')
      }

      // Update payment status
      await this.updatePaymentStatus(paymentId, 'completed', {
        transactionRef,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'manual'
      })

      // Credit user account
      await this.creditUserAccount(payment.userId, payment.packageId)

      return true
    } catch (error) {
      console.error('UPI payment validation failed:', error)
      await this.updatePaymentStatus(paymentId, 'failed', {
        error: error instanceof Error ? error.message : 'Validation failed'
      })
      return false
    }
  }

  // Create subscription for premium users
  async createSubscription(
    userId: string,
    priceId: string,
    paymentMethodId: string
  ): Promise<{ subscriptionId: string; clientSecret?: string }> {
    try {
      // Get or create Stripe customer
      let customer = await this.getOrCreateStripeCustomer(userId)

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      })

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      })

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId
        }
      })

      // Store subscription in database
      await supabase
        .from('subscriptions')
        .insert({
          id: subscription.id,
          user_id: userId,
          stripe_customer_id: customer.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          created_at: new Date().toISOString()
        })

      const invoice = subscription.latest_invoice as Stripe.Invoice
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || undefined
      }
    } catch (error) {
      console.error('Subscription creation failed:', error)
      throw new Error('Failed to create subscription')
    }
  }

  // Get or create Stripe customer
  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    // Check if customer exists in database
    const { data: existingCustomer } = await supabase
      .from('users')
      .select('stripe_customer_id, email, full_name')
      .eq('id', userId)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      // Return existing customer
      return await stripe.customers.retrieve(existingCustomer.stripe_customer_id) as Stripe.Customer
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: existingCustomer?.email,
      name: existingCustomer?.full_name,
      metadata: { userId }
    })

    // Update user record with customer ID
    await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId)

    return customer
  }

      // Update payment status
      await this.updatePaymentStatus(paymentId, 'completed', {
        transactionHash,
        blockNumber: receipt.blockNumber,
        verifiedAt: new Date().toISOString()
      })

      // Credit user account
      await this.creditUserAccount(payment.userId, payment.packageId)

      return true
    } catch (error) {
      console.error('Crypto payment verification failed:', error)
      await this.updatePaymentStatus(paymentId, 'failed', {
        error: error instanceof Error ? error.message : 'Verification failed'
      })
      return false
    }
  }

  // Handle Stripe webhook
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          await this.handleSuccessfulPayment(paymentIntent.id, paymentIntent.metadata)
          break

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent
          await this.updatePaymentStatus(failedPayment.id, 'failed')
          break

        case 'payment_intent.canceled':
          const canceledPayment = event.data.object as Stripe.PaymentIntent
          await this.updatePaymentStatus(canceledPayment.id, 'cancelled')
          break

        default:
          console.log(`Unhandled Stripe event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Stripe webhook handling failed:', error)
      throw error
    }
  }

  // Handle successful payment
  private async handleSuccessfulPayment(paymentId: string, metadata: Record<string, any>): Promise<void> {
    try {
      await this.updatePaymentStatus(paymentId, 'completed')

      const { userId, packageId } = metadata
      if (userId && packageId) {
        await this.creditUserAccount(userId, packageId as CreditPackage)
      }
    } catch (error) {
      console.error('Failed to handle successful payment:', error)
      throw error
    }
  }

  // Credit user account
  private async creditUserAccount(userId: string, packageId: CreditPackage): Promise<void> {
    try {
      const package_ = CREDIT_PACKAGES[packageId]

      // Get current user credits
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single()

      if (!user) {
        throw new Error('User not found')
      }

      const newCredits = (user.credits || 0) + package_.credits

      // Update user credits
      await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('id', userId)

      // Log credit transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'purchase',
          amount: package_.credits,
          balance_after: newCredits,
          description: `Purchased ${packageId} package`,
          reference_type: 'payment',
          reference_id: packageId
        })

      console.log(`Credited ${package_.credits} credits to user ${userId}`)
    } catch (error) {
      console.error('Failed to credit user account:', error)
      throw error
    }
  }

  // Store payment intent in database
  private async storePaymentIntent(payment: PaymentIntent): Promise<void> {
    const { error } = await supabase
      .from('payment_intents')
      .insert({
        id: payment.id,
        user_id: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        package_id: payment.packageId,
        metadata: payment.metadata,
        created_at: payment.createdAt.toISOString(),
        updated_at: payment.updatedAt.toISOString()
      })

    if (error) {
      console.error('Failed to store payment intent:', error)
      throw new Error('Failed to store payment intent')
    }
  }

  // Get payment intent
  private async getPaymentIntent(paymentId: string): Promise<PaymentIntent | null> {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (error) {
      console.error('Failed to get payment intent:', error)
      return null
    }

    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      method: data.method,
      status: data.status,
      userId: data.user_id,
      packageId: data.package_id,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  // Update payment status
  private async updatePaymentStatus(
    paymentId: string,
    status: PaymentIntent['status'],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await supabase
      .from('payment_intents')
      .update({
        status,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      console.error('Failed to update payment status:', error)
      throw new Error('Failed to update payment status')
    }
  }

  // Get crypto price from API
  private async getCryptoPrice(currency: 'USDC' | 'ETH'): Promise<number> {
    try {
      const coinId = currency === 'ETH' ? 'ethereum' : 'usd-coin'
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      )
      const data = await response.json()
      return data[coinId].usd
    } catch (error) {
      console.error('Failed to get crypto price:', error)
      // Fallback prices
      return currency === 'ETH' ? 2000 : 1
    }
  }

  // Get user payment history
  async getUserPaymentHistory(userId: string, limit: number = 20): Promise<PaymentIntent[]> {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get payment history:', error)
      return []
    }

    return data.map(item => ({
      id: item.id,
      amount: item.amount,
      currency: item.currency,
      method: item.method,
      status: item.status,
      userId: item.user_id,
      packageId: item.package_id,
      metadata: item.metadata,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }))
  }

  // Get payment statistics
  async getPaymentStats(userId: string): Promise<{
    totalSpent: number
    totalCredits: number
    paymentCount: number
    lastPayment: Date | null
  }> {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('amount, package_id, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (error) {
      console.error('Failed to get payment stats:', error)
      return { totalSpent: 0, totalCredits: 0, paymentCount: 0, lastPayment: null }
    }

    const totalSpent = data.reduce((sum, payment) => sum + payment.amount, 0)
    const totalCredits = data.reduce((sum, payment) => {
      const package_ = CREDIT_PACKAGES[payment.package_id as CreditPackage]
      return sum + (package_?.credits || 0)
    }, 0)
    const paymentCount = data.length
    const lastPayment = data.length > 0 ? new Date(data[0].created_at) : null

    return { totalSpent, totalCredits, paymentCount, lastPayment }
  }
}

export default PaymentService
