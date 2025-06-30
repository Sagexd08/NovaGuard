// =============================================
// NOVAGUARD ANALYSIS SERVICE
// Smart contract analysis and vulnerability detection
// =============================================

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { ethers } from 'ethers'
import * as functions from 'firebase-functions'

// Initialize services
const supabase = createClient(
  functions.config().supabase.url,
  functions.config().supabase.service_key
)

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key
})

export interface AnalysisRequest {
  code: string
  type: 'security' | 'gas' | 'comprehensive' | 'quick'
  userId: string
  options: {
    includeGasAnalysis?: boolean
    includeMEVAnalysis?: boolean
    includeTokenomics?: boolean
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }
}

export interface AnalysisResult {
  id: string
  status: 'completed' | 'failed' | 'processing'
  securityScore: number
  gasScore: number
  overallScore: number
  vulnerabilities: Vulnerability[]
  gasOptimizations: GasOptimization[]
  recommendations: Recommendation[]
  summary: string
  metadata: {
    analysisTime: number
    linesOfCode: number
    complexity: number
    timestamp: string
  }
}

export interface Vulnerability {
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
}

export interface GasOptimization {
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
}

export interface Recommendation {
  id: string
  category: 'security' | 'gas' | 'best-practices' | 'architecture'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  implementation: string
}

