// =============================================
// NOVAGUARD FIREBASE FUNCTIONS
// Serverless backend API for NovaGuard platform
// =============================================

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import AnalysisService from './services/analysis-service'

// Initialize Firebase Admin
admin.initializeApp()

// Set global options
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 100,
  memory: '1GiB',
  timeoutSeconds: 540
})

// Initialize services
const supabase = createClient(
  functions.config().supabase.url,
  functions.config().supabase.service_key
)

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2024-06-20'
})

// Express app setup
const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

app.use(cors({
  origin: [
    'https://novaguard.app',
    'https://novaguard-dev.web.app',
    'http://localhost:3000'
  ],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

app.use(limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Authentication middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(token)
    req.user = decodedToken
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

// =============================================
// AUDIT API ENDPOINTS
// =============================================

// Analyze smart contract
app.post('/api/audit/analyze', authenticateUser, async (req, res) => {
  try {
    const { contractCode, analysisType, options } = req.body

    if (!contractCode) {
      return res.status(400).json({ error: 'Contract code is required' })
    }

    const analysisService = new AnalysisService()

    const result = await analysisService.analyzeContract({
      code: contractCode,
      type: analysisType || 'comprehensive',
      userId: req.user.uid,
      options: options || {}
    })

    res.json(result)
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({ error: 'Analysis failed' })
  }
})

// Get audit history
app.get('/api/audit/history', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.uid)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)

    if (error) throw error

    res.json({
      audits: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    })
  } catch (error) {
    console.error('History fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch audit history' })
  }
})

// =============================================
// PAYMENT API ENDPOINTS
// =============================================

// Create payment intent
app.post('/api/payments/create-intent', authenticateUser, async (req, res) => {
  try {
    const { packageId, amount } = req.body

    if (!packageId || !amount) {
      return res.status(400).json({ error: 'Package ID and amount are required' })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: req.user.uid,
        packageId
      }
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error) {
    console.error('Payment intent error:', error)
    res.status(500).json({ error: 'Failed to create payment intent' })
  }
})

