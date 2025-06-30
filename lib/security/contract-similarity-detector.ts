// =============================================
// NOVAGUARD CONTRACT SIMILARITY DETECTOR
// Advanced contract similarity detection and clone analysis
// =============================================

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { ethers } from 'ethers'

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export interface SimilarityMatch {
  id: string
  contractAddress: string
  contractName: string
  similarity: number
  matchType: 'exact' | 'high' | 'medium' | 'low'
  matchedFunctions: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  description: string
  sourceCode?: string
  deploymentDate?: Date
  chain: string
}

export interface SimilarityAnalysis {
  targetContract: {
    code: string
    hash: string
    functions: string[]
    complexity: number
  }
  matches: SimilarityMatch[]
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical'
    cloneRisk: number
    uniquenessScore: number
    recommendations: string[]
  }
  metadata: {
    analysisTime: number
    totalContracts: number
    timestamp: Date
  }
}

export class ContractSimilarityDetector {
  // Analyze contract similarity against known contracts
  async analyzeContractSimilarity(
    contractCode: string,
    options: {
      threshold?: number
      includeDeployed?: boolean
      chains?: string[]
      maxResults?: number
    } = {}
  ): Promise<SimilarityAnalysis> {
    const startTime = Date.now()
    
    try {
      console.log('🔍 Starting contract similarity analysis...')

      // Extract contract features
      const targetContract = await this.extractContractFeatures(contractCode)
      
      // Find similar contracts
      const matches = await this.findSimilarContracts(
        targetContract,
        options.threshold || 0.7,
        options.maxResults || 20
      )

      // Assess risk
      const riskAssessment = this.assessSimilarityRisk(matches, targetContract)

      const analysis: SimilarityAnalysis = {
        targetContract,
        matches,
        riskAssessment,
        metadata: {
          analysisTime: Date.now() - startTime,
          totalContracts: matches.length,
          timestamp: new Date()
        }
      }

      // Store analysis results
      await this.storeSimilarityAnalysis(analysis)

      console.log(`✅ Similarity analysis completed: ${matches.length} matches found`)
      return analysis

    } catch (error) {
      console.error('❌ Contract similarity analysis failed:', error)
      throw error
    }
  }

