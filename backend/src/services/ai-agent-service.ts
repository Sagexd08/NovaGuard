import { EventEmitter } from 'events'
import { Logger } from 'winston'
import { Redis } from 'ioredis'
import OpenAI from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'

// AI Agent interfaces
export interface AIAgent {
  id: string
  name: string
  type: AgentType
  model: string
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  capabilities: AgentCapability[]
  specialization: string[]
  configuration: AgentConfiguration
  status: 'active' | 'inactive' | 'training' | 'error'
  metrics: AgentMetrics
  createdAt: Date
  updatedAt: Date
}

export type AgentType = 
  | 'security-auditor'
  | 'gas-optimizer'
  | 'code-reviewer'
  | 'vulnerability-scanner'
  | 'compliance-checker'
  | 'performance-analyzer'
  | 'documentation-generator'
  | 'test-generator'
  | 'refactoring-assistant'
  | 'deployment-advisor'

export type AgentCapability = 
  | 'static-analysis'
  | 'dynamic-analysis'
  | 'formal-verification'
  | 'pattern-recognition'
  | 'code-generation'
  | 'documentation'
  | 'testing'
  | 'optimization'
  | 'security-assessment'
  | 'compliance-validation'

export interface AgentConfiguration {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  systemPrompt: string
  contextWindow: number
  responseFormat: 'text' | 'json' | 'structured'
  tools: string[]
  knowledgeBase: string[]
  customInstructions: string[]
}

export interface AgentMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  accuracyScore: number
  userSatisfaction: number
  tokensUsed: number
  costIncurred: number
  lastUsed: Date
}

export interface AgentRequest {
  id: string
  agentId: string
  userId: string
  type: RequestType
  input: AgentInput
  context: RequestContext
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timeout: number
  createdAt: Date
}

export type RequestType = 
  | 'analyze-security'
  | 'optimize-gas'
  | 'review-code'
  | 'generate-tests'
  | 'check-compliance'
  | 'explain-code'
  | 'suggest-improvements'
  | 'generate-documentation'
  | 'find-vulnerabilities'
  | 'assess-risk'

export interface AgentInput {
  sourceCode?: string
  contractAddress?: string
  blockchain?: string
  language?: string
  framework?: string
  query?: string
  files?: FileInput[]
  metadata?: Record<string, any>
}

export interface FileInput {
  name: string
  content: string
  type: string
  path: string
}

export interface RequestContext {
  projectId?: string
  sessionId?: string
  previousRequests?: string[]
  userPreferences?: Record<string, any>
  environmentInfo?: Record<string, any>
}

export interface AgentResponse {
  id: string
  requestId: string
  agentId: string
  status: 'success' | 'error' | 'timeout'
  result: AgentResult
  confidence: number
  executionTime: number
  tokensUsed: number
  cost: number
  metadata: Record<string, any>
  createdAt: Date
}

export interface AgentResult {
  type: string
  content: string
  structured?: any
  findings?: SecurityFinding[]
  suggestions?: Suggestion[]
  explanations?: Explanation[]
  code?: GeneratedCode[]
  documentation?: Documentation[]
  tests?: GeneratedTest[]
  metrics?: Record<string, number>
}

export interface SecurityFinding {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  location: string
  impact: string
  recommendation: string
  confidence: number
  references: string[]
}

export interface Suggestion {
  id: string
  type: 'optimization' | 'refactoring' | 'best-practice' | 'security'
  title: string
  description: string
  before: string
  after: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  confidence: number
}

export interface Explanation {
  id: string
  topic: string
  content: string
  complexity: 'beginner' | 'intermediate' | 'advanced'
  examples: string[]
  references: string[]
}

export interface GeneratedCode {
  id: string
  type: 'function' | 'contract' | 'test' | 'script'
  name: string
  code: string
  language: string
  description: string
  dependencies: string[]
}

export interface Documentation {
  id: string
  type: 'api' | 'guide' | 'tutorial' | 'reference'
  title: string
  content: string
  format: 'markdown' | 'html' | 'json'
  sections: DocumentationSection[]
}

export interface DocumentationSection {
  title: string
  content: string
  level: number
  examples?: string[]
}

export interface GeneratedTest {
  id: string
  type: 'unit' | 'integration' | 'e2e' | 'security'
  name: string
  code: string
  framework: string
  description: string
  coverage: string[]
}

export class AIAgentService extends EventEmitter {
  private redis: Redis
  private logger: Logger
  private openai: OpenAI
  private anthropic: Anthropic
  private agents: Map<string, AIAgent> = new Map()
  private activeRequests: Map<string, AgentRequest> = new Map()

