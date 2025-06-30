// =============================================
// NOVAGUARD RAG-ENHANCED AI AGENT
// Context-aware AI agent with knowledge retrieval
// =============================================

import OpenAI from 'openai'
import { KnowledgeRetriever, type DocumentType } from '@/lib/rag/knowledge-indexer'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export interface RAGResponse {
  answer: string
  confidence: number
  sources: Array<{
    title: string
    type: DocumentType
    url?: string
    relevance: number
  }>
  reasoning: string
  suggestions?: string[]
}

export interface AnalysisContext {
  contractCode: string
  question: string
  analysisType: 'security' | 'gas_optimization' | 'best_practices' | 'general'
  userLevel: 'beginner' | 'intermediate' | 'advanced'
}

export class RAGEnhancedAgent {
  private retriever: KnowledgeRetriever

  constructor() {
    this.retriever = new KnowledgeRetriever()
  }

  // Main RAG-enhanced analysis function
  async analyzeWithContext(context: AnalysisContext): Promise<RAGResponse> {
    try {
      console.log(`🤖 Starting RAG-enhanced analysis: ${context.analysisType}`)

      // Determine relevant document types based on analysis type
      const relevantTypes = this.getRelevantDocumentTypes(context.analysisType)

      // Retrieve relevant knowledge
      const { context: knowledgeContext, sources } = await this.retriever.getContextForQuestion(
        context.question,
        context.contractCode,
        {
          maxTokens: 6000,
          includeTypes: relevantTypes
        }
      )

      // Generate enhanced prompt
      const prompt = this.buildEnhancedPrompt(context, knowledgeContext)

      // Get AI response
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(context.analysisType, context.userLevel)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const aiResponse = response.choices[0]?.message?.content || ''

      // Parse and structure the response
      const structuredResponse = this.parseAIResponse(aiResponse, sources)

      console.log(`✅ RAG-enhanced analysis complete`)
      return structuredResponse

    } catch (error) {
      console.error('❌ RAG-enhanced analysis failed:', error)
      throw new Error('Failed to perform RAG-enhanced analysis')
    }
  }

  // Get relevant document types for analysis
  private getRelevantDocumentTypes(analysisType: string): DocumentType[] {
    switch (analysisType) {
      case 'security':
        return [
          'security_best_practices',
          'vulnerability_database',
          'audit_playbooks',
          'openzeppelin_contracts'
        ]
      case 'gas_optimization':
        return [
          'gas_optimization_patterns',
          'solidity_docs',
          'openzeppelin_contracts'
        ]
      case 'best_practices':
        return [
          'security_best_practices',
          'solidity_docs',
          'openzeppelin_contracts',
          'eip_standards'
        ]
      default:
        return [
          'solidity_docs',
          'openzeppelin_contracts',
          'security_best_practices',
          'gas_optimization_patterns'
        ]
    }
  }

  // Build enhanced prompt with context
  private buildEnhancedPrompt(context: AnalysisContext, knowledgeContext: string): string {
    return `
ANALYSIS REQUEST:
Type: ${context.analysisType}
User Level: ${context.userLevel}
Question: ${context.question}

CONTRACT CODE:
\`\`\`solidity
${context.contractCode}
\`\`\`

RELEVANT KNOWLEDGE CONTEXT:
${knowledgeContext}

INSTRUCTIONS:
1. Analyze the contract code in the context of the question
2. Use the provided knowledge context to inform your analysis
3. Provide specific, actionable recommendations
4. Include code examples where helpful
5. Explain your reasoning clearly
6. Adjust complexity based on user level (${context.userLevel})
7. Cite relevant sources from the knowledge context

Please provide a comprehensive analysis addressing the question with specific reference to the contract code and knowledge context.
    `.trim()
  }

