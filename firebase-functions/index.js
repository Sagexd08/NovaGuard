// =============================================
// NOVAGUARD FIREBASE FUNCTIONS
// Serverless backend for smart contract auditing
// =============================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('rate-limiter-flexible');

// Initialize Firebase Admin
admin.initializeApp();

// Import NovaGuard modules
const MultiAgentOrchestrator = require('./agents/multi-agent-orchestrator');
const VectorKnowledgeSystem = require('./rag/vector-knowledge-system');
const DeploymentService = require('./services/deployment-service');
const MonitoringService = require('./services/monitoring-service');
const PaymentService = require('./services/payment-service');

// Express app setup
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: [
    'https://novaguard.app',
    'https://novaguard-dev.web.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimiter = new rateLimit.RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // Number of requests
  duration: 3600, // Per hour
});

const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
};

app.use(rateLimitMiddleware);

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'NovaGuard Firebase Functions',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// =============================================
// AUDIT ENDPOINTS
// =============================================

// Main contract audit endpoint
app.post('/audit/analyze', authenticateUser, async (req, res) => {
  try {
    const { contractCode, options = {} } = req.body;

    if (!contractCode) {
      return res.status(400).json({
        success: false,
        error: 'Contract code is required'
      });
    }

    // Initialize orchestrator
    const orchestrator = new MultiAgentOrchestrator();

    // Prepare analysis options
    const analysisOptions = {
      userId: req.user.uid,
      analysisMode: options.analysisMode || 'comprehensive',
      agents: options.agents || ['security', 'gasOptimizer', 'tokenomics'],
      strategy: options.strategy || 'adaptive',
      chain: options.chain || 'ethereum'
    };

    console.log(`🔍 Starting audit for user: ${req.user.uid}`);

    // Perform analysis
    const results = await orchestrator.analyzeContract(contractCode, analysisOptions);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Audit analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Get audit history
app.get('/audit/history', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // This would typically query Supabase for user's audit history
    // Implementation depends on your database setup

    res.json({
      success: true,
      data: {
        audits: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      }
    });
  } catch (error) {
    console.error('Get audit history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit history'
    });
  }
});

// =============================================
// DEPLOYMENT ENDPOINTS
// =============================================

// Deploy contract
app.post('/deploy/contract', authenticateUser, async (req, res) => {
  try {
    const { contractCode, deploymentConfig } = req.body;

    if (!contractCode || !deploymentConfig) {
      return res.status(400).json({
        success: false,
        error: 'Contract code and deployment config are required'
      });
    }

    const deploymentService = new DeploymentService();

    const result = await deploymentService.deployContract({
      userId: req.user.uid,
      contractCode,
      ...deploymentConfig
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Contract deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Deployment failed'
    });
  }
});

// =============================================
// MONITORING ENDPOINTS
// =============================================

// Start contract monitoring
app.post('/monitor/start', authenticateUser, async (req, res) => {
  try {
    const { contractAddress, chain, monitoringConfig } = req.body;

    if (!contractAddress || !chain) {
      return res.status(400).json({
        success: false,
        error: 'Contract address and chain are required'
      });
    }

    const monitoringService = new MonitoringService();

    const result = await monitoringService.startMonitoring({
      userId: req.user.uid,
      contractAddress,
      chain,
      ...monitoringConfig
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Start monitoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start monitoring'
    });
  }
});

// =============================================
// PAYMENT ENDPOINTS
// =============================================

// Create payment intent
app.post('/payment/create-intent', authenticateUser, async (req, res) => {
  try {
    const { amount, currency, purpose } = req.body;

    if (!amount || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'Amount and purpose are required'
      });
    }

    const paymentService = new PaymentService();

    const result = await paymentService.createPaymentIntent({
      userId: req.user.uid,
      amount,
      currency: currency || 'USD',
      purpose
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
});

// =============================================
// KNOWLEDGE BASE ENDPOINTS
// =============================================

// Search knowledge base
app.post('/knowledge/search', authenticateUser, async (req, res) => {
  try {
    const { query, docTypes, limit } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const ragSystem = new VectorKnowledgeSystem();

    const results = await ragSystem.semanticSearch(query, {
      docTypes,
      limit: limit || 10
    });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Knowledge search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Search failed'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Export Firebase Functions
exports.api = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '2GB',
    maxInstances: 100
  })
  .https
  .onRequest(app);

// Individual function exports for better performance
exports.auditContract = functions
  .runWith({
    timeoutSeconds: 300, // 5 minutes
    memory: '1GB',
    maxInstances: 50
  })
  .https
  .onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const orchestrator = new MultiAgentOrchestrator();
      const results = await orchestrator.analyzeContract(data.contractCode, {
        userId: context.auth.uid,
        ...data.options
      });

      return { success: true, data: results };
    } catch (error) {
      console.error('Audit function error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

exports.deployContract = functions
  .runWith({
    timeoutSeconds: 180, // 3 minutes
    memory: '512MB',
    maxInstances: 20
  })
  .https
  .onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const deploymentService = new DeploymentService();
      const result = await deploymentService.deployContract({
        userId: context.auth.uid,
        ...data
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Deploy function error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

exports.monitorContract = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 10
  })
  .https
  .onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const monitoringService = new MonitoringService();
      const result = await monitoringService.startMonitoring({
        userId: context.auth.uid,
        ...data
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Monitor function error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Scheduled functions for background tasks
exports.processMonitoringAlerts = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('Processing monitoring alerts...');

    try {
      const monitoringService = new MonitoringService();
      await monitoringService.processAlerts();
      console.log('Monitoring alerts processed successfully');
    } catch (error) {
      console.error('Error processing monitoring alerts:', error);
    }
  });

exports.updateKnowledgeBase = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Updating knowledge base...');

    try {
      const ragSystem = new VectorKnowledgeSystem();
      await ragSystem.initializeKnowledgeBase();
      console.log('Knowledge base updated successfully');
    } catch (error) {
      console.error('Error updating knowledge base:', error);
    }
  });
