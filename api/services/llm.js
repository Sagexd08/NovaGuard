// Enhanced LLM Service for serverless functions - migrated from backend
const { withAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

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

// LLM Service Class (migrated from backend)
class LLMService {
  constructor() {
    // Updated API keys and models
    this.mistralApiKey = process.env.OPENROUTER_API_KEY_MISTRAL || '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';
    this.gemmaApiKey = process.env.OPENROUTER_API_KEY_GEMMA || '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';
    this.geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyD89JPbu6477uDH6zCNcfKB66UodaE9el4';

    this.openRouterBaseURL = 'https://openrouter.ai/api/v1';
    this.geminiBaseURL = 'https://generativelanguage.googleapis.com/v1beta';

    // Available models
    this.models = {
      mistral: 'mistralai/mistral-small-3.2-24b-instruct:free',
      gemma: 'google/gemma-3n-e4b-it:free',
      gemini: 'gemini-2.5-pro'
    };

    this.timeout = 60000; // 60 seconds
  }

  // Build comprehensive security analysis prompt (from backend)
  buildSecurityAnalysisPrompt(contractCode, contractInfo = {}) {
    return `
You are a professional smart contract security auditor. Analyze this Solidity contract for security vulnerabilities, code quality, and gas optimization opportunities.

Contract Information:
- Chain: ${contractInfo.chain || 'ethereum'}
- Contract Name: ${contractInfo.name || 'Unknown'}
- Contract Address: ${contractInfo.address || 'Not deployed'}

Contract Code:
${contractCode}

Perform a comprehensive analysis and return ONLY a valid JSON object with this exact structure:

{
  "vulnerabilities": [
    {
      "id": "unique_id",
      "name": "Vulnerability Name",
      "severity": "critical|high|medium|low",
      "category": "reentrancy|access-control|arithmetic|logic|gas|defi|mev|other",
      "description": "Detailed description of the vulnerability",
      "location": {
        "line": 42,
        "function": "functionName",
        "contract": "ContractName"
      },
      "impact": "Potential impact description",
      "recommendation": "How to fix this vulnerability",
      "confidence": 0.95,
      "references": ["CWE-123", "SWC-456"]
    }
  ],
  "overallScore": 85,
  "riskLevel": "Low|Medium|High|Critical",
  "securityScore": 85,
  "qualityScore": 78,
  "gasScore": 82,
  "summary": "Brief summary of the analysis",
  "recommendations": [
    "General recommendation 1",
    "General recommendation 2"
  ],
  "gasOptimizations": [
    {
      "type": "storage|computation|deployment",
      "description": "Optimization description",
      "location": "Line 42",
      "estimatedSavings": "~500 gas",
      "implementation": "How to implement this optimization"
    }
  ],
  "codeQuality": {
    "score": 78,
    "issues": ["Issue 1", "Issue 2"],
    "strengths": ["Strength 1", "Strength 2"],
    "maintainability": "high|medium|low",
    "readability": "high|medium|low",
    "testability": "high|medium|low"
  },
  "defiAnalysis": {
    "tokenomics": "Analysis of token economics",
    "liquidityRisks": ["Risk 1", "Risk 2"],
    "flashLoanVulnerabilities": ["Vuln 1", "Vuln 2"],
    "yieldFarmingRisks": ["Risk 1", "Risk 2"],
    "governanceRisks": ["Risk 1", "Risk 2"],
    "oracleRisks": ["Risk 1", "Risk 2"]
  },
  "complianceChecks": {
    "erc20Compliance": true,
    "erc721Compliance": false,
    "accessControlPatterns": ["Ownable", "AccessControl"],
    "upgradeabilityPatterns": ["Proxy", "Diamond"],
    "pausabilityImplemented": true
  },
  "analyzedAt": "2024-01-01T00:00:00Z",
  "model": "${this.model}",
  "analysisVersion": "2.0.0"
}

Focus on:
1. Security vulnerabilities (reentrancy, access control, arithmetic overflow/underflow)
2. Code quality and best practices
3. Gas optimization opportunities
4. DeFi-specific risks if applicable
5. Compliance with common standards
6. MEV vulnerabilities
7. Cross-chain compatibility issues

Be thorough but concise. Provide actionable recommendations.
    `;
  }

  // Call LLM API with enhanced error handling and multi-model support
  async callLLM(prompt, modelType = 'mistral') {
    try {
      // Determine which model and API to use
      let apiKey, baseURL, model;

      switch (modelType) {
        case 'gemma':
          apiKey = this.gemmaApiKey;
          baseURL = this.openRouterBaseURL;
          model = this.models.gemma;
          break;
        case 'gemini':
          apiKey = this.geminiApiKey;
          baseURL = this.geminiBaseURL;
          model = this.models.gemini;
          break;
        case 'mistral':
        default:
          apiKey = this.mistralApiKey;
          baseURL = this.openRouterBaseURL;
          model = this.models.mistral;
          break;
      }

      // Handle Gemini API differently
      if (modelType === 'gemini') {
        return await this.callGeminiAPI(prompt, apiKey, model);
      }

      // OpenRouter API call for Mistral and Gemma
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional smart contract security auditor with expertise in Solidity, DeFi, and blockchain security. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://novaguard.vercel.app',
            'X-Title': 'NovaGuard - Smart Contract Security Auditor',
          },
          timeout: this.timeout,
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from LLM API');
      }

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error(`${modelType} API error:`, error.message);

      // Try fallback model if primary fails
      if (modelType === 'mistral') {
        console.log('Mistral failed, trying Gemma...');
        return await this.callLLM(prompt, 'gemma');
      } else if (modelType === 'gemma') {
        console.log('Gemma failed, trying Gemini...');
        return await this.callLLM(prompt, 'gemini');
      }

      throw new Error(`All LLM models failed: ${error.message}`);
    }
  }

  // Gemini API specific handler
  async callGeminiAPI(prompt, apiKey, model) {
    try {
      const response = await axios.post(
        `${this.geminiBaseURL}/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: `You are a professional smart contract security auditor. ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.9,
            maxOutputTokens: 4000,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      return response.data.candidates[0].content.parts[0].text;

    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  // Parse LLM analysis response (from backend)
  parseAnalysisResponse(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!analysis.vulnerabilities || !Array.isArray(analysis.vulnerabilities)) {
        analysis.vulnerabilities = [];
      }

      if (typeof analysis.overallScore !== 'number') {
        analysis.overallScore = 50;
      }

      if (!analysis.riskLevel) {
        analysis.riskLevel = 'Medium';
      }

      // Ensure all scores are present
      analysis.securityScore = analysis.securityScore || analysis.overallScore || 50;
      analysis.qualityScore = analysis.qualityScore || 50;
      analysis.gasScore = analysis.gasScore || 50;

      // Add metadata
      analysis.analyzedAt = new Date().toISOString();
      analysis.model = this.model;
      analysis.analysisVersion = '2.0.0-serverless';

      return analysis;

    } catch (error) {
      console.error('Failed to parse LLM response:', error.message);

      // Return fallback analysis
      return {
        vulnerabilities: [],
        overallScore: 50,
        riskLevel: 'Medium',
        securityScore: 50,
        qualityScore: 50,
        gasScore: 50,
        summary: 'Analysis failed - manual review required',
        recommendations: ['Manual security review recommended'],
        gasOptimizations: [],
        codeQuality: {
          score: 50,
          issues: ['Analysis parsing failed'],
          strengths: [],
          maintainability: 'medium',
          readability: 'medium',
          testability: 'medium'
        },
        defiAnalysis: {
          tokenomics: 'Analysis failed',
          liquidityRisks: [],
          flashLoanVulnerabilities: [],
          yieldFarmingRisks: [],
          governanceRisks: [],
          oracleRisks: []
        },
        complianceChecks: {
          erc20Compliance: false,
          erc721Compliance: false,
          accessControlPatterns: [],
          upgradeabilityPatterns: [],
          pausabilityImplemented: false
        },
        analyzedAt: new Date().toISOString(),
        model: this.model,
        analysisVersion: '2.0.0-serverless',
        parseError: true,
      };
    }
  }

  // Analyze contract with multi-model strategy
  async analyzeContract(contractCode, contractInfo = {}) {
    try {
      console.log('Starting LLM contract analysis', {
        models: Object.keys(this.models),
        codeLength: contractCode.length
      });

      const prompt = this.buildSecurityAnalysisPrompt(contractCode, contractInfo);

      // Use Mistral as primary model (most capable for security analysis)
      const response = await this.callLLM(prompt, 'mistral');
      const analysis = this.parseAnalysisResponse(response);

      console.log('LLM analysis completed', {
        vulnerabilitiesFound: analysis.vulnerabilities?.length || 0,
        overallScore: analysis.overallScore,
        modelUsed: 'mistral'
      });

      return analysis;

    } catch (error) {
      console.error('LLM analysis failed:', error.message);
      throw error;
    }
  }

  // Get model information
  getModelInfo() {
    return {
      configured: !!(this.mistralApiKey && this.gemmaApiKey && this.geminiApiKey),
      models: this.models,
      apiKeys: {
        mistral: !!this.mistralApiKey,
        gemma: !!this.gemmaApiKey,
        gemini: !!this.geminiApiKey
      },
      baseURLs: {
        openRouter: this.openRouterBaseURL,
        gemini: this.geminiBaseURL
      },
      timeout: this.timeout
    };
  }
}

