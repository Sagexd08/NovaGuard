// Simple test server to verify setup
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

console.log('🔧 Starting test server...');

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Test routes
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    status: 'ok',
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  console.log('🏥 API Health check requested');
  res.json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/projects', (req, res) => {
  console.log('📁 Project creation requested');
  console.log('📋 Request body:', req.body);
  
  res.status(201).json({
    success: true,
    data: {
      id: 'test_project_123',
      name: req.body.name || 'Test Project',
      description: req.body.description || 'Test Description',
      created_at: new Date().toISOString()
    },
    message: 'Test project created successfully'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Projects endpoint: http://localhost:${PORT}/api/projects`);
});