// Handle Stripe webhook
app.post('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string
    const endpointSecret = functions.config().stripe.webhook_secret

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return res.status(400).send('Webhook signature verification failed')
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handleSuccessfulPayment(paymentIntent)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// =============================================
// MONITORING API ENDPOINTS
// =============================================

// Add contract to monitoring
app.post('/api/monitoring/contracts', authenticateUser, async (req, res) => {
  try {
    const { contractAddress, chain, name, abi } = req.body

    if (!contractAddress || !chain || !name) {
      return res.status(400).json({ error: 'Contract address, chain, and name are required' })
    }

    const { data, error } = await supabase
      .from('monitored_contracts')
      .insert({
        contract_address: contractAddress.toLowerCase(),
        chain,
        name,
        abi,
        user_id: req.user.uid,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Monitoring add error:', error)
    res.status(500).json({ error: 'Failed to add contract to monitoring' })
  }
})

// Get monitoring alerts
app.get('/api/monitoring/alerts', authenticateUser, async (req, res) => {
  try {
    const { contractId, limit = 50 } = req.query

    let query = supabase
      .from('contract_alerts')
      .select(`
        *,
        monitored_contracts!inner(user_id)
      `)
      .eq('monitored_contracts.user_id', req.user.uid)
      .order('timestamp', { ascending: false })
      .limit(Number(limit))

    if (contractId && contractId !== 'all') {
      query = query.eq('contract_id', contractId)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ alerts: data })
  } catch (error) {
    console.error('Alerts fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

// =============================================
// COLLABORATION API ENDPOINTS
// =============================================

// Create collaboration session
app.post('/api/collaboration/sessions', authenticateUser, async (req, res) => {
  try {
    const { contractId, title, description } = req.body

    if (!contractId || !title) {
      return res.status(400).json({ error: 'Contract ID and title are required' })
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabase
      .from('collaboration_sessions')
      .insert({
        id: sessionId,
        contract_id: contractId,
        title,
        description,
        created_by: req.user.uid,
        participants: [req.user.uid],
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Session creation error:', error)
    res.status(500).json({ error: 'Failed to create collaboration session' })
  }
})

// =============================================
// HEALTH CHECK ENDPOINT
// =============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// =============================================
// HELPER FUNCTIONS
// =============================================

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { userId, packageId } = paymentIntent.metadata

    // Credit packages
    const creditPackages: Record<string, number> = {
      starter: 100,
      professional: 500,
      enterprise: 2000
    }

    const credits = creditPackages[packageId] || 0

    // Update user credits
    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('clerk_user_id', userId)
      .single()

    if (user) {
      const newCredits = (user.credits || 0) + credits

      await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('clerk_user_id', userId)

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'purchase',
          amount: credits,
          balance_after: newCredits,
          description: `Purchased ${packageId} package`,
          reference_type: 'payment',
          reference_id: paymentIntent.id
        })
    }

    console.log(`Payment processed: ${paymentIntent.id} for user ${userId}`)
  } catch (error) {
    console.error('Payment processing error:', error)
  }
}

// Export the Express app as a Firebase Function
export const api = onRequest({
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 540,
  maxInstances: 100
}, app)

// =============================================
// BACKGROUND FUNCTIONS
// =============================================

// Process audit completion
export const processAuditCompletion = onDocumentCreated(
  'audit_logs/{auditId}',
  async (event) => {
    try {
      const auditData = event.data?.data()
      if (!auditData || auditData.status !== 'completed') return

      // Send notification (implement notification service)
      console.log(`Audit completion processed: ${event.params.auditId}`)
    } catch (error) {
      console.error('Audit completion processing error:', error)
    }
  }
)

// Scheduled function to clean up old data
export const cleanupOldData = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Clean up old audit logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .eq('is_temporary', true)

      if (auditError) {
        console.error('Audit cleanup error:', auditError)
      }

      console.log('Data cleanup completed successfully')
    } catch (error) {
      console.error('Data cleanup error:', error)
    }
  })

export default app

// =============================================
// AUDIT API ENDPOINTS
// =============================================

// Analyze smart contract
app.post('/api/audit/analyze', authenticateUser, async (req, res) => {
  try {
    const { contractCode, analysisType, options } = req.body
    
    if (!contractCode) {
      return res.status(400).json({ error: 'Contract code is required' })
    }

    // Import analysis service
    const { AnalysisService } = await import('./services/analysis-service')
    const analysisService = new AnalysisService()
    
    const result = await analysisService.analyzeContract({
      code: contractCode,
      type: analysisType || 'comprehensive',
      userId: req.user.uid,
      options: options || {}
    })

    res.json(result)
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({ error: 'Analysis failed' })
  }
})

// Get audit history
app.get('/api/audit/history', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.uid)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)

    if (error) throw error

    res.json({
      audits: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    })
  } catch (error) {
    console.error('History fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch audit history' })
  }
})

// =============================================
// DEPLOYMENT API ENDPOINTS
// =============================================

// Deploy contract
app.post('/api/deployment/deploy', authenticateUser, async (req, res) => {
  try {
    const { contractCode, chain, constructorArgs, options } = req.body
    
    if (!contractCode || !chain) {
      return res.status(400).json({ error: 'Contract code and chain are required' })
    }

    // Import deployment service
    const { DeploymentService } = await import('./services/deployment-service')
    const deploymentService = new DeploymentService()
    
    const result = await deploymentService.deployContract({
      code: contractCode,
      chain,
      constructorArgs: constructorArgs || [],
      userId: req.user.uid,
      options: options || {}
    })

    res.json(result)
  } catch (error) {
    console.error('Deployment error:', error)
    res.status(500).json({ error: 'Deployment failed' })
  }
})

// Get deployment status
app.get('/api/deployment/status/:deploymentId', authenticateUser, async (req, res) => {
  try {
    const { deploymentId } = req.params

    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('deployment_id', deploymentId)
      .eq('user_id', req.user.uid)
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Status fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch deployment status' })
  }
})

