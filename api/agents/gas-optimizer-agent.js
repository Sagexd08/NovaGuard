// =============================================
// NOVAGUARD GAS OPTIMIZER AGENT
// Advanced AI-powered gas optimization agent
// =============================================

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class GasOptimizerAgent {
  constructor() {
    this.name = 'GasOptimizerAgent';
    this.version = '2.0.0';
    this.capabilities = [
      'storage_optimization',
      'loop_optimization',
      'function_optimization',
      'struct_packing',
      'assembly_optimization',
      'batch_operations',
      'lazy_evaluation',
      'memory_vs_storage_analysis',
      'external_call_optimization',
      'event_optimization'
    ];

    this.openRouterConfig = {
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://novaguard.app',
        'X-Title': 'NovaGuard Gas Optimizer Agent'
      }
    };

    // Gas cost constants (in gas units)
    this.gasCosts = {
      SSTORE_SET: 20000,      // Setting storage from zero to non-zero
      SSTORE_RESET: 5000,     // Setting storage from non-zero to different non-zero
      SSTORE_CLEAR: 15000,    // Setting storage from non-zero to zero (with refund)
      SLOAD: 2100,            // Loading from storage
      MSTORE: 3,              // Storing to memory
      MLOAD: 3,               // Loading from memory
      CALL: 2600,             // External call base cost
      STATICCALL: 2600,       // Static call base cost
      DELEGATECALL: 2600,     // Delegate call base cost
      CREATE: 32000,          // Contract creation
      CREATE2: 32000,         // Contract creation with salt
      LOG0: 375,              // Event with no topics
      LOG1: 750,              // Event with 1 topic
      LOG2: 1125,             // Event with 2 topics
      LOG3: 1500,             // Event with 3 topics
      LOG4: 1875,             // Event with 4 topics
    };

    // Advanced optimization patterns
    this.optimizationPatterns = {
      storageOptimization: {
        patterns: [
          {
            name: 'Struct Packing',
            pattern: /struct\s+\w+\s*\{[\s\S]*?\}/gi,
            description: 'Optimize struct field ordering for storage packing',
            severity: 'medium',
            potentialSavings: 'Up to 20,000 gas per storage slot saved'
          },
          {
            name: 'Storage vs Memory',
            pattern: /storage\s+\w+\s*=\s*\w+\[/gi,
            description: 'Consider using memory for temporary data',
            severity: 'low',
            potentialSavings: 'Up to 2,000 gas per operation'
          }
        ]
      },
      loopOptimization: {
        patterns: [
          {
            name: 'Array Length Caching',
            pattern: /for\s*\(\s*\w+\s*=\s*0\s*;\s*\w+\s*<\s*\w+\.length\s*;\s*\w+\+\+\s*\)/gi,
            description: 'Cache array length to avoid repeated SLOAD operations',
            severity: 'medium',
            potentialSavings: '2,100 gas per iteration'
          },
          {
            name: 'Unchecked Arithmetic',
            pattern: /for\s*\([^}]*\+\+[^}]*\)/gi,
            description: 'Use unchecked arithmetic in loops when overflow is impossible',
            severity: 'low',
            potentialSavings: '120 gas per iteration'
          }
        ]
      },
      functionOptimization: {
        patterns: [
          {
            name: 'Function Visibility',
            pattern: /function\s+\w+\s*\([^)]*\)\s+public/gi,
            description: 'Use external instead of public for functions not called internally',
            severity: 'low',
            potentialSavings: '200-500 gas per call'
          },
          {
            name: 'Short Circuit Evaluation',
            pattern: /require\s*\([^&|]*&&[^)]*\)/gi,
            description: 'Optimize boolean expressions for short-circuit evaluation',
            severity: 'low',
            potentialSavings: '50-200 gas per check'
          }
        ]
      },
      assemblyOptimization: {
        patterns: [
          {
            name: 'Assembly Usage',
            pattern: /assembly\s*\{[\s\S]*?\}/gi,
            description: 'Inline assembly for gas-critical operations',
            severity: 'high',
            potentialSavings: '500-2000 gas per operation'
          }
        ]
      }
    };
  }

  // Advanced static gas analysis
  async performStaticGasAnalysis(contractCode) {
    const optimizations = [];
    const gasEstimates = {};

    // Analyze storage operations
    const storageOps = this.analyzeStorageOperations(contractCode);
    optimizations.push(...storageOps.optimizations);
    gasEstimates.storage = storageOps.estimates;

    // Analyze loops
    const loopOps = this.analyzeLoops(contractCode);
    optimizations.push(...loopOps.optimizations);
    gasEstimates.loops = loopOps.estimates;

    // Analyze function calls
    const functionOps = this.analyzeFunctions(contractCode);
    optimizations.push(...functionOps.optimizations);
    gasEstimates.functions = functionOps.estimates;

    // Analyze events
    const eventOps = this.analyzeEvents(contractCode);
    optimizations.push(...eventOps.optimizations);
    gasEstimates.events = eventOps.estimates;

    return {
      optimizations,
      gasEstimates,
      totalPotentialSavings: this.calculateTotalSavings(optimizations)
    };
  }

  // Analyze storage operations for optimization opportunities
  analyzeStorageOperations(contractCode) {
    const optimizations = [];
    const estimates = { reads: 0, writes: 0, totalCost: 0 };

    // Find struct definitions for packing analysis
    const structMatches = contractCode.match(/struct\s+\w+\s*\{[\s\S]*?\}/gi) || [];
    structMatches.forEach((struct, index) => {
      const fields = this.extractStructFields(struct);
      const packingAnalysis = this.analyzeStructPacking(fields);

      if (packingAnalysis.canOptimize) {
        optimizations.push({
          type: 'struct_packing',
          severity: 'medium',
          description: `Struct can be optimized to use ${packingAnalysis.optimizedSlots} slots instead of ${packingAnalysis.currentSlots}`,
          affectedCode: struct,
          potentialSavings: (packingAnalysis.currentSlots - packingAnalysis.optimizedSlots) * this.gasCosts.SSTORE_SET,
          recommendation: packingAnalysis.recommendation
        });
      }
    });

    // Find storage variable assignments
    const storageWrites = contractCode.match(/\w+\s*=\s*[^;]+;/gi) || [];
    estimates.writes = storageWrites.length;
    estimates.totalCost += storageWrites.length * this.gasCosts.SSTORE_SET;

    // Find storage variable reads
    const storageReads = contractCode.match(/\w+\[\w+\]/gi) || [];
    estimates.reads = storageReads.length;
    estimates.totalCost += storageReads.length * this.gasCosts.SLOAD;

    return { optimizations, estimates };
  }

  // Analyze loops for gas optimization
  analyzeLoops(contractCode) {
    const optimizations = [];
    const estimates = { loopCount: 0, totalCost: 0 };

    const loopMatches = contractCode.match(/for\s*\([^}]*\{[\s\S]*?\}/gi) || [];
    estimates.loopCount = loopMatches.length;

    loopMatches.forEach((loop, index) => {
      // Check for array length caching
      if (loop.includes('.length') && !loop.includes('uint256 length = ')) {
        optimizations.push({
          type: 'array_length_caching',
          severity: 'medium',
          description: 'Cache array length to save gas on each iteration',
          affectedCode: loop,
          potentialSavings: this.gasCosts.SLOAD * this.estimateIterations(loop),
          recommendation: 'Store array.length in a local variable before the loop'
        });
      }

      // Check for unchecked arithmetic
      if (loop.includes('++') && !loop.includes('unchecked')) {
        optimizations.push({
          type: 'unchecked_arithmetic',
          severity: 'low',
          description: 'Use unchecked arithmetic for loop counters when overflow is impossible',
          affectedCode: loop,
          potentialSavings: 120 * this.estimateIterations(loop),
          recommendation: 'Wrap increment operations in unchecked block'
        });
      }
    });

    return { optimizations, estimates };
  }

  // AI-powered gas optimization analysis
  async performAIOptimization(contractCode, staticResults = {}) {
    const prompt = this.buildGasOptimizationPrompt(contractCode, staticResults);

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

      return this.aggregateOptimizationResults(validAnalyses, staticResults);
    } catch (error) {
      console.error('AI gas optimization failed:', error);
      throw new Error(`Gas optimization AI analysis failed: ${error.message}`);
    }
  }

  // Build comprehensive gas optimization prompt
  buildGasOptimizationPrompt(contractCode, staticResults) {
    return `
You are an elite Solidity gas optimization expert with deep knowledge of EVM internals and advanced optimization techniques.

Analyze this contract for gas optimization opportunities:

CONTRACT CODE:
\`\`\`solidity
${contractCode}
\`\`\`

STATIC ANALYSIS RESULTS:
${JSON.stringify(staticResults, null, 2)}

OPTIMIZATION CATEGORIES TO ANALYZE:
1. **Storage Optimization**: Struct packing, storage vs memory, slot optimization
2. **Loop Optimization**: Array length caching, unchecked arithmetic, loop unrolling
3. **Function Optimization**: Visibility, modifiers, parameter packing
4. **Assembly Optimization**: Inline assembly for critical paths
5. **Batch Operations**: Combining multiple operations
6. **Event Optimization**: Topic usage, data packing
7. **External Call Optimization**: Call patterns, gas stipends
8. **Memory Management**: Memory vs storage trade-offs

For each optimization, provide:
- Exact line numbers and code snippets
- Current gas cost estimation
- Optimized gas cost estimation
- Gas savings amount
- Implementation difficulty (easy/medium/hard)
- Risk level (low/medium/high)
- Detailed implementation steps
- Before/after code examples

RESPOND ONLY WITH VALID JSON:
{
  "optimizations": [
    {
      "category": "storage|loop|function|assembly|batch|event|external|memory",
      "title": "string",
      "description": "string",
      "affectedLines": "42-47",
      "currentGasCost": 25000,
      "optimizedGasCost": 15000,
  // Advanced function analysis
  analyzeFunctions(contractCode) {
    const optimizations = [];
    const estimates = { functionCount: 0, totalCost: 0 };

    // Find function definitions
    const functionMatches = contractCode.match(/function\s+\w+\s*\([^)]*\)\s+\w+/gi) || [];
    estimates.functionCount = functionMatches.length;

    functionMatches.forEach((func, index) => {
      // Check for public vs external
      if (func.includes('public') && !contractCode.includes(`this.${func.match(/function\s+(\w+)/)[1]}`)) {
        optimizations.push({
          type: 'function_visibility',
          severity: 'low',
          description: 'Function can be external instead of public',
          affectedCode: func,
          potentialSavings: 300,
          recommendation: 'Change visibility from public to external'
        });
      }

      // Check for view/pure functions
      if (!func.includes('view') && !func.includes('pure') && !func.includes('payable')) {
        const funcBody = this.extractFunctionBody(contractCode, func);
        if (this.isViewFunction(funcBody)) {
          optimizations.push({
            type: 'function_state_mutability',
            severity: 'low',
            description: 'Function can be marked as view',
            affectedCode: func,
            potentialSavings: 200,
            recommendation: 'Add view modifier to function'
          });
        }
      }
    });

    return { optimizations, estimates };
  }

  // Analyze events for optimization
  analyzeEvents(contractCode) {
    const optimizations = [];
    const estimates = { eventCount: 0, totalCost: 0 };

    const eventMatches = contractCode.match(/emit\s+\w+\([^)]*\)/gi) || [];
    estimates.eventCount = eventMatches.length;

    eventMatches.forEach((event, index) => {
      const topicCount = (event.match(/,/g) || []).length + 1;
      estimates.totalCost += this.gasCosts[`LOG${Math.min(topicCount, 4)}`];

      // Check for excessive topics
      if (topicCount > 3) {
        optimizations.push({
          type: 'event_optimization',
          severity: 'low',
          description: 'Event has too many indexed parameters',
          affectedCode: event,
          potentialSavings: (topicCount - 3) * 375,
          recommendation: 'Reduce indexed parameters or pack data'
        });
      }
    });

    return { optimizations, estimates };
  }

  // Extract function body for analysis
  extractFunctionBody(contractCode, functionSignature) {
    const funcName = functionSignature.match(/function\s+(\w+)/)[1];
    const regex = new RegExp(`function\\s+${funcName}[^{]*\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}`, 'gi');
    const match = contractCode.match(regex);
    return match ? match[0] : '';
  }

  // Check if function can be view
  isViewFunction(functionBody) {
    const stateChangingKeywords = ['=', 'delete', 'emit', 'selfdestruct', 'delegatecall', 'call'];
    return !stateChangingKeywords.some(keyword => functionBody.includes(keyword));
  }
      "gasSavings": 10000,
      "difficulty": "easy|medium|hard",
      "riskLevel": "low|medium|high",
      "implementation": "string",
      "beforeCode": "string",
      "afterCode": "string",
      "notes": "string"
    }
  ],
  "gasScore": 75,
  "totalCurrentCost": 150000,
  "totalOptimizedCost": 120000,
  "totalSavings": 30000,
  "summary": "string",
  "priorityOptimizations": ["string"]
}`;
  }

  // Call LLM model for gas optimization
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
                content: 'You are an elite Solidity gas optimization expert. Respond only with valid JSON.'
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
        console.error(`Gas optimization attempt ${attempt} failed for model ${model}:`, error.message);
        if (attempt === retries) throw error;
        await this.delay(1000 * attempt);
      }
    }
  }

  // Aggregate optimization results from multiple models
  aggregateOptimizationResults(aiResults, staticResults) {
    if (aiResults.length === 0) {
      throw new Error('No valid AI optimization results');
    }

    const allOptimizations = [];
    let totalTokens = 0;

    aiResults.forEach(result => {
      if (result.analysis.optimizations) {
        allOptimizations.push(...result.analysis.optimizations);
      }
      totalTokens += result.tokens;
    });

    // Deduplicate and prioritize optimizations
    const uniqueOptimizations = this.deduplicateOptimizations(allOptimizations);

    // Calculate aggregated gas scores
    const gasScores = aiResults
      .map(r => r.analysis.gasScore)
      .filter(score => typeof score === 'number');

    const avgGasScore = gasScores.length > 0
      ? Math.round(gasScores.reduce((a, b) => a + b, 0) / gasScores.length)
      : 50;

    const totalSavings = uniqueOptimizations.reduce((sum, opt) => sum + (opt.gasSavings || 0), 0);

    return {
      optimizations: uniqueOptimizations,
      gasScore: avgGasScore,
      totalSavings,
      staticAnalysisResults: staticResults,
      aiModelsUsed: aiResults.map(r => r.model),
      analysisMetadata: {
        totalTokens,
        modelsUsed: aiResults.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Utility methods
  extractStructFields(structCode) {
    const fields = [];
    const fieldMatches = structCode.match(/\w+\s+\w+;/gi) || [];

    fieldMatches.forEach(field => {
      const [type, name] = field.replace(';', '').trim().split(/\s+/);
      fields.push({ type, name, size: this.getTypeSize(type) });
    });

    return fields;
  }

  analyzeStructPacking(fields) {
    const currentSlots = Math.ceil(fields.reduce((sum, field) => sum + field.size, 0) / 32);

    // Sort fields by size for optimal packing
    const sortedFields = [...fields].sort((a, b) => b.size - a.size);
    let currentSlot = 0;
    let currentSlotUsed = 0;

    sortedFields.forEach(field => {
      if (currentSlotUsed + field.size > 32) {
        currentSlot++;
        currentSlotUsed = field.size;
      } else {
        currentSlotUsed += field.size;
      }
    });

    const optimizedSlots = currentSlot + 1;

    return {
      currentSlots,
      optimizedSlots,
      canOptimize: optimizedSlots < currentSlots,
      recommendation: `Reorder fields: ${sortedFields.map(f => f.name).join(', ')}`
    };
  }

  getTypeSize(type) {
    if (type.includes('uint256') || type.includes('int256') || type === 'address') return 32;
    if (type.includes('uint128') || type.includes('int128')) return 16;
    if (type.includes('uint64') || type.includes('int64')) return 8;
    if (type.includes('uint32') || type.includes('int32')) return 4;
    if (type.includes('uint16') || type.includes('int16')) return 2;
    if (type.includes('uint8') || type.includes('int8') || type === 'bool') return 1;
    return 32; // Default for unknown types
  }

  estimateIterations(loopCode) {
    // Simple heuristic - could be enhanced with more sophisticated analysis
    if (loopCode.includes('length')) return 10; // Assume average array length
    return 5; // Default estimate
  }

  calculateTotalSavings(optimizations) {
    return optimizations.reduce((total, opt) => total + (opt.potentialSavings || 0), 0);
  }

  deduplicateOptimizations(optimizations) {
    const unique = [];
    const seen = new Set();

    optimizations.forEach(opt => {
      const key = `${opt.category}-${opt.affectedLines}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(opt);
      }
    });

    return unique.sort((a, b) => (b.gasSavings || 0) - (a.gasSavings || 0));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main analysis entry point
  async analyze(contractCode, options = {}) {
    const startTime = Date.now();

    try {
      console.log('⛽ Gas Optimizer Agent: Starting analysis...');

      // Perform static gas analysis
      const staticResults = await this.performStaticGasAnalysis(contractCode);
      console.log(`📊 Static analysis found ${staticResults.optimizations.length} optimization opportunities`);

      // Perform AI optimization analysis
      const aiResults = await this.performAIOptimization(contractCode, staticResults);
      console.log(`🤖 AI analysis found ${aiResults.optimizations.length} optimizations`);

      const executionTime = Date.now() - startTime;

      return {
        agent: this.name,
        version: this.version,
        ...aiResults,
        executionTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Gas Optimizer Agent analysis failed:', error);
      throw error;
    }
  }
}

module.exports = GasOptimizerAgent;
