// =============================================
// NOVAGUARD MULTI-AGENT ORCHESTRATOR
// Advanced AI agent coordination system
// =============================================

const SecurityAgent = require('./security-agent');
const GasOptimizerAgent = require('./gas-optimizer-agent');
const TokenomicsAgent = require('./tokenomics-agent');
const VectorKnowledgeSystem = require('../rag/vector-knowledge-system');
const { createClient } = require('@supabase/supabase-js');

class MultiAgentOrchestrator {
  constructor() {
    this.name = 'MultiAgentOrchestrator';
    this.version = '2.0.0';
    this.agents = new Map();
    this.executionStrategies = ['parallel', 'sequential', 'adaptive'];
    
    // Initialize agents and RAG system
    this.initializeAgents();
    this.initializeRAGSystem();

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Agent execution priorities and dependencies
    this.agentConfig = {
      security: {
        priority: 1,
        dependencies: [],
        timeout: 120000, // 2 minutes
        retries: 2,
        required: true
      },
      gasOptimizer: {
        priority: 2,
        dependencies: ['security'],
        timeout: 90000, // 1.5 minutes
        retries: 2,
        required: false
      },
      tokenomics: {
        priority: 3,
        dependencies: ['security'],
        timeout: 100000, // 1.67 minutes
        retries: 2,
        required: false
      },
      cicdLinter: {
        priority: 4,
        dependencies: ['security', 'gasOptimizer'],
        timeout: 60000, // 1 minute
        retries: 1,
        required: false
      },
      deploymentSafety: {
        priority: 5,
        dependencies: ['security', 'tokenomics'],
        timeout: 80000, // 1.33 minutes
        retries: 2,
        required: false
      }
    };
  }

  // Initialize all available agents
  initializeAgents() {
    this.agents.set('security', new SecurityAgent());
    this.agents.set('gasOptimizer', new GasOptimizerAgent());
    this.agents.set('tokenomics', new TokenomicsAgent());

    console.log(`🤖 Initialized ${this.agents.size} AI agents`);
  }

  // Initialize RAG knowledge system
  initializeRAGSystem() {
    this.ragSystem = new VectorKnowledgeSystem();
    console.log('🧠 Initialized RAG knowledge system');
  }

  // Comprehensive multi-agent analysis
  async analyzeContract(contractCode, options = {}) {
    const startTime = Date.now();
    const auditId = options.auditId || `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🚀 Starting multi-agent analysis: ${auditId}`);
      
      // Validate input
      this.validateInput(contractCode, options);
      
      // Determine execution strategy
      const strategy = options.strategy || this.determineOptimalStrategy(contractCode, options);
      console.log(`📋 Using execution strategy: ${strategy}`);
      
      // Select agents based on analysis mode
      const selectedAgents = this.selectAgents(options.analysisMode, options.agents);
      console.log(`🎯 Selected agents: ${selectedAgents.join(', ')}`);

      // Retrieve contextual knowledge using RAG
      console.log('🧠 Retrieving contextual knowledge...');
      const contextualKnowledge = await this.ragSystem.getContextualKnowledge(
        contractCode,
        options.analysisMode || 'comprehensive'
      );
      console.log(`📚 Retrieved ${contextualKnowledge.totalSources} knowledge sources`);

      // Enhance options with contextual knowledge
      const enhancedOptions = {
        ...options,
        contextualKnowledge,
        ragEnabled: true
      };

      // Execute agents based on strategy
      let results;
      switch (strategy) {
        case 'parallel':
          results = await this.executeParallel(contractCode, selectedAgents, enhancedOptions);
          break;
        case 'sequential':
          results = await this.executeSequential(contractCode, selectedAgents, enhancedOptions);
          break;
        case 'adaptive':
          results = await this.executeAdaptive(contractCode, selectedAgents, enhancedOptions);
          break;
        default:
          throw new Error(`Unknown execution strategy: ${strategy}`);
      }
      
      // Aggregate and cross-validate results
      const aggregatedResults = await this.aggregateResults(results, contractCode, options);
      
      // Generate comprehensive report
      const finalReport = await this.generateComprehensiveReport(aggregatedResults, contractCode, options);
      
