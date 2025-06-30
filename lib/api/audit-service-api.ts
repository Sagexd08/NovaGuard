// =============================================
// NOVAGUARD AUDIT-AS-A-SERVICE API
// Enterprise API for automated smart contract auditing
// =============================================

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { ratelimit } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth/api-key-validator'
import AnalysisService from '@/functions/src/services/analysis-service'

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const analysisService = new AnalysisService()

export interface AuditRequest {
  contractCode: string
  contractAddress?: string
  chain?: string
  analysisType?: 'security' | 'gas' | 'comprehensive' | 'quick'
  options?: {
    includeGasAnalysis?: boolean
    includeMEVAnalysis?: boolean
    includeTokenomics?: boolean
    severity?: 'low' | 'medium' | 'high' | 'critical'
    customRules?: string[]
    webhookUrl?: string
  }
  metadata?: {
    projectName?: string
    version?: string
    tags?: string[]
    description?: string
  }
}

export interface AuditResponse {
  auditId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  result?: {
    securityScore: number
    gasScore: number
    overallScore: number
    vulnerabilities: Array<{
      id: string
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      title: string
      description: string
      location: {
        line: number
        column: number
        function?: string
      }
      recommendation: string
      cweId?: string
      confidence: number
    }>
    gasOptimizations: Array<{
      id: string
      type: string
      title: string
      description: string
      location: {
        line: number
        function?: string
      }
      estimatedSavings: number
      difficulty: 'easy' | 'medium' | 'hard'
      codeExample?: string
    }>
    recommendations: Array<{
      id: string
      category: 'security' | 'gas' | 'best-practices' | 'architecture'
      priority: 'low' | 'medium' | 'high'
      title: string
      description: string
      implementation: string
    }>
    summary: string
    metadata: {
      analysisTime: number
      linesOfCode: number
      complexity: number
      timestamp: string
    }
  }
  error?: string
  createdAt: string
  completedAt?: string
  webhookDelivered?: boolean
}

export interface ApiUsage {
  apiKey: string
  userId: string
  endpoint: string
  requestCount: number
  lastUsed: Date
  rateLimit: {
    limit: number
    remaining: number
    resetTime: Date
  }
}

export class AuditServiceAPI {
  // Submit audit request
  static async submitAudit(request: NextRequest): Promise<NextResponse> {
    try {
      // Validate API key
      const apiKey = request.headers.get('x-api-key')
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key required' },
          { status: 401 }
        )
      }

      const apiKeyValidation = await validateApiKey(apiKey)
      if (!apiKeyValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }

      // Rate limiting
      const rateLimitResult = await ratelimit.limit(apiKey)
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            rateLimit: {
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              resetTime: new Date(rateLimitResult.reset)
            }
          },
          { status: 429 }
        )
      }

      // Parse request body
      const auditRequest: AuditRequest = await request.json()

      // Validate request
      const validation = this.validateAuditRequest(auditRequest)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      // Generate audit ID
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Store audit request
      await this.storeAuditRequest(auditId, auditRequest, apiKeyValidation.userId)

      // Queue audit for processing
      await this.queueAudit(auditId, auditRequest, apiKeyValidation.userId)

      // Log API usage
      await this.logApiUsage(apiKey, apiKeyValidation.userId, 'POST /api/audit')

      const response: AuditResponse = {
        auditId,
        status: 'queued',
        createdAt: new Date().toISOString()
      }

      return NextResponse.json(response, {
        status: 202,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString()
        }
      })

    } catch (error) {
      console.error('Audit submission error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // Get audit status
  static async getAuditStatus(request: NextRequest, auditId: string): Promise<NextResponse> {
    try {
      // Validate API key
      const apiKey = request.headers.get('x-api-key')
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key required' },
          { status: 401 }
        )
      }

      const apiKeyValidation = await validateApiKey(apiKey)
      if (!apiKeyValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }

      // Get audit from database
      const { data: audit, error } = await supabase
        .from('api_audits')
        .select('*')
        .eq('id', auditId)
        .eq('user_id', apiKeyValidation.userId)
        .single()

      if (error || !audit) {
        return NextResponse.json(
          { error: 'Audit not found' },
          { status: 404 }
        )
      }

      // Log API usage
      await this.logApiUsage(apiKey, apiKeyValidation.userId, 'GET /api/audit/:id')

      const response: AuditResponse = {
        auditId: audit.id,
        status: audit.status,
        result: audit.result,
        error: audit.error,
        createdAt: audit.created_at,
        completedAt: audit.completed_at,
        webhookDelivered: audit.webhook_delivered
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Get audit status error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // List user audits
  static async listAudits(request: NextRequest): Promise<NextResponse> {
    try {
      // Validate API key
      const apiKey = request.headers.get('x-api-key')
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key required' },
          { status: 401 }
        )
      }

      const apiKeyValidation = await validateApiKey(apiKey)
      if (!apiKeyValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }

      // Parse query parameters
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
      const status = url.searchParams.get('status')
      const offset = (page - 1) * limit

      // Build query
      let query = supabase
        .from('api_audits')
        .select('*', { count: 'exact' })
        .eq('user_id', apiKeyValidation.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: audits, error, count } = await query

      if (error) {
        throw error
      }

      // Log API usage
      await this.logApiUsage(apiKey, apiKeyValidation.userId, 'GET /api/audits')

      const response = {
        audits: (audits || []).map(audit => ({
          auditId: audit.id,
          status: audit.status,
          createdAt: audit.created_at,
          completedAt: audit.completed_at,
          metadata: audit.metadata
        })),
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('List audits error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // Get API usage statistics
  static async getUsageStats(request: NextRequest): Promise<NextResponse> {
    try {
      // Validate API key
      const apiKey = request.headers.get('x-api-key')
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key required' },
          { status: 401 }
        )
      }

      const apiKeyValidation = await validateApiKey(apiKey)
      if (!apiKeyValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }

      // Get usage statistics
      const { data: usage, error } = await supabase
        .from('api_usage')
        .select('*')
        .eq('api_key', apiKey)
        .order('created_at', { ascending: false })
        .limit(30) // Last 30 days

      if (error) {
        throw error
      }

      // Calculate statistics
      const totalRequests = usage?.reduce((sum, day) => sum + day.request_count, 0) || 0
      const avgRequestsPerDay = usage?.length ? totalRequests / usage.length : 0

      const response = {
        totalRequests,
        avgRequestsPerDay: Math.round(avgRequestsPerDay),
        dailyUsage: usage || [],
        rateLimit: apiKeyValidation.rateLimit
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Get usage stats error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // Validate audit request
  private static validateAuditRequest(request: AuditRequest): { valid: boolean; error?: string } {
    if (!request.contractCode) {
      return { valid: false, error: 'contractCode is required' }
    }

    if (request.contractCode.length > 100000) {
      return { valid: false, error: 'contractCode too large (max 100KB)' }
    }

    if (request.analysisType && !['security', 'gas', 'comprehensive', 'quick'].includes(request.analysisType)) {
      return { valid: false, error: 'Invalid analysisType' }
    }

    if (request.options?.severity && !['low', 'medium', 'high', 'critical'].includes(request.options.severity)) {
      return { valid: false, error: 'Invalid severity level' }
    }

    return { valid: true }
  }

  // Store audit request
  private static async storeAuditRequest(
    auditId: string,
    request: AuditRequest,
    userId: string
  ): Promise<void> {
    await supabase
      .from('api_audits')
      .insert({
        id: auditId,
        user_id: userId,
        contract_code: request.contractCode,
        contract_address: request.contractAddress,
        chain: request.chain,
        analysis_type: request.analysisType || 'comprehensive',
        options: request.options || {},
        metadata: request.metadata || {},
        status: 'queued',
        created_at: new Date().toISOString()
      })
  }

  // Queue audit for processing
  private static async queueAudit(
    auditId: string,
    request: AuditRequest,
    userId: string
  ): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('api_audits')
        .update({ status: 'processing' })
        .eq('id', auditId)

      // Process audit asynchronously
      this.processAuditAsync(auditId, request, userId)

    } catch (error) {
      console.error('Error queuing audit:', error)
      
      // Update status to failed
      await supabase
        .from('api_audits')
        .update({ 
          status: 'failed',
          error: 'Failed to queue audit for processing'
        })
        .eq('id', auditId)
    }
  }

  // Process audit asynchronously
  private static async processAuditAsync(
    auditId: string,
    request: AuditRequest,
    userId: string
  ): Promise<void> {
    try {
      // Perform analysis
      const result = await analysisService.analyzeContract({
        code: request.contractCode,
        type: request.analysisType || 'comprehensive',
        userId,
        options: request.options || {}
      })

      // Update audit with results
      await supabase
        .from('api_audits')
        .update({
          status: 'completed',
          result,
          completed_at: new Date().toISOString()
        })
        .eq('id', auditId)

      // Send webhook if configured
      if (request.options?.webhookUrl) {
        await this.sendWebhook(auditId, request.options.webhookUrl, result)
      }

    } catch (error) {
      console.error('Error processing audit:', error)
      
      // Update status to failed
      await supabase
        .from('api_audits')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Processing failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', auditId)
    }
  }

  // Send webhook notification
  private static async sendWebhook(
    auditId: string,
    webhookUrl: string,
    result: any
  ): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NovaGuard-API/1.0'
        },
        body: JSON.stringify({
          auditId,
          status: 'completed',
          result,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        // Mark webhook as delivered
        await supabase
          .from('api_audits')
          .update({ webhook_delivered: true })
          .eq('id', auditId)
      } else {
        console.error('Webhook delivery failed:', response.status, response.statusText)
      }

    } catch (error) {
      console.error('Error sending webhook:', error)
    }
  }

  // Log API usage
  private static async logApiUsage(
    apiKey: string,
    userId: string,
    endpoint: string
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Upsert daily usage
      await supabase
        .from('api_usage')
        .upsert({
          api_key: apiKey,
          user_id: userId,
          endpoint,
          date: today,
          request_count: 1
        }, {
          onConflict: 'api_key,endpoint,date',
          ignoreDuplicates: false
        })

    } catch (error) {
      console.error('Error logging API usage:', error)
    }
  }
}

export default AuditServiceAPI