  // Get system prompt based on analysis type and user level
  private getSystemPrompt(analysisType: string, userLevel: string): string {
    const basePrompt = `You are NovaGuard AI, an expert smart contract security auditor and Solidity developer. You have access to comprehensive knowledge about smart contract security, gas optimization, and best practices.`

    const typeSpecificPrompts = {
      security: `Focus on identifying security vulnerabilities, attack vectors, and providing secure coding recommendations. Be thorough in your security analysis and provide specific mitigation strategies.`,
      gas_optimization: `Focus on identifying gas inefficiencies and providing optimization recommendations. Analyze storage usage, function efficiency, and suggest specific improvements with estimated gas savings.`,
      best_practices: `Focus on code quality, maintainability, and adherence to Solidity best practices. Provide recommendations for better code structure, naming conventions, and development patterns.`,
      general: `Provide comprehensive analysis covering security, gas optimization, and best practices. Balance all aspects of smart contract development.`
    }

    const levelSpecificPrompts = {
      beginner: `Explain concepts clearly with educational context. Provide step-by-step explanations and include learning resources.`,
      intermediate: `Provide detailed technical analysis with moderate complexity. Include implementation examples and best practice references.`,
      advanced: `Provide in-depth technical analysis with advanced concepts. Focus on edge cases, complex attack vectors, and sophisticated optimization techniques.`
    }

    return `${basePrompt}

${typeSpecificPrompts[analysisType as keyof typeof typeSpecificPrompts] || typeSpecificPrompts.general}

${levelSpecificPrompts[userLevel as keyof typeof levelSpecificPrompts] || levelSpecificPrompts.intermediate}

Always structure your response with:
1. Executive Summary
2. Detailed Analysis
3. Specific Recommendations
4. Code Examples (when applicable)
5. Additional Resources

Be precise, actionable, and reference the provided knowledge context when relevant.`
  }

  // Parse AI response into structured format
  private parseAIResponse(aiResponse: string, sources: any[]): RAGResponse {
    // Extract confidence level (simple heuristic)
    const confidence = this.calculateConfidence(aiResponse, sources.length)

    // Extract suggestions (look for numbered lists or bullet points)
    const suggestions = this.extractSuggestions(aiResponse)

    // Generate reasoning summary
    const reasoning = this.extractReasoning(aiResponse)

    return {
      answer: aiResponse,
      confidence,
      sources: sources.map(source => ({
        title: source.title,
        type: source.type,
        url: source.url,
        relevance: 0.8 // Default relevance score
      })),
      reasoning,
      suggestions
    }
  }

  // Calculate confidence based on response quality and source availability
  private calculateConfidence(response: string, sourceCount: number): number {
    let confidence = 0.5 // Base confidence

    // Increase confidence based on response length and detail
    if (response.length > 500) confidence += 0.1
    if (response.length > 1000) confidence += 0.1

    // Increase confidence based on available sources
    confidence += Math.min(sourceCount * 0.05, 0.3)

    // Increase confidence if response contains code examples
    if (response.includes('```')) confidence += 0.1

    // Increase confidence if response contains specific recommendations
    if (response.toLowerCase().includes('recommend')) confidence += 0.05

    return Math.min(confidence, 0.95) // Cap at 95%
  }

  // Extract suggestions from AI response
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = []
    
    // Look for numbered lists
    const numberedMatches = response.match(/^\d+\.\s+(.+)$/gm)
    if (numberedMatches) {
      suggestions.push(...numberedMatches.map(match => match.replace(/^\d+\.\s+/, '')))
    }

    // Look for bullet points
    const bulletMatches = response.match(/^[-*]\s+(.+)$/gm)
    if (bulletMatches) {
      suggestions.push(...bulletMatches.map(match => match.replace(/^[-*]\s+/, '')))
    }