  // Extract contract features for comparison
  private async extractContractFeatures(contractCode: string) {
    try {
      // Generate code hash
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(contractCode))

      // Extract function signatures
      const functions = this.extractFunctionSignatures(contractCode)

      // Calculate complexity metrics
      const complexity = this.calculateComplexity(contractCode)

      // Generate semantic embedding
      const embedding = await this.generateCodeEmbedding(contractCode)

      return {
        code: contractCode,
        hash: codeHash,
        functions,
        complexity,
        embedding
      }

    } catch (error) {
      console.error('Error extracting contract features:', error)
      throw error
    }
  }

  // Extract function signatures from contract code
  private extractFunctionSignatures(contractCode: string): string[] {
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)/g
    const functions: string[] = []
    let match

    while ((match = functionRegex.exec(contractCode)) !== null) {
      functions.push(match[1])
    }

    return functions
  }

  // Calculate contract complexity
  private calculateComplexity(contractCode: string): number {
    const lines = contractCode.split('\n').length
    const functions = (contractCode.match(/function\s+\w+/g) || []).length
    const conditionals = (contractCode.match(/if\s*\(|while\s*\(|for\s*\(/g) || []).length
    const externalCalls = (contractCode.match(/\.call\(|\.delegatecall\(|\.staticcall\(/g) || []).length
    
    return Math.round((lines + functions * 2 + conditionals * 1.5 + externalCalls * 3) / 10)
  }

  // Generate semantic embedding for code
  private async generateCodeEmbedding(contractCode: string): Promise<number[]> {
    try {
      // Truncate code if too long
      const truncatedCode = contractCode.length > 8000 
        ? contractCode.substring(0, 8000) + '...'
        : contractCode

      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: `Solidity smart contract code:\n${truncatedCode}`
      })

      return response.data[0].embedding

    } catch (error) {
      console.error('Error generating code embedding:', error)
      return []
    }
  }

  // Find similar contracts using multiple comparison methods
  private async findSimilarContracts(
    targetContract: any,
    threshold: number,
    maxResults: number
  ): Promise<SimilarityMatch[]> {
    const matches: SimilarityMatch[] = []

    try {
      // 1. Exact hash match
      const exactMatches = await this.findExactMatches(targetContract.hash)
      matches.push(...exactMatches)

      // 2. Function signature similarity
      const functionMatches = await this.findFunctionSimilarity(
        targetContract.functions,
        threshold
      )
      matches.push(...functionMatches)

      // 3. Semantic similarity using embeddings
      if (targetContract.embedding.length > 0) {
        const semanticMatches = await this.findSemanticSimilarity(
          targetContract.embedding,
          threshold
        )
        matches.push(...semanticMatches)
      }

      // 4. Known vulnerability patterns
      const vulnerabilityMatches = await this.findVulnerabilityPatterns(
        targetContract.code
      )
      matches.push(...vulnerabilityMatches)

      // Remove duplicates and sort by similarity
      const uniqueMatches = this.deduplicateMatches(matches)
      return uniqueMatches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults)

    } catch (error) {
      console.error('Error finding similar contracts:', error)
      return []
    }
  }

  // Find exact hash matches
  private async findExactMatches(codeHash: string): Promise<SimilarityMatch[]> {
    try {
      const { data, error } = await supabase
        .from('known_contracts')
        .select('*')
        .eq('code_hash', codeHash)

      if (error) throw error

      return (data || []).map(contract => ({
        id: contract.id,
        contractAddress: contract.address,
        contractName: contract.name || 'Unknown',
        similarity: 1.0,
        matchType: 'exact' as const,
        matchedFunctions: [],
        riskLevel: 'critical' as const,
        description: 'Exact code match detected - potential clone or redeployment',
        sourceCode: contract.source_code,
        deploymentDate: contract.deployed_at ? new Date(contract.deployed_at) : undefined,
        chain: contract.chain
      }))

    } catch (error) {
      console.error('Error finding exact matches:', error)
      return []
    }
  }

  // Find contracts with similar function signatures
  private async findFunctionSimilarity(
    targetFunctions: string[],
    threshold: number
  ): Promise<SimilarityMatch[]> {
    try {
      const { data, error } = await supabase
        .from('known_contracts')
        .select('*')
        .not('function_signatures', 'is', null)

      if (error) throw error

      const matches: SimilarityMatch[] = []

      for (const contract of data || []) {
        const contractFunctions = contract.function_signatures || []
        const similarity = this.calculateFunctionSimilarity(targetFunctions, contractFunctions)
        
        if (similarity >= threshold) {
          const matchedFunctions = targetFunctions.filter(fn => 
            contractFunctions.includes(fn)
          )

          matches.push({
            id: contract.id,
            contractAddress: contract.address,
            contractName: contract.name || 'Unknown',
            similarity,
            matchType: similarity > 0.9 ? 'high' : similarity > 0.8 ? 'medium' : 'low',
            matchedFunctions,
            riskLevel: similarity > 0.9 ? 'high' : similarity > 0.8 ? 'medium' : 'low',
            description: `${Math.round(similarity * 100)}% function signature similarity`,
            sourceCode: contract.source_code,
            deploymentDate: contract.deployed_at ? new Date(contract.deployed_at) : undefined,
            chain: contract.chain
          })
        }
      }

      return matches

    } catch (error) {
      console.error('Error finding function similarity:', error)
      return []
    }
  }

  // Find semantically similar contracts using embeddings
  private async findSemanticSimilarity(
    targetEmbedding: number[],
    threshold: number
  ): Promise<SimilarityMatch[]> {
    try {
      // Use Supabase vector similarity search
      const { data, error } = await supabase.rpc('match_similar_contracts', {
        query_embedding: targetEmbedding,
        match_threshold: threshold,
        match_count: 10
      })

      if (error) throw error

      return (data || []).map((contract: any) => ({
        id: contract.id,
        contractAddress: contract.address,
        contractName: contract.name || 'Unknown',
        similarity: contract.similarity,
        matchType: contract.similarity > 0.9 ? 'high' : contract.similarity > 0.8 ? 'medium' : 'low',
        matchedFunctions: [],
        riskLevel: contract.similarity > 0.9 ? 'high' : contract.similarity > 0.8 ? 'medium' : 'low',
        description: `${Math.round(contract.similarity * 100)}% semantic similarity`,
        sourceCode: contract.source_code,
        deploymentDate: contract.deployed_at ? new Date(contract.deployed_at) : undefined,
        chain: contract.chain
      }))

    } catch (error) {
      console.error('Error finding semantic similarity:', error)
      return []
    }
  }

  // Find contracts with known vulnerability patterns
  private async findVulnerabilityPatterns(contractCode: string): Promise<SimilarityMatch[]> {
    const vulnerabilityPatterns = [
      {
        name: 'Reentrancy Pattern',
        pattern: /\.call\s*\{value:/,
        riskLevel: 'critical' as const
      },
      {
        name: 'Unchecked External Call',
        pattern: /\.call\s*\(/,
        riskLevel: 'high' as const
      },
      {
        name: 'tx.origin Usage',
        pattern: /tx\.origin/,
        riskLevel: 'medium' as const
      },
      {
        name: 'Selfdestruct Usage',
        pattern: /selfdestruct\s*\(/,
        riskLevel: 'high' as const
      }
    ]

    const matches: SimilarityMatch[] = []

    for (const pattern of vulnerabilityPatterns) {
      if (pattern.pattern.test(contractCode)) {
        matches.push({
          id: `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contractAddress: 'N/A',
          contractName: pattern.name,
          similarity: 0.8,
          matchType: 'medium',
          matchedFunctions: [],
          riskLevel: pattern.riskLevel,
          description: `Contains ${pattern.name} - known vulnerability pattern`,
          chain: 'pattern'
        })
      }
    }

    return matches
  }

  // Calculate function signature similarity
  private calculateFunctionSimilarity(functions1: string[], functions2: string[]): number {
    if (functions1.length === 0 && functions2.length === 0) return 1.0
    if (functions1.length === 0 || functions2.length === 0) return 0.0

    const set1 = new Set(functions1)
    const set2 = new Set(functions2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }

  // Remove duplicate matches
  private deduplicateMatches(matches: SimilarityMatch[]): SimilarityMatch[] {
    const seen = new Set<string>()
    return matches.filter(match => {
      const key = `${match.contractAddress}_${match.contractName}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // Assess overall risk from similarity matches
  private assessSimilarityRisk(matches: SimilarityMatch[], targetContract: any) {
    const exactMatches = matches.filter(m => m.matchType === 'exact').length
    const highMatches = matches.filter(m => m.matchType === 'high').length
    const criticalRiskMatches = matches.filter(m => m.riskLevel === 'critical').length

    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let cloneRisk = 0
    let uniquenessScore = 100

    if (exactMatches > 0) {
      overallRisk = 'critical'
      cloneRisk = 100
      uniquenessScore = 0
    } else if (criticalRiskMatches > 0 || highMatches > 2) {
      overallRisk = 'high'
      cloneRisk = 80
      uniquenessScore = 20
    } else if (highMatches > 0 || matches.length > 5) {
      overallRisk = 'medium'
      cloneRisk = 50
      uniquenessScore = 50
    } else {
      cloneRisk = Math.min(matches.length * 10, 30)
      uniquenessScore = Math.max(70, 100 - matches.length * 5)
    }

    const recommendations: string[] = []

    if (exactMatches > 0) {
      recommendations.push('⚠️ Exact code match detected - verify originality and licensing')
    }
    if (criticalRiskMatches > 0) {
      recommendations.push('🚨 Critical vulnerability patterns found - immediate review required')
    }
    if (highMatches > 2) {
      recommendations.push('⚡ High similarity to multiple contracts - consider code uniqueness')
    }
    if (matches.length > 10) {
      recommendations.push('📊 Many similar contracts found - ensure proper attribution')
    }
    if (recommendations.length === 0) {
      recommendations.push('✅ Contract appears to be unique with low similarity risk')
    }

    return {
      overallRisk,
      cloneRisk,
      uniquenessScore,
      recommendations
    }
  }

  // Store similarity analysis results
  private async storeSimilarityAnalysis(analysis: SimilarityAnalysis): Promise<void> {
    try {
      await supabase
        .from('similarity_analyses')
        .insert({
          target_hash: analysis.targetContract.hash,
          matches: analysis.matches,
          risk_assessment: analysis.riskAssessment,
          metadata: analysis.metadata,
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error storing similarity analysis:', error)
    }
  }

  // Add contract to known contracts database
  async addKnownContract(
    contractAddress: string,
    sourceCode: string,
    metadata: {
      name?: string
      chain: string
      deployedAt?: Date
      verified?: boolean
    }
  ): Promise<void> {
    try {
      const features = await this.extractContractFeatures(sourceCode)

      await supabase
        .from('known_contracts')
        .insert({
          address: contractAddress.toLowerCase(),
          name: metadata.name,
          chain: metadata.chain,
          source_code: sourceCode,
          code_hash: features.hash,
          function_signatures: features.functions,
          complexity: features.complexity,
          embedding: features.embedding,
          deployed_at: metadata.deployedAt?.toISOString(),
          verified: metadata.verified || false,
          created_at: new Date().toISOString()
        })

      console.log(`✅ Added contract ${contractAddress} to known contracts database`)

    } catch (error) {
      console.error('Error adding known contract:', error)
      throw error
    }
  }

  // Get similarity analysis history
  async getSimilarityHistory(limit: number = 50): Promise<SimilarityAnalysis[]> {
    try {
      const { data, error } = await supabase
        .from('similarity_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(item => ({
        targetContract: {
          code: '',
          hash: item.target_hash,
          functions: [],
          complexity: 0
        },
        matches: item.matches,
        riskAssessment: item.risk_assessment,
        metadata: item.metadata
      }))

    } catch (error) {
      console.error('Error getting similarity history:', error)
      return []
    }
  }
}

export default ContractSimilarityDetector
