// Vercel serverless function for comprehensive audit endpoints
const axios = require('axios');
const { withAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// CORS headers helper
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
};

// OpenRouter API configuration
const OPENROUTER_CONFIG = {
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.SITE_URL || 'https://flash-audit.vercel.app',
    'X-Title': 'Flash Audit'
  }
};

// Dual LLM strategy configuration
const KIMI_CONFIG = {
  ...OPENROUTER_CONFIG,
  headers: {
    ...OPENROUTER_CONFIG.headers,
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY_KIMI || process.env.OPENROUTER_API_KEY}`
  }
};

const GEMMA_CONFIG = {
  ...OPENROUTER_CONFIG,
  headers: {
    ...OPENROUTER_CONFIG.headers,
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY_GEMMA || process.env.OPENROUTER_API_KEY}`
  }
};

// Import the advanced Multi-Agent Orchestrator
const MultiAgentOrchestrator = require('../agents/multi-agent-orchestrator');

// Enhanced multi-agent audit analysis function with NovaGuard AI system
const analyzeContract = async (contractCode, options = {}) => {
  // Generate unique audit ID
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Validate input
  if (!contractCode || contractCode.trim().length < 10) {
    throw new Error('Contract code must be at least 10 characters long');
  }

  if (contractCode.length > 1000000) {
    throw new Error('Contract code exceeds maximum size of 1MB');
  }

  // Initialize the Multi-Agent Orchestrator
  const orchestrator = new MultiAgentOrchestrator();

  // Multi-agent analysis configuration (from backend controller)
  const agents = options.agents || ['security', 'quality', 'economics'];
  const analysisMode = options.analysisMode || 'comprehensive';
  const priority = options.priority || 'normal';

  // Enhanced security analysis prompt with multi-agent approach
  const securityPrompt = `
    Perform a ${analysisMode} multi-agent security analysis of this Solidity smart contract.

    Analysis Agents: ${agents.join(', ')}
    Priority Level: ${priority}
    Chain: ${options.chain || 'ethereum'}

    Contract Code:
    ${contractCode}

    Analysis Requirements:
    - Security vulnerabilities (reentrancy, access control, arithmetic, logic)
    - Code quality assessment (best practices, patterns, maintainability)
    - Economic analysis (tokenomics, incentive alignment, value flows)
    - Gas optimization opportunities
    - DeFi-specific risks (if applicable)
    - Cross-chain compatibility issues (if applicable)
    - MEV vulnerabilities (if applicable)

    Return ONLY a JSON object with this exact structure:
    {
      "auditId": "${auditId}",
      "analysisMode": "${analysisMode}",
      "agentsUsed": ${JSON.stringify(agents)},
      "vulnerabilities": [
        {
          "name": "Vulnerability Name",
          "affectedLines": "line numbers",
          "description": "detailed description",
          "severity": "critical|high|medium|low",
          "fixSuggestion": "how to fix this issue",
          "category": "reentrancy|access-control|arithmetic|logic|gas|defi|mev|other",
          "agent": "security|quality|economics",
          "confidence": 0.95
        }
      ],
      "securityScore": 85,
      "qualityScore": 78,
      "economicsScore": 82,
      "overallScore": 81,
      "riskCategory": {
        "label": "critical|high|medium|low",
        "justification": "explanation of risk level"
      },
      "codeInsights": {
        "gasOptimizationTips": ["tip1", "tip2"],
        "antiPatternNotices": ["pattern1", "pattern2"],
        "dangerousUsage": ["usage1", "usage2"],
        "bestPractices": ["practice1", "practice2"],
        "codeComplexity": "low|medium|high",
        "maintainabilityScore": 75
      },
      "defiAnalysis": {
        "tokenomics": "analysis of token economics",
        "liquidityRisks": ["risk1", "risk2"],
        "flashLoanVulnerabilities": ["vuln1", "vuln2"],
        "yieldFarmingRisks": ["risk1", "risk2"],
        "governanceRisks": ["risk1", "risk2"]
      },
      "crossChainAnalysis": {
        "compatibility": ["ethereum", "polygon", "arbitrum"],
        "bridgeRisks": ["risk1", "risk2"],
        "chainSpecificIssues": ["issue1", "issue2"]
      },
      "mevAnalysis": {
        "frontrunningRisks": ["risk1", "risk2"],
        "sandwichAttackVulnerabilities": ["vuln1", "vuln2"],
        "mevProtectionRecommendations": ["rec1", "rec2"]
      }
    }
  `;

  try {
    // Log audit start to database
    if (supabaseAdmin && options.userId) {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          audit_id: auditId,
          user_id: options.userId,
          contract_code: contractCode.substring(0, 1000), // Store first 1000 chars
          chain: options.chain || 'ethereum',
          analysis_mode: options.analysisMode || 'comprehensive',
          status: 'in_progress',
          created_at: new Date().toISOString()
        });
    }

    // Execute comprehensive multi-agent analysis
    console.log(`🚀 Starting NovaGuard multi-agent analysis: ${auditId}`);

    const analysisOptions = {
      auditId,
      userId: options.userId,
      contractId: options.contractId,
      chain: options.chain || 'ethereum',
      analysisMode: options.analysisMode || 'comprehensive',
      agents: options.agents || ['security', 'gasOptimizer', 'tokenomics'],
      strategy: options.strategy || 'adaptive'
    };

    const multiAgentResults = await orchestrator.analyzeContract(contractCode, analysisOptions);

    console.log(`✅ Multi-agent analysis completed: ${multiAgentResults.agentsUsed.join(', ')}`);

    // Transform results to match expected format
    const result = {
      auditId: multiAgentResults.auditId,
      vulnerabilities: multiAgentResults.vulnerabilities || [],
      securityScore: multiAgentResults.securityScore || 50,
      gasOptimizationScore: multiAgentResults.gasScore || 50,
      tokenomicsScore: multiAgentResults.tokenomicsScore || 50,
      overallScore: multiAgentResults.overallScore || 50,
      riskCategory: {
        label: multiAgentResults.riskCategory || 'medium',
        justification: multiAgentResults.summary?.recommendedActions || 'Analysis completed'
      },
      codeInsights: {
        gasOptimizationTips: multiAgentResults.gasOptimizations?.map(opt => opt.description) || [],
        antiPatternNotices: multiAgentResults.vulnerabilities?.filter(v => v.type?.includes('pattern')).map(v => v.description) || [],
        dangerousUsage: multiAgentResults.vulnerabilities?.filter(v => v.severity === 'critical').map(v => v.description) || [],
        tokenomicsFindings: multiAgentResults.tokenomicsFindings || [],
        recommendations: multiAgentResults.recommendations || []
      },
      agentResults: multiAgentResults.agentResults || [],
      crossValidation: multiAgentResults.crossValidation || {},
      executionTime: multiAgentResults.executionTime || 0,
      agentsUsed: multiAgentResults.agentsUsed || [],
      strategy: multiAgentResults.strategy || 'adaptive'
    };

    // Update audit log with completion status
    if (supabaseAdmin && options.userId) {
      await supabaseAdmin
        .from('audit_logs')
        .update({
          status: 'completed',
          execution_time: result.executionTime,
          agents_requested: result.agentsUsed,
          credits_used: result.agentsUsed.length
        })
        .eq('audit_id', auditId);
    }

    console.log(`🎉 NovaGuard analysis completed successfully: ${auditId}`);

    return result;
  } catch (error) {
    console.error('🚨 NovaGuard analysis error:', error);

    // Log error to database
    if (supabaseAdmin && options.userId) {
      await supabaseAdmin
        .from('audit_logs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('audit_id', auditId);
    }

    // Return error result with NovaGuard format
    return {
      auditId,
      vulnerabilities: [{
        name: "NovaGuard Analysis Service Error",
        affectedLines: "N/A",
        description: `Multi-agent analysis failed: ${error.message}`,
        severity: "high",
        fixSuggestion: "Retry analysis or perform manual review",
        type: "system_error"
      }],
      securityScore: 0,
      riskCategory: {
        label: "high",
        justification: "Unable to complete security analysis"
      },
      codeInsights: {
        gasOptimizationTips: ["Analysis service unavailable"],
        antiPatternNotices: ["Manual review required"],
        dangerousUsage: ["Service error - manual verification needed"],
        bestPractices: ["Retry with manual analysis"]
      },
      defiAnalysis: {
        tokenomics: "Analysis failed",
        liquidityRisks: ["Unable to analyze"],
        flashLoanVulnerabilities: ["Manual review required"]
      }
    };
  }
};