    return suggestions.slice(0, 5) // Limit to 5 suggestions
  }

  // Extract reasoning from AI response
  private extractReasoning(response: string): string {
    // Look for reasoning sections
    const reasoningPatterns = [
      /reasoning[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is,
      /because[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is,
      /analysis[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is
    ]

    for (const pattern of reasoningPatterns) {
      const match = response.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // Fallback: use first paragraph as reasoning
    const firstParagraph = response.split('\n\n')[0]
    return firstParagraph.length > 50 ? firstParagraph : 'Analysis based on smart contract best practices and security patterns.'
  }

  // Quick security scan with RAG
  async quickSecurityScan(contractCode: string): Promise<{
    criticalIssues: string[]
    warnings: string[]
    suggestions: string[]
    overallRisk: 'low' | 'medium' | 'high' | 'critical'
  }> {
    const context: AnalysisContext = {
      contractCode,
      question: 'Perform a comprehensive security analysis of this smart contract. Identify vulnerabilities, security issues, and provide recommendations.',
      analysisType: 'security',
      userLevel: 'intermediate'
    }

    const response = await this.analyzeWithContext(context)

    // Parse response for security-specific format
    const criticalIssues = this.extractIssuesByType(response.answer, 'critical')
    const warnings = this.extractIssuesByType(response.answer, 'warning')
    const overallRisk = this.assessOverallRisk(criticalIssues, warnings)

    return {
      criticalIssues,
      warnings,
      suggestions: response.suggestions || [],
      overallRisk
    }
  }

  // Extract issues by severity type
  private extractIssuesByType(response: string, type: 'critical' | 'warning'): string[] {
    const issues: string[] = []
    const patterns = {
      critical: /critical[:\s]+(.*?)(?=\n\n|\nwarning|\n[A-Z]|$)/gis,
      warning: /warning[:\s]+(.*?)(?=\n\n|\ncritical|\n[A-Z]|$)/gis
    }

    const matches = response.match(patterns[type])
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.replace(/^(critical|warning)[:\s]+/i, '').trim()
        if (cleanMatch) issues.push(cleanMatch)
      })
    }

    return issues
  }

  // Assess overall risk level
  private assessOverallRisk(criticalIssues: string[], warnings: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (criticalIssues.length > 0) return 'critical'
    if (warnings.length >= 3) return 'high'
    if (warnings.length >= 1) return 'medium'
    return 'low'
  }

  // Gas optimization analysis with RAG
  async analyzeGasOptimization(contractCode: string): Promise<{
    optimizations: Array<{
      type: string
      description: string
      estimatedSavings: string
      codeExample?: string
    }>
    totalEstimatedSavings: string
  }> {
    const context: AnalysisContext = {
      contractCode,
      question: 'Analyze this smart contract for gas optimization opportunities. Provide specific optimizations with estimated gas savings.',
      analysisType: 'gas_optimization',
      userLevel: 'intermediate'
    }

    const response = await this.analyzeWithContext(context)

    // Parse response for gas optimization format
    const optimizations = this.extractGasOptimizations(response.answer)
    const totalEstimatedSavings = this.calculateTotalSavings(optimizations)

    return {
      optimizations,
      totalEstimatedSavings
    }
  }

  // Extract gas optimizations from response
  private extractGasOptimizations(response: string): Array<{
    type: string
    description: string
    estimatedSavings: string
    codeExample?: string
  }> {
    const optimizations: Array<{
      type: string
      description: string
      estimatedSavings: string
      codeExample?: string
    }> = []

    // This is a simplified extraction - in practice, you'd want more sophisticated parsing
    const sections = response.split(/\n(?=\d+\.|\*|-)/g)
    
    sections.forEach(section => {
      if (section.trim()) {
        const lines = section.split('\n')
        const title = lines[0]?.replace(/^\d+\.\s*|\*\s*|-\s*/, '').trim()
        
        if (title) {
          optimizations.push({
            type: this.categorizeOptimization(title),
            description: title,
            estimatedSavings: this.extractSavings(section),
            codeExample: this.extractCodeExample(section)
          })
        }
      }
    })

    return optimizations.slice(0, 10) // Limit to 10 optimizations
  }

  // Categorize optimization type
  private categorizeOptimization(description: string): string {
    const categories = {
      'storage': ['storage', 'variable', 'struct', 'mapping'],
      'loop': ['loop', 'iteration', 'array'],
      'function': ['function', 'modifier', 'external', 'public'],
      'gas': ['gas', 'optimization', 'efficient']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => description.toLowerCase().includes(keyword))) {
        return category
      }
    }

    return 'general'
  }

  // Extract gas savings from text
  private extractSavings(text: string): string {
    const savingsMatch = text.match(/(\d+(?:,\d+)*)\s*gas/i)
    return savingsMatch ? `${savingsMatch[1]} gas` : 'Variable'
  }

  // Extract code example from text
  private extractCodeExample(text: string): string | undefined {
    const codeMatch = text.match(/```[\s\S]*?```/)
    return codeMatch ? codeMatch[0] : undefined
  }

  // Calculate total estimated savings
  private calculateTotalSavings(optimizations: Array<{ estimatedSavings: string }>): string {
    let total = 0
    let hasVariable = false

    optimizations.forEach(opt => {
      const match = opt.estimatedSavings.match(/(\d+(?:,\d+)*)\s*gas/)
      if (match) {
        total += parseInt(match[1].replace(/,/g, ''))
      } else {
        hasVariable = true
      }
    })

    if (hasVariable) {
      return total > 0 ? `${total.toLocaleString()}+ gas` : 'Variable'
    }

    return `${total.toLocaleString()} gas`
  }
}

export default RAGEnhancedAgent