  constructor(
    redis: Redis,
    logger: Logger,
    config: {
      openaiApiKey?: string
      anthropicApiKey?: string
      googleApiKey?: string
    }
  ) {
    super()
    this.redis = redis
    this.logger = logger

    if (config.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey })
    }

    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey })
    }

    this.initializeAgents()
  }

  private initializeAgents(): void {
    // Security Auditor Agent
    this.registerAgent({
      id: 'security-auditor-gpt4',
      name: 'Security Auditor GPT-4',
      type: 'security-auditor',
      model: 'gpt-4-turbo-preview',
      provider: 'openai',
      capabilities: ['static-analysis', 'pattern-recognition', 'security-assessment'],
      specialization: ['smart-contracts', 'defi', 'nft', 'dao'],
      configuration: {
        temperature: 0.1,
        maxTokens: 4000,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        systemPrompt: this.getSecurityAuditorPrompt(),
        contextWindow: 128000,
        responseFormat: 'json',
        tools: ['static-analyzer', 'vulnerability-db', 'pattern-matcher'],
        knowledgeBase: ['owasp-top10', 'smart-contract-weaknesses', 'defi-attacks'],
        customInstructions: [],
      },
      status: 'active',
      metrics: this.initializeMetrics(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Gas Optimizer Agent
    this.registerAgent({
      id: 'gas-optimizer-claude',
      name: 'Gas Optimizer Claude',
      type: 'gas-optimizer',
      model: 'claude-3-opus-20240229',
      provider: 'anthropic',
      capabilities: ['static-analysis', 'optimization', 'code-generation'],
      specialization: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
      configuration: {
        temperature: 0.2,
        maxTokens: 3000,
        topP: 0.95,
        frequencyPenalty: 0,
        presencePenalty: 0,
        systemPrompt: this.getGasOptimizerPrompt(),
        contextWindow: 200000,
        responseFormat: 'structured',
        tools: ['gas-analyzer', 'optimizer', 'code-generator'],
        knowledgeBase: ['evm-opcodes', 'gas-patterns', 'optimization-techniques'],
        customInstructions: [],
      },
      status: 'active',
      metrics: this.initializeMetrics(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Code Reviewer Agent
    this.registerAgent({
      id: 'code-reviewer-gpt4',
      name: 'Code Reviewer GPT-4',
      type: 'code-reviewer',
      model: 'gpt-4-turbo-preview',
      provider: 'openai',
      capabilities: ['static-analysis', 'pattern-recognition', 'documentation'],
      specialization: ['solidity', 'rust', 'move', 'go'],
      configuration: {
        temperature: 0.3,
        maxTokens: 3500,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1,
        systemPrompt: this.getCodeReviewerPrompt(),
        contextWindow: 128000,
        responseFormat: 'structured',
        tools: ['linter', 'formatter', 'complexity-analyzer'],
        knowledgeBase: ['coding-standards', 'best-practices', 'design-patterns'],
        customInstructions: [],
      },
      status: 'active',
      metrics: this.initializeMetrics(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  private registerAgent(agent: AIAgent): void {
    this.agents.set(agent.id, agent)
    this.logger.info(`Registered AI agent: ${agent.name}`)
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      this.logger.info(`Processing AI agent request: ${request.id}`)
      this.activeRequests.set(request.id, request)

      const agent = this.agents.get(request.agentId)
      if (!agent) {
        throw new Error(`Agent not found: ${request.agentId}`)
      }

      // Validate request
      this.validateRequest(request, agent)

      // Process based on agent provider
      let result: AgentResult
      let tokensUsed = 0
      let cost = 0

      switch (agent.provider) {
        case 'openai':
          const openaiResult = await this.processOpenAIRequest(agent, request)
          result = openaiResult.result
          tokensUsed = openaiResult.tokensUsed
          cost = openaiResult.cost
          break

        case 'anthropic':
          const anthropicResult = await this.processAnthropicRequest(agent, request)
          result = anthropicResult.result
          tokensUsed = anthropicResult.tokensUsed
          cost = anthropicResult.cost
          break

        default:
          throw new Error(`Unsupported provider: ${agent.provider}`)
      }

      const executionTime = Date.now() - startTime

      // Create response
      const response: AgentResponse = {
        id: `response_${request.id}`,
        requestId: request.id,
        agentId: request.agentId,
        status: 'success',
        result,
        confidence: this.calculateConfidence(result),
        executionTime,
        tokensUsed,
        cost,
        metadata: {
          model: agent.model,
          provider: agent.provider,
          requestType: request.type,
        },
        createdAt: new Date(),
      }

      // Update agent metrics
      await this.updateAgentMetrics(agent.id, {
        tokensUsed,
        cost,
        executionTime,
        success: true,
      })

      // Store response
      await this.storeResponse(response)

      this.activeRequests.delete(request.id)
      this.emit('request:completed', response)

      return response
    } catch (error) {
      const executionTime = Date.now() - startTime
      
      this.logger.error(`AI agent request failed: ${request.id}`, error)
      this.activeRequests.delete(request.id)

      const errorResponse: AgentResponse = {
        id: `response_${request.id}`,
        requestId: request.id,
        agentId: request.agentId,
        status: 'error',
        result: {
          type: 'error',
          content: error instanceof Error ? error.message : 'Unknown error',
        },
        confidence: 0,
        executionTime,
        tokensUsed: 0,
        cost: 0,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        createdAt: new Date(),
      }

      await this.updateAgentMetrics(request.agentId, {
        tokensUsed: 0,
        cost: 0,
        executionTime,
        success: false,
      })

      this.emit('request:failed', errorResponse)
      return errorResponse
    }
  }

  private async processOpenAIRequest(
    agent: AIAgent,
    request: AgentRequest
  ): Promise<{ result: AgentResult; tokensUsed: number; cost: number }> {
    const messages = this.buildOpenAIMessages(agent, request)
    
    const completion = await this.openai.chat.completions.create({
      model: agent.model,
      messages,
      temperature: agent.configuration.temperature,
      max_tokens: agent.configuration.maxTokens,
      top_p: agent.configuration.topP,
      frequency_penalty: agent.configuration.frequencyPenalty,
      presence_penalty: agent.configuration.presencePenalty,
      response_format: agent.configuration.responseFormat === 'json' 
        ? { type: 'json_object' } 
        : undefined,
    })

    const content = completion.choices[0]?.message?.content || ''
    const tokensUsed = completion.usage?.total_tokens || 0
    const cost = this.calculateOpenAICost(agent.model, tokensUsed)

    let result: AgentResult
    if (agent.configuration.responseFormat === 'json') {
      try {
        const parsed = JSON.parse(content)
        result = this.transformOpenAIResponse(request.type, parsed)
      } catch {
        result = { type: 'text', content }
      }
    } else {
      result = { type: 'text', content }
    }

    return { result, tokensUsed, cost }
  }

  private async processAnthropicRequest(
    agent: AIAgent,
    request: AgentRequest
  ): Promise<{ result: AgentResult; tokensUsed: number; cost: number }> {
    const prompt = this.buildAnthropicPrompt(agent, request)
    
    const completion = await this.anthropic.messages.create({
      model: agent.model,
      max_tokens: agent.configuration.maxTokens,
      temperature: agent.configuration.temperature,
      top_p: agent.configuration.topP,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = completion.content[0]?.type === 'text' 
      ? completion.content[0].text 
      : ''
    const tokensUsed = completion.usage.input_tokens + completion.usage.output_tokens
    const cost = this.calculateAnthropicCost(agent.model, tokensUsed)

    const result: AgentResult = { type: 'text', content }

    return { result, tokensUsed, cost }
  }

  private buildOpenAIMessages(agent: AIAgent, request: AgentRequest): any[] {
    const messages = [
      {
        role: 'system',
        content: agent.configuration.systemPrompt,
      },
      {
        role: 'user',
        content: this.formatRequestForOpenAI(request),
      },
    ]

    return messages
  }

  private buildAnthropicPrompt(agent: AIAgent, request: AgentRequest): string {
    return `${agent.configuration.systemPrompt}\n\nUser Request:\n${this.formatRequestForAnthropic(request)}`
  }

  private formatRequestForOpenAI(request: AgentRequest): string {
    let content = `Request Type: ${request.type}\n\n`
    
    if (request.input.sourceCode) {
      content += `Source Code:\n\`\`\`${request.input.language || 'solidity'}\n${request.input.sourceCode}\n\`\`\`\n\n`
    }
    
    if (request.input.query) {
      content += `Query: ${request.input.query}\n\n`
    }
    
    if (request.input.blockchain) {
      content += `Blockchain: ${request.input.blockchain}\n\n`
    }

    return content
  }

  private formatRequestForAnthropic(request: AgentRequest): string {
    return this.formatRequestForOpenAI(request) // Same format for now
  }

  private transformOpenAIResponse(requestType: RequestType, parsed: any): AgentResult {
    // Transform based on request type
    switch (requestType) {
      case 'analyze-security':
        return {
          type: 'security-analysis',
          content: parsed.summary || '',
          findings: parsed.findings || [],
          structured: parsed,
        }
      
      case 'optimize-gas':
        return {
          type: 'gas-optimization',
          content: parsed.summary || '',
          suggestions: parsed.optimizations || [],
          structured: parsed,
        }
      
      default:
        return {
          type: 'general',
          content: JSON.stringify(parsed, null, 2),
          structured: parsed,
        }
    }
  }

  private validateRequest(request: AgentRequest, agent: AIAgent): void {
    // Validate request compatibility with agent capabilities
    const requiredCapabilities = this.getRequiredCapabilities(request.type)
    const hasCapabilities = requiredCapabilities.every(cap => 
      agent.capabilities.includes(cap)
    )
    
    if (!hasCapabilities) {
      throw new Error(`Agent ${agent.id} lacks required capabilities for ${request.type}`)
    }
  }

  private getRequiredCapabilities(requestType: RequestType): AgentCapability[] {
    switch (requestType) {
      case 'analyze-security':
        return ['static-analysis', 'security-assessment']
      case 'optimize-gas':
        return ['static-analysis', 'optimization']
      case 'review-code':
        return ['static-analysis', 'pattern-recognition']
      default:
        return []
    }
  }

  private calculateConfidence(result: AgentResult): number {
    // Calculate confidence based on result content and structure
    if (result.findings && result.findings.length > 0) {
      const avgConfidence = result.findings.reduce((sum, f) => sum + f.confidence, 0) / result.findings.length
      return Math.round(avgConfidence)
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      const avgConfidence = result.suggestions.reduce((sum, s) => sum + s.confidence, 0) / result.suggestions.length
      return Math.round(avgConfidence)
    }
    
    return 85 // Default confidence
  }

  private calculateOpenAICost(model: string, tokens: number): number {
    // Simplified cost calculation
    const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.000002
    return tokens * costPerToken
  }

  private calculateAnthropicCost(model: string, tokens: number): number {
    // Simplified cost calculation
    const costPerToken = 0.000015
    return tokens * costPerToken
  }

  private async updateAgentMetrics(
    agentId: string,
    update: {
      tokensUsed: number
      cost: number
      executionTime: number
      success: boolean
    }
  ): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) return

    agent.metrics.totalRequests++
    if (update.success) {
      agent.metrics.successfulRequests++
    } else {
      agent.metrics.failedRequests++
    }
    
    agent.metrics.tokensUsed += update.tokensUsed
    agent.metrics.costIncurred += update.cost
    agent.metrics.averageResponseTime = 
      (agent.metrics.averageResponseTime + update.executionTime) / 2
    agent.metrics.lastUsed = new Date()

    // Store updated metrics
    await this.redis.setex(
      `agent:metrics:${agentId}`,
      86400,
      JSON.stringify(agent.metrics)
    )
  }

  private async storeResponse(response: AgentResponse): Promise<void> {
    await this.redis.setex(
      `agent:response:${response.requestId}`,
      86400 * 7, // 7 days
      JSON.stringify(response)
    )
  }

  private initializeMetrics(): AgentMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      accuracyScore: 0,
      userSatisfaction: 0,
      tokensUsed: 0,
      costIncurred: 0,
      lastUsed: new Date(),
    }
  }

  private getSecurityAuditorPrompt(): string {
    return `You are an expert smart contract security auditor with deep knowledge of blockchain security, DeFi protocols, and common vulnerabilities. Your role is to analyze smart contracts and identify potential security issues, provide detailed explanations, and suggest remediation strategies.

Focus on:
- Reentrancy attacks
- Integer overflow/underflow
- Access control issues
- Front-running vulnerabilities
- Flash loan attacks
- Oracle manipulation
- Gas limit issues
- Logic errors

Always provide:
1. Clear vulnerability descriptions
2. Impact assessment
3. Likelihood estimation
4. Remediation recommendations
5. Code examples when helpful

Respond in JSON format with findings array containing vulnerability objects.`
  }

  private getGasOptimizerPrompt(): string {
    return `You are an expert Ethereum gas optimization specialist. Your role is to analyze smart contracts and identify opportunities to reduce gas consumption while maintaining functionality and security.

Focus on:
- Storage optimization
- Loop optimization
- Function visibility
- Data type optimization
- Assembly optimizations
- Batch operations
- State variable packing
- External call optimization

Always provide:
1. Specific optimization suggestions
2. Gas savings estimates
3. Before/after code examples
4. Risk assessment for each optimization
5. Implementation difficulty

Respond with structured optimization recommendations.`
  }

  private getCodeReviewerPrompt(): string {
    return `You are an expert code reviewer specializing in blockchain development. Your role is to review smart contracts for code quality, best practices, maintainability, and potential improvements.

Focus on:
- Code structure and organization
- Naming conventions
- Documentation quality
- Error handling
- Test coverage
- Design patterns
- Modularity
- Readability

Always provide:
1. Code quality assessment
2. Best practice recommendations
3. Refactoring suggestions
4. Documentation improvements
5. Testing recommendations

Respond with structured review feedback.`
  }

  async getAgent(agentId: string): Promise<AIAgent | null> {
    return this.agents.get(agentId) || null
  }

  async listAgents(): Promise<AIAgent[]> {
    return Array.from(this.agents.values())
  }

  async getAgentMetrics(agentId: string): Promise<AgentMetrics | null> {
    const agent = this.agents.get(agentId)
    return agent ? agent.metrics : null
  }
}