export class AnalysisService {
  // Main analysis function
  async analyzeContract(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now()
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      console.log(`Starting analysis ${analysisId} for user ${request.userId}`)

      // Store initial analysis record
      await this.storeAnalysisRecord(analysisId, request.userId, 'processing')

      // Perform different types of analysis based on request type
      let result: AnalysisResult

      switch (request.type) {
        case 'security':
          result = await this.performSecurityAnalysis(analysisId, request)
          break
        case 'gas':
          result = await this.performGasAnalysis(analysisId, request)
          break
        case 'quick':
          result = await this.performQuickAnalysis(analysisId, request)
          break
        case 'comprehensive':
        default:
          result = await this.performComprehensiveAnalysis(analysisId, request)
          break
      }

      // Calculate analysis time
      const analysisTime = Date.now() - startTime
      result.metadata.analysisTime = analysisTime

      // Store completed analysis
      await this.storeAnalysisResult(analysisId, result)

      // Update user credits
      await this.updateUserCredits(request.userId, this.getCreditCost(request.type))

      console.log(`Analysis ${analysisId} completed in ${analysisTime}ms`)
      return result

    } catch (error) {
      console.error(`Analysis ${analysisId} failed:`, error)
      
      // Store failed analysis
      await this.storeAnalysisRecord(analysisId, request.userId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  // Comprehensive analysis combining all checks
  private async performComprehensiveAnalysis(analysisId: string, request: AnalysisRequest): Promise<AnalysisResult> {
    const [
      securityResult,
      gasResult,
      bestPracticesResult
    ] = await Promise.all([
      this.analyzeSecurityVulnerabilities(request.code),
      this.analyzeGasOptimizations(request.code),
      this.analyzeBestPractices(request.code)
    ])

    const vulnerabilities = securityResult.vulnerabilities
    const gasOptimizations = gasResult.optimizations
    const recommendations = [
      ...securityResult.recommendations,
      ...gasResult.recommendations,
      ...bestPracticesResult.recommendations
    ]

    // Calculate scores
    const securityScore = this.calculateSecurityScore(vulnerabilities)
    const gasScore = this.calculateGasScore(gasOptimizations)
    const overallScore = Math.round((securityScore + gasScore) / 2)

    // Generate AI summary
    const summary = await this.generateAISummary(request.code, {
      vulnerabilities,
      gasOptimizations,
      recommendations,
      securityScore,
      gasScore
    })

    return {
      id: analysisId,
      status: 'completed',
      securityScore,
      gasScore,
      overallScore,
      vulnerabilities,
      gasOptimizations,
      recommendations,
      summary,
      metadata: {
        analysisTime: 0, // Will be set later
        linesOfCode: request.code.split('\n').length,
        complexity: this.calculateComplexity(request.code),
        timestamp: new Date().toISOString()
      }
    }
  }

  // Security-focused analysis
  private async performSecurityAnalysis(analysisId: string, request: AnalysisRequest): Promise<AnalysisResult> {
    const securityResult = await this.analyzeSecurityVulnerabilities(request.code)
    const securityScore = this.calculateSecurityScore(securityResult.vulnerabilities)

    const summary = await this.generateAISummary(request.code, {
      vulnerabilities: securityResult.vulnerabilities,
      focus: 'security'
    })

    return {
      id: analysisId,
      status: 'completed',
      securityScore,
      gasScore: 0,
      overallScore: securityScore,
      vulnerabilities: securityResult.vulnerabilities,
      gasOptimizations: [],
      recommendations: securityResult.recommendations,
      summary,
      metadata: {
        analysisTime: 0,
        linesOfCode: request.code.split('\n').length,
        complexity: this.calculateComplexity(request.code),
        timestamp: new Date().toISOString()
      }
    }
  }

  // Gas optimization analysis
  private async performGasAnalysis(analysisId: string, request: AnalysisRequest): Promise<AnalysisResult> {
    const gasResult = await this.analyzeGasOptimizations(request.code)
    const gasScore = this.calculateGasScore(gasResult.optimizations)

    const summary = await this.generateAISummary(request.code, {
      gasOptimizations: gasResult.optimizations,
      focus: 'gas'
    })

    return {
      id: analysisId,
      status: 'completed',
      securityScore: 0,
      gasScore,
      overallScore: gasScore,
      vulnerabilities: [],
      gasOptimizations: gasResult.optimizations,
      recommendations: gasResult.recommendations,
      summary,
      metadata: {
        analysisTime: 0,
        linesOfCode: request.code.split('\n').length,
        complexity: this.calculateComplexity(request.code),
        timestamp: new Date().toISOString()
      }
    }
  }

  // Quick analysis for fast feedback
  private async performQuickAnalysis(analysisId: string, request: AnalysisRequest): Promise<AnalysisResult> {
    // Simplified analysis focusing on critical issues only
    const criticalVulnerabilities = await this.findCriticalVulnerabilities(request.code)
    const basicGasIssues = await this.findBasicGasIssues(request.code)

    const securityScore = criticalVulnerabilities.length === 0 ? 85 : 40
    const gasScore = basicGasIssues.length < 3 ? 80 : 60
    const overallScore = Math.round((securityScore + gasScore) / 2)

    return {
      id: analysisId,
      status: 'completed',
      securityScore,
      gasScore,
      overallScore,
      vulnerabilities: criticalVulnerabilities,
      gasOptimizations: basicGasIssues,
      recommendations: [],
      summary: 'Quick analysis completed. Run comprehensive analysis for detailed insights.',
      metadata: {
        analysisTime: 0,
        linesOfCode: request.code.split('\n').length,
        complexity: this.calculateComplexity(request.code),
        timestamp: new Date().toISOString()
      }
    }
  }

  // Analyze security vulnerabilities
  private async analyzeSecurityVulnerabilities(code: string): Promise<{
    vulnerabilities: Vulnerability[]
    recommendations: Recommendation[]
  }> {
    const vulnerabilities: Vulnerability[] = []
    const recommendations: Recommendation[] = []

    // Check for common vulnerability patterns
    const patterns = [
      {
        regex: /\.call\s*\(/g,
        type: 'reentrancy',
        severity: 'high' as const,
        title: 'Potential Reentrancy Vulnerability',
        description: 'External call detected without proper reentrancy protection'
      },
      {
        regex: /tx\.origin/g,
        type: 'tx_origin',
        severity: 'medium' as const,
        title: 'Use of tx.origin',
        description: 'tx.origin should not be used for authorization'
      },
      {
        regex: /selfdestruct\s*\(/g,
        type: 'selfdestruct',
        severity: 'critical' as const,
        title: 'Selfdestruct Usage',
        description: 'Selfdestruct can be dangerous if not properly protected'
      },
      {
        regex: /delegatecall\s*\(/g,
        type: 'delegatecall',
        severity: 'high' as const,
        title: 'Delegatecall Usage',
        description: 'Delegatecall can be dangerous if target is not trusted'
      }
    ]

    const lines = code.split('\n')
    
    patterns.forEach(pattern => {
      lines.forEach((line, index) => {
        const matches = line.match(pattern.regex)
        if (matches) {
          vulnerabilities.push({
            id: `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: pattern.type,
            severity: pattern.severity,
            title: pattern.title,
            description: pattern.description,
            location: {
              line: index + 1,
              column: line.indexOf(matches[0]) + 1
            },
            recommendation: this.getVulnerabilityRecommendation(pattern.type),
            confidence: 0.8
          })
        }
      })
    })

    return { vulnerabilities, recommendations }
  }

  // Analyze gas optimizations
  private async analyzeGasOptimizations(code: string): Promise<{
    optimizations: GasOptimization[]
    recommendations: Recommendation[]
  }> {
    const optimizations: GasOptimization[] = []
    const recommendations: Recommendation[] = []

    // Check for gas optimization opportunities
    const patterns = [
      {
        regex: /uint256/g,
        type: 'storage_packing',
        title: 'Storage Packing Opportunity',
        description: 'Consider using smaller uint types for storage variables'
      },
      {
        regex: /for\s*\([^)]*\.length[^)]*\)/g,
        type: 'loop_optimization',
        title: 'Loop Gas Optimization',
        description: 'Cache array length in loops to save gas'
      },
      {
        regex: /public\s+view\s+returns/g,
        type: 'function_visibility',
        title: 'Function Visibility Optimization',
        description: 'Consider using external instead of public for functions only called externally'
      }
    ]

    const lines = code.split('\n')
    
    patterns.forEach(pattern => {
      lines.forEach((line, index) => {
        const matches = line.match(pattern.regex)
        if (matches) {
          optimizations.push({
            id: `gas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: pattern.type,
            title: pattern.title,
            description: pattern.description,
            location: {
              line: index + 1
            },
            estimatedSavings: this.estimateGasSavings(pattern.type),
            difficulty: 'medium'
          })
        }
      })
    })

    return { optimizations, recommendations }
  }

  // Analyze best practices
  private async analyzeBestPractices(code: string): Promise<{
    recommendations: Recommendation[]
  }> {
    const recommendations: Recommendation[] = []

    // Check for best practice violations
    if (!code.includes('pragma solidity')) {
      recommendations.push({
        id: `rec_${Date.now()}_1`,
        category: 'best-practices',
        priority: 'high',
        title: 'Missing Pragma Statement',
        description: 'Contract should specify Solidity version',
        implementation: 'Add pragma solidity ^0.8.0; at the top of the contract'
      })
    }

    if (!code.includes('SPDX-License-Identifier')) {
      recommendations.push({
        id: `rec_${Date.now()}_2`,
        category: 'best-practices',
        priority: 'low',
        title: 'Missing License Identifier',
        description: 'Contract should include SPDX license identifier',
        implementation: 'Add // SPDX-License-Identifier: MIT at the top of the file'
      })
    }

    return { recommendations }
  }

  // Find critical vulnerabilities for quick analysis
  private async findCriticalVulnerabilities(code: string): Promise<Vulnerability[]> {
    const criticalPatterns = [
      {
        regex: /selfdestruct\s*\(/g,
        type: 'selfdestruct',
        title: 'Critical: Selfdestruct Usage'
      },
      {
        regex: /\.call\s*\{value:/g,
        type: 'reentrancy',
        title: 'Critical: Potential Reentrancy'
      }
    ]

    const vulnerabilities: Vulnerability[] = []
    const lines = code.split('\n')

    criticalPatterns.forEach(pattern => {
      lines.forEach((line, index) => {
        if (pattern.regex.test(line)) {
          vulnerabilities.push({
            id: `crit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: pattern.type,
            severity: 'critical',
            title: pattern.title,
            description: 'Critical vulnerability detected',
            location: { line: index + 1, column: 0 },
            recommendation: 'Review and fix immediately',
            confidence: 0.9
          })
        }
      })
    })

    return vulnerabilities
  }

  // Find basic gas issues for quick analysis
  private async findBasicGasIssues(code: string): Promise<GasOptimization[]> {
    const gasIssues: GasOptimization[] = []
    
    if (code.includes('uint256') && !code.includes('uint128')) {
      gasIssues.push({
        id: `gas_quick_1`,
        type: 'storage_packing',
        title: 'Storage Optimization Available',
        description: 'Consider using smaller uint types',
        location: { line: 1 },
        estimatedSavings: 2000,
        difficulty: 'easy'
      })
    }

    return gasIssues
  }

  // Helper methods
  private calculateSecurityScore(vulnerabilities: Vulnerability[]): number {
    let score = 100
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': score -= 25; break
        case 'high': score -= 15; break
        case 'medium': score -= 8; break
        case 'low': score -= 3; break
      }
    })
    return Math.max(0, score)
  }

  private calculateGasScore(optimizations: GasOptimization[]): number {
    let score = 100
    const totalSavings = optimizations.reduce((sum, opt) => sum + opt.estimatedSavings, 0)
    score -= Math.min(50, totalSavings / 1000) // Reduce score based on potential savings
    return Math.max(0, Math.round(score))
  }

  private calculateComplexity(code: string): number {
    const lines = code.split('\n').length
    const functions = (code.match(/function\s+\w+/g) || []).length
    const conditionals = (code.match(/if\s*\(|while\s*\(|for\s*\(/g) || []).length
    
    return Math.round((lines + functions * 2 + conditionals * 1.5) / 10)
  }

  private getVulnerabilityRecommendation(type: string): string {
    const recommendations: Record<string, string> = {
      reentrancy: 'Use reentrancy guard or checks-effects-interactions pattern',
      tx_origin: 'Use msg.sender instead of tx.origin for authorization',
      selfdestruct: 'Ensure proper access controls before using selfdestruct',
      delegatecall: 'Validate target address and use with extreme caution'
    }
    return recommendations[type] || 'Review and fix this issue'
  }

  private estimateGasSavings(type: string): number {
    const savings: Record<string, number> = {
      storage_packing: 5000,
      loop_optimization: 2000,
      function_visibility: 1000
    }
    return savings[type] || 500
  }

  private getCreditCost(analysisType: string): number {
    const costs: Record<string, number> = {
      quick: 1,
      security: 2,
      gas: 2,
      comprehensive: 5
    }
    return costs[analysisType] || 1
  }

  // Generate AI summary using OpenAI
  private async generateAISummary(code: string, analysisData: any): Promise<string> {
    try {
      const prompt = `
Analyze this Solidity smart contract and provide a concise summary:

Contract Code:
${code.substring(0, 2000)}...

Analysis Results:
- Security Score: ${analysisData.securityScore || 'N/A'}
- Gas Score: ${analysisData.gasScore || 'N/A'}
- Vulnerabilities Found: ${analysisData.vulnerabilities?.length || 0}
- Gas Optimizations: ${analysisData.gasOptimizations?.length || 0}

Provide a 2-3 sentence summary of the contract's security posture and recommendations.
`

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      })

      return response.choices[0]?.message?.content || 'Analysis completed successfully.'
    } catch (error) {
      console.error('AI summary generation failed:', error)
      return 'Analysis completed. Review the detailed results for security and optimization recommendations.'
    }
  }

  // Database operations
  private async storeAnalysisRecord(analysisId: string, userId: string, status: string, metadata?: any): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          id: analysisId,
          user_id: userId,
          status,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to store analysis record:', error)
    }
  }

  private async storeAnalysisResult(analysisId: string, result: AnalysisResult): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .update({
          status: result.status,
          results: result,
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisId)
    } catch (error) {
      console.error('Failed to store analysis result:', error)
    }
  }

  private async updateUserCredits(userId: string, cost: number): Promise<void> {
    try {
      // Get current credits
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('clerk_user_id', userId)
        .single()

      if (user) {
        const newCredits = Math.max(0, (user.credits || 0) - cost)
        
        await supabase
          .from('users')
          .update({ credits: newCredits })
          .eq('clerk_user_id', userId)

        // Log credit transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'usage',
            amount: -cost,
            balance_after: newCredits,
            description: 'Smart contract analysis',
            reference_type: 'analysis'
          })
      }
    } catch (error) {
      console.error('Failed to update user credits:', error)
    }
  }
}

export default AnalysisService
