// =============================================
// NOVAGUARD SECURITY AGENT
// Advanced AI-powered security analysis agent
// =============================================

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class SecurityAgent {
  constructor() {
    this.name = 'SecurityAgent';
    this.version = '2.0.0';
    this.capabilities = [
      'reentrancy_detection',
      'access_control_analysis',
      'integer_overflow_detection',
      'front_running_analysis',
      'flash_loan_attack_detection',
      'governance_attack_analysis',
      'oracle_manipulation_detection',
      'mev_vulnerability_analysis',
      'cross_chain_bridge_security',
      'defi_protocol_specific_risks'
    ];
    
    this.openRouterConfig = {
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://novaguard.app',
        'X-Title': 'NovaGuard Security Agent'
      }
    };

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Advanced vulnerability patterns with ML-enhanced detection
    this.vulnerabilityPatterns = {
      reentrancy: {
        patterns: [
          /\.call\s*\(\s*[^)]*\)\s*;?\s*(?!.*require|.*assert)/gi,
          /\.transfer\s*\(\s*[^)]*\)\s*;?\s*(?=.*balances?\[)/gi,
          /external\s+.*\{[\s\S]*?balances?\[[\s\S]*?\}(?![\s\S]*nonReentrant)/gi
        ],
        severity: 'critical',
        confidence: 0.85,
        description: 'Potential reentrancy vulnerability detected'
      },
      accessControl: {
        patterns: [
          /function\s+\w+\s*\([^)]*\)\s+(?!.*onlyOwner|.*onlyAdmin|.*require\s*\(|.*modifier)/gi,
          /tx\.origin\s*==\s*\w+/gi,
          /msg\.sender\s*==\s*owner(?!\s*\()/gi
        ],
        severity: 'high',
        confidence: 0.75,
        description: 'Access control vulnerability detected'
      },
      integerOverflow: {
        patterns: [
          /\+\+\s*(?!.*SafeMath|.*unchecked)/gi,
          /\w+\s*\+=\s*\w+(?!.*SafeMath|.*unchecked)/gi,
          /\w+\s*\*\s*\w+(?!.*SafeMath|.*unchecked)/gi
        ],
        severity: 'medium',
        confidence: 0.60,
        description: 'Potential integer overflow/underflow'
      },
      flashLoanAttack: {
        patterns: [
          /flashLoan|flash_loan/gi,
          /borrow.*repay/gi,
          /\.balanceOf\(address\(this\)\).*\.transfer/gi
        ],
        severity: 'high',
        confidence: 0.70,
        description: 'Flash loan attack vector detected'
      },
      oracleManipulation: {
        patterns: [
          /getPrice|price.*oracle/gi,
          /latestRoundData|getRoundData/gi,
          /\.price\(\)(?!.*require.*timestamp)/gi
        ],
        severity: 'high',
        confidence: 0.65,
        description: 'Oracle manipulation vulnerability'
      },
      mevVulnerability: {
        patterns: [
          /block\.timestamp(?!.*require.*\+)/gi,
          /block\.number(?!.*require.*\+)/gi,
          /tx\.gasprice/gi
        ],
        severity: 'medium',
        confidence: 0.55,
        description: 'MEV vulnerability detected'
      }
    };
  }

  // Advanced static analysis with pattern matching
  async performStaticAnalysis(contractCode) {
    const vulnerabilities = [];
    const codeLines = contractCode.split('\n');

    for (const [vulnType, config] of Object.entries(this.vulnerabilityPatterns)) {
      for (const pattern of config.patterns) {
        const matches = contractCode.match(pattern);
        if (matches) {
          // Find line numbers for each match
          const lineNumbers = this.findLineNumbers(contractCode, matches);
          
          vulnerabilities.push({
            type: vulnType,
            severity: config.severity,
            confidence: config.confidence,
            description: config.description,
            affectedLines: lineNumbers.join(', '),
            codeSnippets: this.extractCodeSnippets(codeLines, lineNumbers),
            matches: matches.length,
            pattern: pattern.source
          });
        }
      }
    }

    return vulnerabilities;
  }

  // AI-powered deep security analysis using multiple LLM models
  async performAIAnalysis(contractCode, staticResults = []) {
    const prompt = this.buildAdvancedSecurityPrompt(contractCode, staticResults);
    
    try {
      // Use multiple models for cross-validation
      const models = [
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4-turbo',
        'google/gemini-pro-1.5'
      ];

      const analyses = await Promise.allSettled(
        models.map(model => this.callLLMModel(prompt, model))
      );

      // Aggregate and cross-validate results
      const validAnalyses = analyses
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      return this.aggregateAIResults(validAnalyses, staticResults);
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`Security AI analysis failed: ${error.message}`);
    }
  }

  // Build comprehensive security analysis prompt
  buildAdvancedSecurityPrompt(contractCode, staticResults) {
    return `
You are an elite smart contract security auditor with expertise in DeFi, MEV, and advanced attack vectors. 

Analyze this Solidity contract for security vulnerabilities with extreme precision:

CONTRACT CODE:
\`\`\`solidity
${contractCode}
\`\`\`

STATIC ANALYSIS FINDINGS:
${JSON.stringify(staticResults, null, 2)}

ANALYSIS REQUIREMENTS:
1. **Critical Vulnerabilities**: Reentrancy, access control, integer overflow/underflow
2. **DeFi-Specific Risks**: Flash loan attacks, oracle manipulation, liquidity attacks
3. **MEV Vulnerabilities**: Front-running, sandwich attacks, timestamp manipulation
4. **Cross-Chain Risks**: Bridge vulnerabilities, cross-chain message attacks
5. **Governance Attacks**: Vote manipulation, proposal attacks, timelock bypasses
6. **Gas Optimization Issues**: Inefficient loops, redundant storage operations
7. **Code Quality**: Best practices, design patterns, maintainability

For each vulnerability found, provide:
- Exact line numbers and code snippets
- Severity level (critical/high/medium/low/info)
- Confidence score (0.0-1.0)
- Detailed technical explanation
- Specific remediation steps
- Real-world attack scenarios
- Gas impact analysis

RESPOND ONLY WITH VALID JSON:
{
  "vulnerabilities": [
    {
      "name": "string",
      "type": "string",
      "severity": "critical|high|medium|low|info",
      "confidence": 0.95,
      "affectedLines": "42-47",
      "codeSnippet": "string",
      "description": "string",
      "technicalDetails": "string",
      "attackScenario": "string",
      "remediation": "string",
      "gasImpact": "string",
      "references": ["string"],
      "cweId": "string",
      "swcId": "string"
    }
  ],
  "securityScore": 85,
  "riskLevel": "medium",
  "summary": "string",
  "recommendations": ["string"],
  "gasOptimizations": ["string"]
}`;
  }

  // Call specific LLM model with retry logic
  async callLLMModel(prompt, model, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(
          `${this.openRouterConfig.baseURL}/chat/completions`,
          {
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an elite smart contract security auditor. Respond only with valid JSON.'
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
            headers: this.openRouterConfig.headers,
            timeout: 60000,
          }
        );

        const content = response.data.choices[0].message.content;
        return {
          model: model,
          analysis: JSON.parse(content),
          tokens: response.data.usage?.total_tokens || 0,
          cost: this.calculateCost(model, response.data.usage?.total_tokens || 0)
        };
      } catch (error) {
        console.error(`Attempt ${attempt} failed for model ${model}:`, error.message);
        if (attempt === retries) throw error;
        await this.delay(1000 * attempt); // Exponential backoff
      }
    }
  }

  // Aggregate results from multiple AI models
  aggregateAIResults(aiResults, staticResults) {
    if (aiResults.length === 0) {
      throw new Error('No valid AI analysis results');
    }

    // Combine vulnerabilities from all models
    const allVulnerabilities = [];
    let totalTokens = 0;
    let totalCost = 0;

    aiResults.forEach(result => {
      if (result.analysis.vulnerabilities) {
        allVulnerabilities.push(...result.analysis.vulnerabilities);
      }
      totalTokens += result.tokens;
      totalCost += result.cost;
    });

    // Deduplicate and score vulnerabilities
    const uniqueVulnerabilities = this.deduplicateVulnerabilities(allVulnerabilities);
    
    // Calculate consensus security score
    const securityScores = aiResults
      .map(r => r.analysis.securityScore)
      .filter(score => typeof score === 'number');
    
    const avgSecurityScore = securityScores.length > 0 
      ? Math.round(securityScores.reduce((a, b) => a + b, 0) / securityScores.length)
      : 50;

    return {
      vulnerabilities: uniqueVulnerabilities,
      securityScore: avgSecurityScore,
      riskLevel: this.calculateRiskLevel(uniqueVulnerabilities, avgSecurityScore),
      staticAnalysisResults: staticResults,
      aiModelsUsed: aiResults.map(r => r.model),
      analysisMetadata: {
        totalTokens,
        totalCost,
        modelsUsed: aiResults.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Deduplicate similar vulnerabilities across models
  deduplicateVulnerabilities(vulnerabilities) {
    const unique = [];
    const seen = new Set();

    vulnerabilities.forEach(vuln => {
      const key = `${vuln.type}-${vuln.affectedLines}-${vuln.severity}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(vuln);
      }
    });

    return unique.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Calculate overall risk level
  calculateRiskLevel(vulnerabilities, securityScore) {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;

    if (criticalCount > 0 || securityScore < 30) return 'critical';
    if (highCount > 2 || securityScore < 50) return 'high';
    if (highCount > 0 || securityScore < 70) return 'medium';
    return 'low';
  }

  // Utility methods
  findLineNumbers(code, matches) {
    const lines = code.split('\n');
    const lineNumbers = [];
    
    matches.forEach(match => {
      const index = code.indexOf(match);
      const lineNumber = code.substring(0, index).split('\n').length;
      lineNumbers.push(lineNumber);
    });
    
    return [...new Set(lineNumbers)].sort((a, b) => a - b);
  }

  extractCodeSnippets(codeLines, lineNumbers) {
    return lineNumbers.map(lineNum => {
      const start = Math.max(0, lineNum - 2);
      const end = Math.min(codeLines.length, lineNum + 2);
      return codeLines.slice(start, end).join('\n');
    });
  }

  calculateCost(model, tokens) {
    const pricing = {
      'anthropic/claude-3.5-sonnet': 0.000015,
      'openai/gpt-4-turbo': 0.00001,
      'google/gemini-pro-1.5': 0.000005
    };
    return (pricing[model] || 0.00001) * tokens;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main analysis entry point
  async analyze(contractCode, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🔒 Security Agent: Starting advanced analysis...');
      
      // Perform static analysis
      const staticResults = await this.performStaticAnalysis(contractCode);
      console.log(`📊 Static analysis found ${staticResults.length} potential issues`);
      
      // Perform AI analysis
      const aiResults = await this.performAIAnalysis(contractCode, staticResults);
      console.log(`🤖 AI analysis completed with ${aiResults.vulnerabilities.length} vulnerabilities`);
      
      const executionTime = Date.now() - startTime;
      
      return {
        agent: this.name,
        version: this.version,
        ...aiResults,
        executionTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Security Agent analysis failed:', error);
      throw error;
    }
  }
}

module.exports = SecurityAgent;