// =============================================
// PAYMENT API ENDPOINTS
// =============================================

// Create payment intent
app.post('/api/payments/create-intent', authenticateUser, async (req, res) => {
  try {
    const { packageId, paymentMethod } = req.body
    
    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' })
    }

    // Import payment service
    const { PaymentService } = await import('./services/payment-service')
    const paymentService = new PaymentService()
    
    const result = await paymentService.createPaymentIntent({
      userId: req.user.uid,
      packageId,
      paymentMethod: paymentMethod || 'stripe'
    })

    res.json(result)
  } catch (error) {
    console.error('Payment intent error:', error)
    res.status(500).json({ error: 'Failed to create payment intent' })
  }
})

// Handle Stripe webhook
app.post('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string
    const endpointSecret = functions.config().stripe.webhook_secret

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return res.status(400).send('Webhook signature verification failed')
    }

    // Import payment service
    const { PaymentService } = await import('./services/payment-service')
    const paymentService = new PaymentService()
    
    await paymentService.handleStripeWebhook(event)

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// =============================================
// MONITORING API ENDPOINTS
// =============================================

// Add contract to monitoring
app.post('/api/monitoring/contracts', authenticateUser, async (req, res) => {
  try {
    const { contractAddress, chain, name, abi } = req.body
    
    if (!contractAddress || !chain || !name) {
      return res.status(400).json({ error: 'Contract address, chain, and name are required' })
    }

    // Import monitoring service
    const { MonitoringService } = await import('./services/monitoring-service')
    const monitoringService = new MonitoringService()
    
    const result = await monitoringService.addContract({
      contractAddress,
      chain,
      name,
      abi,
      userId: req.user.uid
    })

    res.json(result)
  } catch (error) {
    console.error('Monitoring add error:', error)
    res.status(500).json({ error: 'Failed to add contract to monitoring' })
  }
})

