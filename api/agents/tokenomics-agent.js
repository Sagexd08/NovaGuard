// =============================================
// NOVAGUARD TOKENOMICS AGENT
// Advanced DeFi tokenomics and economic analysis agent
// =============================================

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class TokenomicsAgent {
  constructor() {
    this.name = 'TokenomicsAgent';
    this.version = '2.0.0';
    this.capabilities = [
      'token_distribution_analysis',
      'liquidity_mechanism_analysis',
      'governance_token_analysis',
      'yield_farming_analysis',
      'flash_loan_resistance',
      'mev_extraction_analysis',
      'economic_attack_vectors',
      'inflation_deflation_mechanics',
      'fee_structure_analysis',
      'arbitrage_opportunities',
      'liquidity_mining_sustainability',
      'token_velocity_analysis'
    ];

    this.openRouterConfig = {
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://novaguard.app',
        'X-Title': 'NovaGuard Tokenomics Agent'
      }
    };

    // DeFi protocol patterns and risks
    this.defiPatterns = {
      liquidityPools: {
        patterns: [
          /addLiquidity|removeLiquidity/gi,
          /getReserves|getAmountOut/gi,
          /swap|swapExactTokensFor/gi
        ],
        risks: ['impermanent_loss', 'liquidity_drain', 'sandwich_attacks'],
        severity: 'high'
      },
      yieldFarming: {
        patterns: [
          /stake|unstake|harvest/gi,
          /rewardPerToken|earned/gi,
          /updateReward|getReward/gi
        ],
        risks: ['reward_manipulation', 'early_exit_penalties', 'inflation_attacks'],
        severity: 'medium'
      },
      governance: {
        patterns: [
          /propose|vote|execute/gi,
          /quorum|threshold/gi,
          /timelock|delay/gi
        ],
        risks: ['governance_attacks', 'vote_buying', 'proposal_spam'],
        severity: 'critical'
      },
      flashLoans: {
        patterns: [
          /flashLoan|flash_loan/gi,
          /borrow.*repay/gi,
          /onFlashLoan/gi
        ],
        risks: ['price_manipulation', 'governance_attacks', 'liquidity_attacks'],
        severity: 'critical'
      },
      oracles: {
        patterns: [
          /getPrice|latestRoundData/gi,
          /oracle|price.*feed/gi,
          /twap|time.*weighted/gi
        ],
        risks: ['oracle_manipulation', 'price_deviation', 'stale_prices'],
        severity: 'high'
      }
    };

    // Economic attack vectors
    this.economicAttacks = {
      flashLoanAttacks: {
        description: 'Manipulation using borrowed capital',
        indicators: ['large_borrows', 'price_manipulation', 'governance_voting'],
        severity: 'critical'
      },
      sandwichAttacks: {
        description: 'MEV extraction through transaction ordering',
        indicators: ['slippage_tolerance', 'deadline_parameters', 'amm_swaps'],
        severity: 'high'
      },
      liquidityDrains: {
        description: 'Rapid liquidity removal causing instability',
        indicators: ['emergency_withdrawals', 'liquidity_incentives', 'exit_penalties'],
        severity: 'high'
      },
      governanceAttacks: {
        description: 'Malicious governance proposals',
        indicators: ['low_quorum', 'short_timelock', 'token_concentration'],
        severity: 'critical'
      },
      inflationAttacks: {
        description: 'Token supply manipulation',
        indicators: ['mint_functions', 'supply_controls', 'burn_mechanisms'],
        severity: 'medium'
      }
    };
  }

  // Analyze token distribution and concentration
  async analyzeTokenDistribution(contractCode) {
    const analysis = {
      distributionMechanism: 'unknown',
      concentrationRisks: [],
      vestingSchedules: [],
      mintingControls: []
    };

    // Check for minting functions
    const mintPatterns = contractCode.match(/function\s+mint\s*\([^)]*\)/gi) || [];
    if (mintPatterns.length > 0) {
      analysis.mintingControls.push({
        type: 'mint_function',
        description: 'Contract has minting capability',
        risk: 'inflation_risk',
        severity: 'medium'
      });
    }

    // Check for burn mechanisms
    const burnPatterns = contractCode.match(/function\s+burn\s*\([^)]*\)|_burn\s*\(/gi) || [];
    if (burnPatterns.length > 0) {
      analysis.mintingControls.push({
        type: 'burn_mechanism',
        description: 'Contract has token burning capability',
        risk: 'deflation_control',
        severity: 'low'
      });
    }

    // Check for ownership concentration
    const ownerPatterns = contractCode.match(/onlyOwner|owner\s*==|msg\.sender\s*==\s*owner/gi) || [];
    if (ownerPatterns.length > 5) {
      analysis.concentrationRisks.push({
        type: 'centralized_control',
        description: 'High concentration of owner-only functions',
        risk: 'centralization_risk',
        severity: 'high'
      });
    }

    return analysis;
  }

  // Analyze liquidity mechanisms
  async analyzeLiquidityMechanisms(contractCode) {
    const analysis = {
      poolTypes: [],
      liquidityIncentives: [],
      impermanentLossRisks: [],
      liquidityProtections: []
    };

    // Detect AMM patterns
    if (contractCode.match(/addLiquidity|removeLiquidity/gi)) {
      analysis.poolTypes.push({
        type: 'amm_pool',
        description: 'Automated Market Maker liquidity pool',
        risks: ['impermanent_loss', 'liquidity_drain'],
        severity: 'medium'
      });
    }

    // Detect staking mechanisms
    if (contractCode.match(/stake|unstake/gi)) {
      analysis.liquidityIncentives.push({
        type: 'staking_rewards',
        description: 'Staking mechanism for liquidity incentives',
        risks: ['reward_manipulation', 'early_exit'],
        severity: 'medium'
      });
    }

    // Check for liquidity locks
    if (contractCode.match(/lock|unlock|timelock/gi)) {
      analysis.liquidityProtections.push({
        type: 'liquidity_lock',
        description: 'Liquidity locking mechanism detected',
        protection: 'rug_pull_protection',
        severity: 'low'
      });
    }

    return analysis;
  }

  // Analyze governance mechanisms
  async analyzeGovernance(contractCode) {
    const analysis = {
      governanceType: 'none',
      votingMechanisms: [],
      proposalThresholds: [],
      timelockMechanisms: [],
      risks: []
    };

    // Check for governance functions
    const govPatterns = contractCode.match(/function\s+(propose|vote|execute)\s*\([^)]*\)/gi) || [];
    if (govPatterns.length > 0) {
      analysis.governanceType = 'on_chain';
      
      // Check for quorum requirements
      if (contractCode.match(/quorum|threshold/gi)) {
        analysis.proposalThresholds.push({
          type: 'quorum_requirement',
          description: 'Quorum threshold for proposals',
          protection: 'minority_protection'
        });
      } else {
        analysis.risks.push({
          type: 'no_quorum',
          description: 'No quorum requirements detected',
          risk: 'governance_attack',
          severity: 'high'
        });
      }

      // Check for timelock
      if (contractCode.match(/timelock|delay/gi)) {
        analysis.timelockMechanisms.push({
          type: 'execution_delay',
          description: 'Timelock mechanism for proposal execution',
          protection: 'emergency_response_time'
        });
      } else {
        analysis.risks.push({
          type: 'no_timelock',
          description: 'No timelock mechanism detected',
          risk: 'instant_execution',
          severity: 'critical'
        });
      }
    }

    return analysis;
  }

  // AI-powered tokenomics analysis
  async performAITokenomicsAnalysis(contractCode, staticResults = {}) {
    const prompt = this.buildTokenomicsPrompt(contractCode, staticResults);
    
    try {
      const models = [
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4-turbo'
      ];

      const analyses = await Promise.allSettled(
        models.map(model => this.callLLMModel(prompt, model))
      );

      const validAnalyses = analyses
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      return this.aggregateTokenomicsResults(validAnalyses, staticResults);
    } catch (error) {
      console.error('AI tokenomics analysis failed:', error);
      throw new Error(`Tokenomics AI analysis failed: ${error.message}`);
    }
  }

  // Build comprehensive tokenomics analysis prompt
  buildTokenomicsPrompt(contractCode, staticResults) {
    return `
You are an elite DeFi tokenomics expert with deep knowledge of economic attack vectors, liquidity mechanisms, and governance systems.

Analyze this contract for tokenomics and economic risks:

CONTRACT CODE:
\`\`\`solidity
${contractCode}
\`\`\`

STATIC ANALYSIS RESULTS:
${JSON.stringify(staticResults, null, 2)}

TOKENOMICS ANALYSIS AREAS:
1. **Token Distribution**: Supply mechanisms, minting/burning, concentration risks
2. **Liquidity Mechanisms**: AMM pools, staking, yield farming, liquidity mining
3. **Governance Systems**: Voting mechanisms, proposal thresholds, timelock systems
4. **Economic Attack Vectors**: Flash loan attacks, governance attacks, MEV extraction
5. **Incentive Alignment**: Reward mechanisms, penalty systems, long-term sustainability
6. **Oracle Dependencies**: Price feeds, manipulation resistance, fallback mechanisms
7. **Cross-Protocol Risks**: Composability risks, external dependencies
8. **Market Dynamics**: Token velocity, inflation/deflation, fee structures

For each finding, provide:
- Economic impact assessment
- Attack vector analysis
- Likelihood and severity
- Mitigation strategies
- Long-term sustainability concerns

RESPOND ONLY WITH VALID JSON:
{
  "tokenomicsFindings": [
    {
      "category": "distribution|liquidity|governance|economic_attack|incentives|oracle|cross_protocol|market_dynamics",
      "title": "string",
      "description": "string",
      "severity": "critical|high|medium|low|info",
      "likelihood": "very_high|high|medium|low|very_low",
      "economicImpact": "string",
      "attackVector": "string",
      "mitigation": "string",
      "affectedMechanisms": ["string"],
      "sustainabilityConcerns": "string"
    }
  ],
  "tokenomicsScore": 75,
  "overallRisk": "low|medium|high|critical",
  "keyRisks": ["string"],
  "recommendations": ["string"],
  "sustainabilityAssessment": "string"
}`;
  }

  // Call LLM model for tokenomics analysis
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
                content: 'You are an elite DeFi tokenomics expert. Respond only with valid JSON.'
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
          tokens: response.data.usage?.total_tokens || 0
        };
      } catch (error) {
        console.error(`Tokenomics analysis attempt ${attempt} failed for model ${model}:`, error.message);
        if (attempt === retries) throw error;
        await this.delay(1000 * attempt);
      }
    }
  }

  // Aggregate tokenomics results
  aggregateTokenomicsResults(aiResults, staticResults) {
    if (aiResults.length === 0) {
      throw new Error('No valid AI tokenomics results');
    }

    const allFindings = [];
    let totalTokens = 0;

    aiResults.forEach(result => {
      if (result.analysis.tokenomicsFindings) {
        allFindings.push(...result.analysis.tokenomicsFindings);
      }
      totalTokens += result.tokens;
    });

    // Deduplicate and prioritize findings
    const uniqueFindings = this.deduplicateFindings(allFindings);
    
    // Calculate aggregated scores
    const tokenomicsScores = aiResults
      .map(r => r.analysis.tokenomicsScore)
      .filter(score => typeof score === 'number');
    
    const avgTokenomicsScore = tokenomicsScores.length > 0 
      ? Math.round(tokenomicsScores.reduce((a, b) => a + b, 0) / tokenomicsScores.length)
      : 50;

    const overallRisk = this.calculateOverallRisk(uniqueFindings, avgTokenomicsScore);

    return {
      findings: uniqueFindings,
      tokenomicsScore: avgTokenomicsScore,
      overallRisk,
      staticAnalysisResults: staticResults,
      aiModelsUsed: aiResults.map(r => r.model),
      analysisMetadata: {
        totalTokens,
        modelsUsed: aiResults.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Calculate overall risk level
  calculateOverallRisk(findings, score) {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;

    if (criticalCount > 0 || score < 30) return 'critical';
    if (highCount > 2 || score < 50) return 'high';
    if (highCount > 0 || score < 70) return 'medium';
    return 'low';
  }

  // Deduplicate similar findings
  deduplicateFindings(findings) {
    const unique = [];
    const seen = new Set();

    findings.forEach(finding => {
      const key = `${finding.category}-${finding.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(finding);
      }
    });

    return unique.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main analysis entry point
  async analyze(contractCode, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('💰 Tokenomics Agent: Starting economic analysis...');
      
      // Perform static tokenomics analysis
      const tokenDistribution = await this.analyzeTokenDistribution(contractCode);
      const liquidityMechanisms = await this.analyzeLiquidityMechanisms(contractCode);
      const governance = await this.analyzeGovernance(contractCode);
      
      const staticResults = {
        tokenDistribution,
        liquidityMechanisms,
        governance
      };
      
      console.log('📊 Static tokenomics analysis completed');
      
      // Perform AI analysis
      const aiResults = await this.performAITokenomicsAnalysis(contractCode, staticResults);
      console.log(`🤖 AI analysis found ${aiResults.findings.length} tokenomics findings`);
      
      const executionTime = Date.now() - startTime;
      
      return {
        agent: this.name,
        version: this.version,
        ...aiResults,
        executionTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Tokenomics Agent analysis failed:', error);
      throw error;
    }
  }
}

module.exports = TokenomicsAgent;
