// =============================================
// NOVAGUARD API INTEGRATION TESTS
// End-to-end testing for API endpoints
// =============================================

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import request from 'supertest'

// Test configuration
const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000'
const TEST_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TEST_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize test client
const supabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY)

describe('API Integration Tests', () => {
  let testUserId: string
  let testApiKey: string
  let authToken: string

  beforeAll(async () => {
    // Setup test user and API key
    testUserId = `test-user-${Date.now()}`
    testApiKey = `test-key-${Date.now()}`
    authToken = 'test-auth-token'

    // Create test user in database
    await supabase
      .from('users')
      .insert({
        clerk_user_id: testUserId,
        email: 'test@novaguard.app',
        full_name: 'Test User',
        credits: 100
      })

    // Create test API key
    await supabase
      .from('api_keys')
      .insert({
        key: testApiKey,
        user_id: testUserId,
        name: 'Test API Key',
        is_active: true,
        rate_limit: 1000
      })
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from('api_keys')
      .delete()
      .eq('key', testApiKey)

    await supabase
      .from('users')
      .delete()
      .eq('clerk_user_id', testUserId)
  })

  beforeEach(async () => {
    // Reset any test state
  })

  afterEach(async () => {
    // Cleanup after each test
  })

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .send({
          contractCode: 'pragma solidity ^0.8.0; contract Test {}'
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toContain('API key required')
    })

    it('should reject requests with invalid API key', async () => {
      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', 'invalid-key')
        .send({
          contractCode: 'pragma solidity ^0.8.0; contract Test {}'
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toContain('Invalid API key')
    })

    it('should accept requests with valid API key', async () => {
      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', testApiKey)
        .send({
          contractCode: 'pragma solidity ^0.8.0; contract Test { uint256 public value; }'
        })

      expect(response.status).toBe(202)
      expect(response.body.auditId).toBeDefined()
    })
  })

  describe('Audit API', () => {
    it('should submit audit request successfully', async () => {
      const contractCode = `
        pragma solidity ^0.8.0;
        
        contract TestContract {
          uint256 public value;
          
          function setValue(uint256 _value) public {
            value = _value;
          }
        }
      `

      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', testApiKey)
        .send({
          contractCode,
          analysisType: 'comprehensive',
          options: {
            includeGasAnalysis: true,
            severity: 'medium'
          },
          metadata: {
            projectName: 'Test Project',
            version: '1.0.0'
          }
        })

      expect(response.status).toBe(202)
      expect(response.body.auditId).toBeDefined()
      expect(response.body.status).toBe('queued')
      expect(response.body.createdAt).toBeDefined()
    })

    it('should validate contract code requirement', async () => {
      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', testApiKey)
        .send({
          analysisType: 'security'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('contractCode is required')
    })

    it('should validate contract code size limit', async () => {
      const largeCode = 'pragma solidity ^0.8.0;\n' + 'contract Large {\n'.repeat(50000) + '}'

      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', testApiKey)
        .send({
          contractCode: largeCode
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('too large')
    })

    it('should get audit status', async () => {
      // First submit an audit
      const submitResponse = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', testApiKey)
        .send({
          contractCode: 'pragma solidity ^0.8.0; contract Test { uint256 public value; }'
        })

      const auditId = submitResponse.body.auditId

      // Then get its status
      const statusResponse = await request(TEST_API_URL)
        .get(`/api/audit/${auditId}`)
        .set('x-api-key', testApiKey)

      expect(statusResponse.status).toBe(200)
      expect(statusResponse.body.auditId).toBe(auditId)
      expect(['queued', 'processing', 'completed', 'failed']).toContain(statusResponse.body.status)
    })

    it('should return 404 for non-existent audit', async () => {
      const response = await request(TEST_API_URL)
        .get('/api/audit/non-existent-id')
        .set('x-api-key', testApiKey)

      expect(response.status).toBe(404)
      expect(response.body.error).toContain('not found')
    })

    it('should list user audits', async () => {
      // Submit a few audits first
      await Promise.all([
        request(TEST_API_URL)
          .post('/api/audit')
          .set('x-api-key', testApiKey)
          .send({ contractCode: 'pragma solidity ^0.8.0; contract Test1 {}' }),
        request(TEST_API_URL)
          .post('/api/audit')
          .set('x-api-key', testApiKey)
          .send({ contractCode: 'pragma solidity ^0.8.0; contract Test2 {}' })
      ])

      const response = await request(TEST_API_URL)
        .get('/api/audits')
        .set('x-api-key', testApiKey)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.audits)).toBe(true)
      expect(response.body.audits.length).toBeGreaterThan(0)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(20)
    })

    it('should support pagination', async () => {
      const response = await request(TEST_API_URL)
        .get('/api/audits?page=2&limit=5')
        .set('x-api-key', testApiKey)

      expect(response.status).toBe(200)
      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(5)
    })

    it('should filter audits by status', async () => {
      const response = await request(TEST_API_URL)
        .get('/api/audits?status=completed')
        .set('x-api-key', testApiKey)

      expect(response.status).toBe(200)
      // All returned audits should have completed status
      response.body.audits.forEach((audit: any) => {
        expect(audit.status).toBe('completed')
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () =>
        request(TEST_API_URL)
          .post('/api/audit')
          .set('x-api-key', testApiKey)
          .send({
            contractCode: 'pragma solidity ^0.8.0; contract Test {}'
          })
      )

      const responses = await Promise.all(requests)
      
      // Some requests should succeed, others should be rate limited
      const successfulRequests = responses.filter(r => r.status === 202)
      const rateLimitedRequests = responses.filter(r => r.status === 429)

      expect(successfulRequests.length).toBeGreaterThan(0)
      expect(rateLimitedRequests.length).toBeGreaterThan(0)

      // Rate limited responses should include rate limit headers
      rateLimitedRequests.forEach(response => {
        expect(response.headers['x-ratelimit-limit']).toBeDefined()
        expect(response.headers['x-ratelimit-remaining']).toBeDefined()
        expect(response.headers['x-ratelimit-reset']).toBeDefined()
      })
    })
  })

  describe('Usage Statistics', () => {
    it('should return usage statistics', async () => {
      const response = await request(TEST_API_URL)
        .get('/api/usage')
        .set('x-api-key', testApiKey)

      expect(response.status).toBe(200)
      expect(response.body.totalRequests).toBeDefined()
      expect(response.body.avgRequestsPerDay).toBeDefined()
      expect(Array.isArray(response.body.dailyUsage)).toBe(true)
      expect(response.body.rateLimit).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', testApiKey)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')

      expect(response.status).toBe(400)
    })

    it('should handle missing content-type', async () => {
      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', testApiKey)
        .send('contractCode=test')

      expect(response.status).toBe(400)
    })

    it('should handle server errors gracefully', async () => {
      // This would require mocking internal services to fail
      // For now, we'll test that the API returns proper error format
      const response = await request(TEST_API_URL)
        .post('/api/audit')
        .set('x-api-key', testApiKey)
        .send({
          contractCode: null // This should cause an internal error
        })

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body.error).toBeDefined()
    })
  })

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(TEST_API_URL)
        .get('/api/health')

      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['x-xss-protection']).toBe('1; mode=block')
    })
  })

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(TEST_API_URL)
        .get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('healthy')
      expect(response.body.timestamp).toBeDefined()
      expect(response.body.version).toBeDefined()
    })
  })

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(TEST_API_URL)
        .options('/api/audit')
        .set('Origin', 'https://novaguard.app')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'x-api-key,content-type')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBeDefined()
      expect(response.headers['access-control-allow-methods']).toBeDefined()
      expect(response.headers['access-control-allow-headers']).toBeDefined()
    })
  })
})