// Serverless function handler
const llmServiceHandler = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { userId, email } = req.auth;

  try {
    const llmService = new LLMService();

    if (req.method === 'GET') {
      // Get LLM service info
      const modelInfo = llmService.getModelInfo();
      
      res.status(200).json({
        success: true,
        modelInfo,
        metadata: {
          userId,
          userEmail: email,
          timestamp: new Date().toISOString(),
          version: '2.0.0-serverless'
        }
      });
    } else if (req.method === 'POST') {
      const { action, contractCode, contractInfo, prompt, model } = req.body;

      switch (action) {
        case 'analyze':
          if (!contractCode) {
            return res.status(400).json({
              success: false,
              error: 'Contract code is required'
            });
          }

          console.log(`LLM analysis request from user: ${email} (${userId})`);
          
          const analysis = await llmService.analyzeContract(contractCode, contractInfo || {});
          
          // Log analysis to database
          if (supabaseAdmin) {
            await supabaseAdmin
              .from('llm_analysis_logs')
              .insert({
                user_id: userId,
                contract_code: contractCode.substring(0, 1000),
                analysis_result: analysis,
                model_used: llmService.model,
                created_at: new Date().toISOString()
              });
          }

          res.status(200).json({
            success: true,
            analysis,
            metadata: {
              userId,
              userEmail: email,
              timestamp: new Date().toISOString(),
              version: '2.0.0-serverless'
            }
          });
          break;

        case 'custom-prompt':
          if (!prompt) {
            return res.status(400).json({
              success: false,
              error: 'Prompt is required'
            });
          }

          console.log(`Custom LLM prompt from user: ${email} (${userId})`);
          
          const response = await llmService.callLLM(prompt, model);
          
          res.status(200).json({
            success: true,
            response,
            metadata: {
              userId,
              userEmail: email,
              model: model || llmService.model,
              timestamp: new Date().toISOString(),
              version: '2.0.0-serverless'
            }
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action. Supported actions: analyze, custom-prompt'
          });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('LLM service error:', error);
    res.status(500).json({
      success: false,
      error: 'LLM service failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Export with Clerk authentication middleware
module.exports = withAuth(llmServiceHandler);