// Get monitoring alerts
app.get('/api/monitoring/alerts', authenticateUser, async (req, res) => {
  try {
    const { contractId, limit = 50 } = req.query

    let query = supabase
      .from('contract_alerts')
      .select(`
        *,
        monitored_contracts!inner(user_id)
      `)
      .eq('monitored_contracts.user_id', req.user.uid)
      .order('timestamp', { ascending: false })
      .limit(Number(limit))

    if (contractId && contractId !== 'all') {
      query = query.eq('contract_id', contractId)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ alerts: data })
  } catch (error) {
    console.error('Alerts fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

// =============================================
// ANALYTICS API ENDPOINTS
// =============================================

// Get contract analytics
app.get('/api/analytics/contract/:contractId', authenticateUser, async (req, res) => {
  try {
    const { contractId } = req.params
    const { timeRange = '30d' } = req.query

    // Import analytics service
    const { AnalyticsService } = await import('./services/analytics-service')
    const analyticsService = new AnalyticsService()
    
    const result = await analyticsService.getContractAnalytics({
      contractId,
      userId: req.user.uid,
      timeRange: timeRange as string
    })

    res.json(result)
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// Get portfolio analytics
app.get('/api/analytics/portfolio', authenticateUser, async (req, res) => {
  try {
    // Import analytics service
    const { AnalyticsService } = await import('./services/analytics-service')
    const analyticsService = new AnalyticsService()
    
    const result = await analyticsService.getPortfolioAnalytics(req.user.uid)

    res.json(result)
  } catch (error) {
    console.error('Portfolio analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch portfolio analytics' })
  }
})

// =============================================
// COLLABORATION API ENDPOINTS
// =============================================

// Create collaboration session
app.post('/api/collaboration/sessions', authenticateUser, async (req, res) => {
  try {
    const { contractId, title, description } = req.body
    
    if (!contractId || !title) {
      return res.status(400).json({ error: 'Contract ID and title are required' })
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabase
      .from('collaboration_sessions')
      .insert({
        id: sessionId,
        contract_id: contractId,
        title,
        description,
        created_by: req.user.uid,
        participants: [req.user.uid],
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Session creation error:', error)
    res.status(500).json({ error: 'Failed to create collaboration session' })
  }
})

// Join collaboration session
app.post('/api/collaboration/sessions/:sessionId/join', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params

    // Get current session
    const { data: session, error: fetchError } = await supabase
      .from('collaboration_sessions')
      .select('participants')
      .eq('id', sessionId)
      .single()

    if (fetchError) throw fetchError

    // Add user to participants if not already present
    const participants = session.participants || []
    if (!participants.includes(req.user.uid)) {
      participants.push(req.user.uid)

      const { error: updateError } = await supabase
        .from('collaboration_sessions')
        .update({ participants })
        .eq('id', sessionId)

      if (updateError) throw updateError
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Session join error:', error)
    res.status(500).json({ error: 'Failed to join collaboration session' })
  }
})

// =============================================
// HEALTH CHECK ENDPOINT
// =============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Export the Express app as a Firebase Function
export const api = onRequest({
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 540,
  maxInstances: 100
}, app)

// =============================================
// BACKGROUND FUNCTIONS
// =============================================

// Process audit completion
export const processAuditCompletion = onDocumentCreated(
  'audit_logs/{auditId}',
  async (event) => {
    try {
      const auditData = event.data?.data()
      if (!auditData) return

      // Import notification service
      const { NotificationService } = await import('./services/notification-service')
      const notificationService = new NotificationService()

      // Send completion notification
      await notificationService.sendAuditCompletionNotification({
        userId: auditData.user_id,
        auditId: event.params.auditId,
        results: auditData.results
      })

      console.log(`Audit completion processed: ${event.params.auditId}`)
    } catch (error) {
      console.error('Audit completion processing error:', error)
    }
  }
)

// Process deployment updates
export const processDeploymentUpdate = onDocumentUpdated(
  'deployments/{deploymentId}',
  async (event) => {
    try {
      const beforeData = event.data?.before.data()
      const afterData = event.data?.after.data()
      
      if (!beforeData || !afterData) return

      // Check if status changed
      if (beforeData.status !== afterData.status) {
        // Import notification service
        const { NotificationService } = await import('./services/notification-service')
        const notificationService = new NotificationService()

        // Send status update notification
        await notificationService.sendDeploymentStatusNotification({
          userId: afterData.user_id,
          deploymentId: event.params.deploymentId,
          status: afterData.status,
          contractAddress: afterData.contract_address
        })

        console.log(`Deployment status update processed: ${event.params.deploymentId}`)
      }
    } catch (error) {
      console.error('Deployment update processing error:', error)
    }
  }
)

// Scheduled function to clean up old data
export const cleanupOldData = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Clean up old audit logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .eq('is_temporary', true)

      if (auditError) {
        console.error('Audit cleanup error:', auditError)
      }

      // Clean up old collaboration sessions
      const { error: sessionError } = await supabase
        .from('collaboration_sessions')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .eq('is_active', false)

      if (sessionError) {
        console.error('Session cleanup error:', sessionError)
      }

      console.log('Data cleanup completed successfully')
    } catch (error) {
      console.error('Data cleanup error:', error)
    }
  })

// Scheduled function to update analytics
export const updateAnalytics = functions.pubsub
  .schedule('0 */6 * * *') // Run every 6 hours
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      // Import analytics service
      const { AnalyticsService } = await import('./services/analytics-service')
      const analyticsService = new AnalyticsService()

      // Update analytics for all active contracts
      await analyticsService.updateAllContractAnalytics()

      console.log('Analytics update completed successfully')
    } catch (error) {
      console.error('Analytics update error:', error)
    }
  })

// Export individual services for testing
export { default as AnalysisService } from './services/analysis-service'
export { default as DeploymentService } from './services/deployment-service'
export { default as PaymentService } from './services/payment-service'
export { default as MonitoringService } from './services/monitoring-service'
export { default as AnalyticsService } from './services/analytics-service'
export { default as NotificationService } from './services/notification-service'