// Enhanced audit handler with comprehensive analysis
const auditHandler = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      contractCode,
      chain,
      contractAddress,
      sourceType,
      analysisMode,
      agents,
      priority,
      includeDeFi
    } = req.body;
    const { userId, email } = req.auth; // Get user info from Clerk auth

    // Enhanced validation
    if (!contractCode) {
      return res.status(400).json({
        error: 'Contract code is required',
        details: 'Please provide the contract source code for analysis'
      });
    }

    if (contractCode.length > 1000000) {
      return res.status(400).json({
        error: 'Contract code too large',
        details: 'Contract code must be less than 1MB'
      });
    }

    console.log(`Enhanced audit request from user: ${email} (${userId})`);
    console.log(`Analysis mode: ${analysisMode || 'comprehensive'}, Chain: ${chain || 'ethereum'}`);

    // Analyze the contract with enhanced options
    const result = await analyzeContract(contractCode, {
      chain: chain || 'ethereum',
      contractAddress,
      sourceType: sourceType || 'solidity',
      analysisMode: analysisMode || 'comprehensive',
      agents: agents || ['security', 'quality', 'economics'],
      priority: priority || 'normal',
      includeDeFi: includeDeFi !== false,
      userId,
      userEmail: email
    });

    // Add comprehensive metadata to the response
    result.auditMetadata = {
      userId,
      userEmail: email,
      timestamp: new Date().toISOString(),
      chain: chain || 'ethereum',
      contractAddress,
      analysisMode: analysisMode || 'comprehensive',
      agents: agents || ['security', 'quality', 'economics'],
      priority: priority || 'normal',
      version: '2.0.0-serverless'
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Enhanced audit API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Export with Clerk authentication middleware
module.exports = withAuth(auditHandler);