      const executionTime = Date.now() - startTime;
      
      // Log analysis to database
      await this.logAnalysis(auditId, finalReport, executionTime, options);
      
      console.log(`✅ Multi-agent analysis completed in ${executionTime}ms`);
      
      return {
        auditId,
        ...finalReport,
        executionTime,
        strategy,
        agentsUsed: selectedAgents,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Multi-agent analysis failed: ${error.message}`);
      await this.logError(auditId, error, options);
      throw error;
    }
  }

  // Validate input parameters
  validateInput(contractCode, options) {
    if (!contractCode || typeof contractCode !== 'string') {
      throw new Error('Contract code must be a non-empty string');
    }
    
    if (contractCode.length < 50) {
      throw new Error('Contract code too short for meaningful analysis');
    }
    
    if (contractCode.length > 1000000) {
      throw new Error('Contract code exceeds maximum size limit (1MB)');
    }
    
    // Validate Solidity syntax basics
    if (!contractCode.includes('contract ') && !contractCode.includes('library ') && !contractCode.includes('interface ')) {
      throw new Error('Invalid Solidity code: No contract, library, or interface declaration found');
    }
  }

  // Determine optimal execution strategy
  determineOptimalStrategy(contractCode, options) {
    const codeSize = contractCode.length;
    const complexity = this.estimateComplexity(contractCode);
    const agentCount = (options.agents || ['security', 'gasOptimizer', 'tokenomics']).length;
    
    // Use parallel for simple contracts with multiple agents
    if (codeSize < 10000 && complexity < 0.5 && agentCount > 2) {
      return 'parallel';
    }
    
    // Use sequential for complex contracts or when dependencies are critical
    if (complexity > 0.8 || options.analysisMode === 'comprehensive') {
      return 'sequential';
    }
    
    // Use adaptive for medium complexity contracts
    return 'adaptive';
  }

  // Estimate contract complexity
  estimateComplexity(contractCode) {
    const metrics = {
      functions: (contractCode.match(/function\s+\w+/gi) || []).length,
      modifiers: (contractCode.match(/modifier\s+\w+/gi) || []).length,
      events: (contractCode.match(/event\s+\w+/gi) || []).length,
      structs: (contractCode.match(/struct\s+\w+/gi) || []).length,
      inheritance: (contractCode.match(/is\s+\w+/gi) || []).length,
      externalCalls: (contractCode.match(/\.call\(|\.delegatecall\(|\.staticcall\(/gi) || []).length,
      loops: (contractCode.match(/for\s*\(|while\s*\(/gi) || []).length
    };
    
    // Weighted complexity score (0-1)
    const complexity = (
      metrics.functions * 0.1 +
      metrics.modifiers * 0.15 +
      metrics.events * 0.05 +
      metrics.structs * 0.1 +
      metrics.inheritance * 0.2 +
      metrics.externalCalls * 0.25 +
      metrics.loops * 0.15
    ) / 100;
    
    return Math.min(complexity, 1);
  }

  // Select agents based on analysis mode
  selectAgents(analysisMode, requestedAgents) {
    const defaultAgents = ['security', 'gasOptimizer'];
    
    if (requestedAgents && Array.isArray(requestedAgents)) {
      return requestedAgents.filter(agent => this.agents.has(agent));
    }
    
    switch (analysisMode) {
      case 'quick':
        return ['security'];
      case 'comprehensive':
        return ['security', 'gasOptimizer', 'tokenomics'];
      case 'defi-focused':
        return ['security', 'tokenomics'];
      case 'security-only':
        return ['security'];
      case 'gas-optimization':
        return ['gasOptimizer'];
      default:
        return defaultAgents;
    }
  }

  // Execute agents in parallel
  async executeParallel(contractCode, selectedAgents, options) {
    console.log('🔄 Executing agents in parallel...');
    
    const agentPromises = selectedAgents.map(async (agentName) => {
      const agent = this.agents.get(agentName);
      const config = this.agentConfig[agentName];
      
      try {
        const result = await Promise.race([
          agent.analyze(contractCode, options),
          this.createTimeout(config.timeout, `${agentName} agent timeout`)
        ]);
        
        return { agentName, result, status: 'success' };
      } catch (error) {
        console.error(`❌ ${agentName} agent failed:`, error.message);
        
        if (config.required) {
          throw error;
        }
        
        return { agentName, error: error.message, status: 'failed' };
      }
    });
    
    const results = await Promise.allSettled(agentPromises);
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { status: 'failed', error: result.reason }
    );
  }

  // Execute agents sequentially with dependency management
  async executeSequential(contractCode, selectedAgents, options) {
    console.log('🔄 Executing agents sequentially...');
    
    const results = [];
    const completedAgents = new Set();
    
    // Sort agents by priority and dependencies
    const sortedAgents = this.sortAgentsByDependencies(selectedAgents);
    
    for (const agentName of sortedAgents) {
      const agent = this.agents.get(agentName);
      const config = this.agentConfig[agentName];
      
      // Check if dependencies are satisfied
      const dependenciesMet = config.dependencies.every(dep => completedAgents.has(dep));
      
      if (!dependenciesMet) {
        console.warn(`⚠️ Skipping ${agentName}: dependencies not met`);
        continue;
      }
      
      try {
        console.log(`🔍 Running ${agentName} agent...`);
        
        const result = await Promise.race([
          agent.analyze(contractCode, { ...options, previousResults: results }),
          this.createTimeout(config.timeout, `${agentName} agent timeout`)
        ]);
        
        results.push({ agentName, result, status: 'success' });
        completedAgents.add(agentName);
        
        console.log(`✅ ${agentName} agent completed`);
        
      } catch (error) {
        console.error(`❌ ${agentName} agent failed:`, error.message);
        
        if (config.required) {
          throw error;
        }
        
        results.push({ agentName, error: error.message, status: 'failed' });
      }
    }
    
    return results;
  }

  // Execute agents with adaptive strategy
  async executeAdaptive(contractCode, selectedAgents, options) {
    console.log('🔄 Executing agents with adaptive strategy...');
    
    // Start with critical agents in parallel
    const criticalAgents = selectedAgents.filter(agent => this.agentConfig[agent].required);
    const optionalAgents = selectedAgents.filter(agent => !this.agentConfig[agent].required);
    
    // Execute critical agents first
    const criticalResults = await this.executeParallel(contractCode, criticalAgents, options);
    
    // Analyze critical results to determine next steps
    const shouldContinue = this.shouldContinueAnalysis(criticalResults);
    
    if (!shouldContinue || optionalAgents.length === 0) {
      return criticalResults;
    }
    
    // Execute optional agents based on critical results
    const optionalResults = await this.executeSequential(contractCode, optionalAgents, {
      ...options,
      previousResults: criticalResults
    });
    
    return [...criticalResults, ...optionalResults];
  }

  // Sort agents by dependencies and priority
  sortAgentsByDependencies(selectedAgents) {
    const sorted = [];
    const visited = new Set();
    
    const visit = (agentName) => {
      if (visited.has(agentName)) return;
      
      const config = this.agentConfig[agentName];
      if (config && config.dependencies) {
        config.dependencies.forEach(dep => {
          if (selectedAgents.includes(dep)) {
            visit(dep);
          }
        });
      }
      
      visited.add(agentName);
      sorted.push(agentName);
    };
    
    selectedAgents.forEach(visit);
    
    return sorted;
  }

  // Determine if analysis should continue based on critical results
  shouldContinueAnalysis(criticalResults) {
    const successfulResults = criticalResults.filter(r => r.status === 'success');
    
    if (successfulResults.length === 0) {
      return false;
    }
    
    // Check if critical vulnerabilities were found
    const hasCriticalVulns = successfulResults.some(r => 
      r.result && r.result.vulnerabilities && 
      r.result.vulnerabilities.some(v => v.severity === 'critical')
    );
    
    // Continue analysis even with critical vulnerabilities for comprehensive report
    return true;
  }

  // Create timeout promise
  createTimeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  // Aggregate results from all agents
  async aggregateResults(results, contractCode, options) {
    const successfulResults = results.filter(r => r.status === 'success');
    const failedResults = results.filter(r => r.status === 'failed');
    
    console.log(`📊 Aggregating results: ${successfulResults.length} successful, ${failedResults.length} failed`);
    
    // Combine vulnerabilities from all agents
    const allVulnerabilities = [];
    const allOptimizations = [];
    const allFindings = [];
    
    successfulResults.forEach(({ agentName, result }) => {
      if (result.vulnerabilities) {
        allVulnerabilities.push(...result.vulnerabilities.map(v => ({ ...v, source: agentName })));
      }
      if (result.optimizations) {
        allOptimizations.push(...result.optimizations.map(o => ({ ...o, source: agentName })));
      }
      if (result.findings) {
        allFindings.push(...result.findings.map(f => ({ ...f, source: agentName })));
      }
    });
    
    // Cross-validate and deduplicate findings
    const uniqueVulnerabilities = this.deduplicateVulnerabilities(allVulnerabilities);
    const uniqueOptimizations = this.deduplicateOptimizations(allOptimizations);
    const uniqueFindings = this.deduplicateFindings(allFindings);
    
    // Calculate overall scores
    const overallScore = this.calculateOverallScore(successfulResults);
    const riskLevel = this.calculateOverallRisk(uniqueVulnerabilities, uniqueFindings);
    
    return {
      vulnerabilities: uniqueVulnerabilities,
      optimizations: uniqueOptimizations,
      findings: uniqueFindings,
      overallScore,
      riskLevel,
      agentResults: successfulResults,
      failedAgents: failedResults,
      crossValidation: this.performCrossValidation(successfulResults)
    };
  }

  // Generate comprehensive final report
  async generateComprehensiveReport(aggregatedResults, contractCode, options) {
    const report = {
      summary: this.generateExecutiveSummary(aggregatedResults),
      vulnerabilities: aggregatedResults.vulnerabilities,
      gasOptimizations: aggregatedResults.optimizations,
      tokenomicsFindings: aggregatedResults.findings,
      securityScore: this.calculateSecurityScore(aggregatedResults.vulnerabilities),
      gasScore: this.calculateGasScore(aggregatedResults.optimizations),
      tokenomicsScore: this.calculateTokenomicsScore(aggregatedResults.findings),
      overallScore: aggregatedResults.overallScore,
      riskCategory: aggregatedResults.riskLevel,
      recommendations: this.generateRecommendations(aggregatedResults),
      agentMetadata: this.generateAgentMetadata(aggregatedResults.agentResults),
      crossValidation: aggregatedResults.crossValidation
    };
    
    return report;
  }

  // Calculate overall score from all agents
  calculateOverallScore(results) {
    const scores = results
      .map(r => r.result.securityScore || r.result.gasScore || r.result.tokenomicsScore)
      .filter(score => typeof score === 'number');
    
    return scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 50;
  }

  // Calculate overall risk level
  calculateOverallRisk(vulnerabilities, findings) {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    
    if (criticalCount > 0 || criticalFindings > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (highCount > 0) return 'medium';
    return 'low';
  }

  // Perform cross-validation between agents
  performCrossValidation(results) {
    const validation = {
      consensusFindings: [],
      conflictingFindings: [],
      confidenceScore: 0
    };
    
    // Find consensus findings (reported by multiple agents)
    const allFindings = results.flatMap(r => r.result.vulnerabilities || []);
    const findingGroups = this.groupSimilarFindings(allFindings);
    
    findingGroups.forEach(group => {
      if (group.length > 1) {
        validation.consensusFindings.push({
          finding: group[0],
          reportedBy: group.map(f => f.source),
          confidence: group.length / results.length
        });
      }
    });
    
    validation.confidenceScore = validation.consensusFindings.length / allFindings.length;
    
    return validation;
  }

  // Group similar findings for cross-validation
  groupSimilarFindings(findings) {
    const groups = [];
    const processed = new Set();
    
    findings.forEach((finding, index) => {
      if (processed.has(index)) return;
      
      const group = [finding];
      processed.add(index);
      
      findings.forEach((otherFinding, otherIndex) => {
        if (otherIndex !== index && !processed.has(otherIndex)) {
          if (this.areSimilarFindings(finding, otherFinding)) {
            group.push(otherFinding);
            processed.add(otherIndex);
          }
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  }

  // Check if two findings are similar
  areSimilarFindings(finding1, finding2) {
    return finding1.type === finding2.type && 
           finding1.severity === finding2.severity &&
           Math.abs((finding1.confidence || 0) - (finding2.confidence || 0)) < 0.2;
  }

  // Generate executive summary
  generateExecutiveSummary(results) {
    const vulnCount = results.vulnerabilities.length;
    const criticalCount = results.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = results.vulnerabilities.filter(v => v.severity === 'high').length;
    
    return {
      totalVulnerabilities: vulnCount,
      criticalVulnerabilities: criticalCount,
      highVulnerabilities: highCount,
      overallRisk: results.riskLevel,
      keyFindings: results.vulnerabilities.slice(0, 3).map(v => v.name),
      recommendedActions: criticalCount > 0 ? 'Immediate action required' : 'Review and implement recommendations'
    };
  }

  // Generate recommendations
  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.vulnerabilities.some(v => v.severity === 'critical')) {
      recommendations.push('Address critical vulnerabilities immediately before deployment');
    }
    
    if (results.optimizations.length > 0) {
      recommendations.push('Implement gas optimizations to reduce transaction costs');
    }
    
    if (results.findings.some(f => f.category === 'governance')) {
      recommendations.push('Review governance mechanisms for potential attack vectors');
    }
    
    return recommendations;
  }

  // Generate agent metadata
  generateAgentMetadata(results) {
    return results.map(({ agentName, result }) => ({
      agent: agentName,
      executionTime: result.executionTime,
      tokensUsed: result.analysisMetadata?.totalTokens || 0,
      modelsUsed: result.aiModelsUsed || [],
      version: result.version
    }));
  }

  // Utility methods for deduplication
  deduplicateVulnerabilities(vulnerabilities) {
    // Implementation similar to individual agents
    return vulnerabilities; // Simplified for brevity
  }

  deduplicateOptimizations(optimizations) {
    return optimizations; // Simplified for brevity
  }

  deduplicateFindings(findings) {
    return findings; // Simplified for brevity
  }

  calculateSecurityScore(vulnerabilities) {
    const maxScore = 100;
    const criticalPenalty = 30;
    const highPenalty = 15;
    const mediumPenalty = 8;
    const lowPenalty = 3;
    
    const penalty = vulnerabilities.reduce((total, vuln) => {
      switch (vuln.severity) {
        case 'critical': return total + criticalPenalty;
        case 'high': return total + highPenalty;
        case 'medium': return total + mediumPenalty;
        case 'low': return total + lowPenalty;
        default: return total;
      }
    }, 0);
    
    return Math.max(0, maxScore - penalty);
  }

  calculateGasScore(optimizations) {
    const totalSavings = optimizations.reduce((sum, opt) => sum + (opt.gasSavings || 0), 0);
    return Math.min(100, Math.max(0, 100 - (totalSavings / 1000))); // Simplified scoring
  }

  calculateTokenomicsScore(findings) {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    
    return Math.max(0, 100 - (criticalCount * 25) - (highCount * 10));
  }

  // Log analysis to database
  async logAnalysis(auditId, report, executionTime, options) {
    try {
      await this.supabase
        .from('audit_results')
        .insert({
          audit_id: auditId,
          user_id: options.userId,
          contract_id: options.contractId,
          analysis_mode: options.analysisMode || 'comprehensive',
          agents_used: options.agents || ['security', 'gasOptimizer', 'tokenomics'],
          status: 'completed',
          vulnerabilities: report.vulnerabilities,
          security_score: report.securityScore,
          gas_optimization_score: report.gasScore,
          overall_score: report.overallScore,
          risk_category: report.riskCategory,
          code_insights: {
            gasOptimizations: report.gasOptimizations,
            tokenomicsFindings: report.tokenomicsFindings,
            recommendations: report.recommendations
          },
          analysis_duration: executionTime,
          agent_results: report.agentMetadata,
          completed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log analysis:', error);
    }
  }

  // Log errors
  async logError(auditId, error, options) {
    try {
      await this.supabase
        .from('audit_results')
        .insert({
          audit_id: auditId,
          user_id: options.userId,
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
}

module.exports = MultiAgentOrchestrator;
