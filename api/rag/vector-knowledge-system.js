// =============================================
// NOVAGUARD RAG-BASED KNOWLEDGE SYSTEM
// Advanced vector database and retrieval system
// =============================================

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

class VectorKnowledgeSystem {
  constructor() {
    this.name = 'VectorKnowledgeSystem';
    this.version = '2.0.0';
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // OpenAI for embeddings
    this.openaiConfig = {
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    // Knowledge base categories
    this.knowledgeCategories = {
      'solidity-docs': {
        description: 'Official Solidity documentation',
        priority: 1,
        sources: [
          'https://docs.soliditylang.org/en/latest/',
          'https://solidity-by-example.org/'
        ]
      },
      'openzeppelin': {
        description: 'OpenZeppelin contracts and security patterns',
        priority: 1,
        sources: [
          'https://docs.openzeppelin.com/contracts/',
          'https://github.com/OpenZeppelin/openzeppelin-contracts'
        ]
      },
      'audit-checklist': {
        description: 'Security audit checklists and methodologies',
        priority: 2,
        sources: [
          'https://github.com/ConsenSys/smart-contract-best-practices',
          'https://swcregistry.io/',
          'https://github.com/crytic/building-secure-contracts'
        ]
      },
      'vulnerability-db': {
        description: 'Known vulnerability patterns and exploits',
        priority: 1,
        sources: [
          'https://swcregistry.io/',
          'https://consensys.github.io/smart-contract-best-practices/',
          'https://github.com/sigp/solidity-security-blog'
        ]
      },
      'best-practices': {
        description: 'Development best practices and patterns',
        priority: 2,
        sources: [
          'https://consensys.github.io/smart-contract-best-practices/',
          'https://github.com/ethereum/EIPs'
        ]
      },
      'defi-patterns': {
        description: 'DeFi protocols and tokenomics patterns',
        priority: 1,
        sources: [
          'https://github.com/defi-wonderland',
          'https://docs.uniswap.org/',
          'https://docs.aave.com/',
          'https://docs.compound.finance/'
        ]
      }
    };

    // Pre-indexed knowledge snippets for immediate use
    this.coreKnowledge = {
      reentrancy: {
        pattern: 'External calls followed by state changes',
        mitigation: 'Use checks-effects-interactions pattern or reentrancy guards',
        examples: ['DAO hack', 'Uniswap V1 vulnerability'],
        severity: 'critical'
      },
      accessControl: {
        pattern: 'Missing or weak access controls',
        mitigation: 'Use OpenZeppelin AccessControl or Ownable',
        examples: ['Parity wallet hack', 'BNB Bridge exploit'],
        severity: 'high'
      },
      flashLoanAttacks: {
        pattern: 'Price manipulation using borrowed funds',
        mitigation: 'Use time-weighted average prices (TWAP)',
        examples: ['bZx attacks', 'Harvest Finance exploit'],
        severity: 'critical'
      },
      governanceAttacks: {
        pattern: 'Malicious governance proposals',
        mitigation: 'Implement timelock and quorum requirements',
        examples: ['Compound governance attack', 'Beanstalk exploit'],
        severity: 'critical'
      }
    };
  }

  // Generate embeddings for text content
  async generateEmbedding(text) {
    try {
      const response = await axios.post(
        `${this.openaiConfig.baseURL}/embeddings`,
        {
          model: 'text-embedding-3-small',
          input: text,
          encoding_format: 'float'
        },
        { headers: this.openaiConfig.headers }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  // Index a document into the vector database
  async indexDocument(docType, title, content, metadata = {}) {
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(content);

      // Store in Supabase vector database
      const { data, error } = await this.supabase
        .from('vector_documents')
        .insert({
          doc_type: docType,
          title,
          content,
          embedding,
          metadata,
          source_url: metadata.source_url,
          version: metadata.version || '1.0',
          tags: metadata.tags || [],
          indexed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`📚 Indexed document: ${title} (${docType})`);
      return data;
    } catch (error) {
      console.error('Failed to index document:', error);
      throw error;
    }
  }

  // Perform semantic search in the knowledge base
  async semanticSearch(query, options = {}) {
    const {
      docTypes = null,
      limit = 10,
      similarityThreshold = 0.7,
      includeMetadata = true
    } = options;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Build the query
      let supabaseQuery = this.supabase
        .from('vector_documents')
        .select('*')
        .order('embedding <-> $1', { ascending: true })
        .limit(limit);

      // Filter by document types if specified
      if (docTypes && docTypes.length > 0) {
        supabaseQuery = supabaseQuery.in('doc_type', docTypes);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      // Filter by similarity threshold and add similarity scores
      const results = data
        .map(doc => ({
          ...doc,
          similarity: this.calculateCosineSimilarity(queryEmbedding, doc.embedding)
        }))
        .filter(doc => doc.similarity >= similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity);

      console.log(`🔍 Found ${results.length} relevant documents for query: "${query}"`);
      
      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  // Get context-aware knowledge for contract analysis
  async getContextualKnowledge(contractCode, analysisType = 'security') {
    try {
      // Extract key patterns and concepts from contract code
      const contractPatterns = this.extractContractPatterns(contractCode);
      
      // Generate search queries based on patterns
      const searchQueries = this.generateSearchQueries(contractPatterns, analysisType);
      
      // Perform multiple semantic searches
      const searchPromises = searchQueries.map(query => 
        this.semanticSearch(query.text, {
          docTypes: query.docTypes,
          limit: 5,
          similarityThreshold: 0.6
        })
      );

      const searchResults = await Promise.all(searchPromises);
      
      // Combine and deduplicate results
      const allResults = searchResults.flat();
      const uniqueResults = this.deduplicateResults(allResults);
      
      // Rank results by relevance and priority
      const rankedResults = this.rankResults(uniqueResults, contractPatterns, analysisType);
      
      // Format for AI consumption
      const contextualKnowledge = this.formatKnowledgeForAI(rankedResults, analysisType);
      
      console.log(`🧠 Retrieved ${uniqueResults.length} contextual knowledge items`);
      
      return contextualKnowledge;
    } catch (error) {
      console.error('Failed to get contextual knowledge:', error);
      return this.getFallbackKnowledge(analysisType);
    }
  }

  // Extract patterns from contract code
  extractContractPatterns(contractCode) {
    const patterns = {
      hasExternalCalls: /\.call\(|\.delegatecall\(|\.staticcall\(/gi.test(contractCode),
      hasStateChanges: /=\s*[^=]/gi.test(contractCode),
      hasLoops: /for\s*\(|while\s*\(/gi.test(contractCode),
      hasModifiers: /modifier\s+\w+/gi.test(contractCode),
      hasEvents: /emit\s+\w+/gi.test(contractCode),
      hasInheritance: /is\s+\w+/gi.test(contractCode),
      hasPayable: /payable/gi.test(contractCode),
      hasOwnership: /owner|onlyOwner/gi.test(contractCode),
      hasTokens: /ERC20|ERC721|ERC1155|token/gi.test(contractCode),
      hasDeFi: /swap|liquidity|stake|yield|farm|pool/gi.test(contractCode),
      hasGovernance: /vote|proposal|governance|timelock/gi.test(contractCode),
      hasOracles: /oracle|price|feed|chainlink/gi.test(contractCode),
      hasFlashLoans: /flashLoan|flash_loan|borrow.*repay/gi.test(contractCode),
      hasUpgradeable: /proxy|upgrade|implementation/gi.test(contractCode)
    };

    // Extract specific function names and contract types
    const functions = (contractCode.match(/function\s+(\w+)/gi) || [])
      .map(match => match.replace('function ', ''));
    
    const contractTypes = (contractCode.match(/contract\s+(\w+)/gi) || [])
      .map(match => match.replace('contract ', ''));

    return {
      ...patterns,
      functions,
      contractTypes,
      complexity: this.calculateComplexity(contractCode)
    };
  }

  // Generate targeted search queries based on contract patterns
  generateSearchQueries(patterns, analysisType) {
    const queries = [];

    // Security-focused queries
    if (analysisType === 'security' || analysisType === 'comprehensive') {
      if (patterns.hasExternalCalls) {
        queries.push({
          text: 'reentrancy attacks external calls security vulnerabilities',
          docTypes: ['vulnerability-db', 'audit-checklist'],
          priority: 1
        });
      }

      if (patterns.hasOwnership) {
        queries.push({
          text: 'access control ownership vulnerabilities privilege escalation',
          docTypes: ['vulnerability-db', 'best-practices'],
          priority: 1
        });
      }

      if (patterns.hasFlashLoans) {
        queries.push({
          text: 'flash loan attacks price manipulation DeFi exploits',
          docTypes: ['vulnerability-db', 'defi-patterns'],
          priority: 1
        });
      }
    }

    // Gas optimization queries
    if (analysisType === 'gas' || analysisType === 'comprehensive') {
      if (patterns.hasLoops) {
        queries.push({
          text: 'gas optimization loops array length caching unchecked arithmetic',
          docTypes: ['best-practices', 'solidity-docs'],
          priority: 2
        });
      }

      queries.push({
        text: 'solidity gas optimization storage packing function visibility',
        docTypes: ['best-practices', 'solidity-docs'],
        priority: 2
      });
    }

    // DeFi/Tokenomics queries
    if (analysisType === 'tokenomics' || analysisType === 'comprehensive') {
      if (patterns.hasDeFi) {
        queries.push({
          text: 'DeFi tokenomics liquidity mining yield farming economic attacks',
          docTypes: ['defi-patterns', 'vulnerability-db'],
          priority: 1
        });
      }

      if (patterns.hasGovernance) {
        queries.push({
          text: 'governance attacks voting mechanisms timelock security',
          docTypes: ['vulnerability-db', 'defi-patterns'],
          priority: 1
        });
      }
    }

    // OpenZeppelin patterns
    if (patterns.hasTokens || patterns.hasOwnership) {
      queries.push({
        text: 'OpenZeppelin contracts security patterns access control',
        docTypes: ['openzeppelin', 'best-practices'],
        priority: 2
      });
    }

    return queries.sort((a, b) => a.priority - b.priority);
  }

  // Calculate complexity score
  calculateComplexity(contractCode) {
    const metrics = {
      functions: (contractCode.match(/function\s+\w+/gi) || []).length,
      modifiers: (contractCode.match(/modifier\s+\w+/gi) || []).length,
      events: (contractCode.match(/event\s+\w+/gi) || []).length,
      structs: (contractCode.match(/struct\s+\w+/gi) || []).length,
      inheritance: (contractCode.match(/is\s+\w+/gi) || []).length,
      externalCalls: (contractCode.match(/\.call\(|\.delegatecall\(/gi) || []).length,
      loops: (contractCode.match(/for\s*\(|while\s*\(/gi) || []).length
    };

    return (
      metrics.functions * 0.1 +
      metrics.modifiers * 0.15 +
      metrics.events * 0.05 +
      metrics.structs * 0.1 +
      metrics.inheritance * 0.2 +
      metrics.externalCalls * 0.25 +
      metrics.loops * 0.15
    ) / 10;
  }

  // Deduplicate search results
  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = `${result.doc_type}-${result.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Rank results by relevance and priority
  rankResults(results, patterns, analysisType) {
    return results
      .map(result => ({
        ...result,
        relevanceScore: this.calculateRelevanceScore(result, patterns, analysisType)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20); // Top 20 most relevant
  }

  // Calculate relevance score
  calculateRelevanceScore(result, patterns, analysisType) {
    let score = result.similarity || 0;

    // Boost based on document type priority
    const categoryPriority = this.knowledgeCategories[result.doc_type]?.priority || 3;
    score += (4 - categoryPriority) * 0.1;

    // Boost based on analysis type relevance
    if (analysisType === 'security' && ['vulnerability-db', 'audit-checklist'].includes(result.doc_type)) {
      score += 0.2;
    }
    if (analysisType === 'gas' && ['best-practices', 'solidity-docs'].includes(result.doc_type)) {
      score += 0.2;
    }
    if (analysisType === 'tokenomics' && ['defi-patterns'].includes(result.doc_type)) {
      score += 0.2;
    }

    // Boost based on pattern matches in content
    const content = result.content.toLowerCase();
    if (patterns.hasFlashLoans && content.includes('flash loan')) score += 0.15;
    if (patterns.hasGovernance && content.includes('governance')) score += 0.15;
    if (patterns.hasDeFi && content.includes('defi')) score += 0.1;

    return Math.min(score, 1.0);
  }

  // Format knowledge for AI consumption
  formatKnowledgeForAI(results, analysisType) {
    const formattedKnowledge = {
      contextType: analysisType,
      totalSources: results.length,
      knowledgeItems: results.map(result => ({
        category: result.doc_type,
        title: result.title,
        content: result.content.substring(0, 1000), // Limit content length
        relevance: result.relevanceScore,
        source: result.source_url,
        tags: result.tags
      })),
      corePatterns: this.getRelevantCoreKnowledge(analysisType),
      summary: this.generateKnowledgeSummary(results, analysisType)
    };

    return formattedKnowledge;
  }

  // Get relevant core knowledge patterns
  getRelevantCoreKnowledge(analysisType) {
    const relevantPatterns = {};
    
    Object.entries(this.coreKnowledge).forEach(([key, value]) => {
      if (analysisType === 'comprehensive' || 
          (analysisType === 'security' && ['reentrancy', 'accessControl'].includes(key)) ||
          (analysisType === 'tokenomics' && ['flashLoanAttacks', 'governanceAttacks'].includes(key))) {
        relevantPatterns[key] = value;
      }
    });

    return relevantPatterns;
  }

  // Generate knowledge summary
  generateKnowledgeSummary(results, analysisType) {
    const categories = [...new Set(results.map(r => r.doc_type))];
    const avgRelevance = results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / results.length;

    return {
      analysisType,
      categoriesCovered: categories,
      averageRelevance: avgRelevance,
      topSources: results.slice(0, 3).map(r => r.title),
      knowledgeQuality: avgRelevance > 0.8 ? 'high' : avgRelevance > 0.6 ? 'medium' : 'low'
    };
  }

  // Fallback knowledge when RAG fails
  getFallbackKnowledge(analysisType) {
    return {
      contextType: analysisType,
      totalSources: 0,
      knowledgeItems: [],
      corePatterns: this.getRelevantCoreKnowledge(analysisType),
      summary: {
        analysisType,
        categoriesCovered: [],
        averageRelevance: 0,
        topSources: [],
        knowledgeQuality: 'fallback'
      },
      fallback: true
    };
  }

  // Calculate cosine similarity between two vectors
  calculateCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Batch index multiple documents
  async batchIndexDocuments(documents) {
    const results = [];
    const batchSize = 5; // Process in batches to avoid rate limits

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      const batchPromises = batch.map(doc => 
        this.indexDocument(doc.docType, doc.title, doc.content, doc.metadata)
          .catch(error => ({ error: error.message, doc }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting delay
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📚 Batch indexed ${results.filter(r => !r.error).length}/${documents.length} documents`);
    return results;
  }

  // Initialize knowledge base with core documents
  async initializeKnowledgeBase() {
    console.log('🚀 Initializing NovaGuard knowledge base...');
    
    // Check if knowledge base is already initialized
    const { count } = await this.supabase
      .from('vector_documents')
      .select('*', { count: 'exact', head: true });

    if (count > 0) {
      console.log(`📚 Knowledge base already contains ${count} documents`);
      return;
    }

    // Core security patterns to index
    const coreDocuments = [
      {
        docType: 'vulnerability-db',
        title: 'Reentrancy Attack Pattern',
        content: 'Reentrancy attacks occur when external calls are made before state changes are finalized. The attacker can recursively call back into the contract before the first invocation is finished. Use checks-effects-interactions pattern or reentrancy guards.',
        metadata: { severity: 'critical', tags: ['reentrancy', 'security'] }
      },
      {
        docType: 'vulnerability-db',
        title: 'Access Control Vulnerabilities',
        content: 'Missing or weak access controls allow unauthorized users to execute privileged functions. Always implement proper role-based access control using OpenZeppelin AccessControl or similar patterns.',
        metadata: { severity: 'high', tags: ['access-control', 'authorization'] }
      },
      {
        docType: 'defi-patterns',
        title: 'Flash Loan Attack Vectors',
        content: 'Flash loans enable attackers to manipulate prices and exploit DeFi protocols without initial capital. Implement time-weighted average prices (TWAP) and proper slippage protection.',
        metadata: { severity: 'critical', tags: ['flash-loans', 'defi', 'price-manipulation'] }
      },
      {
        docType: 'best-practices',
        title: 'Gas Optimization Techniques',
        content: 'Optimize gas usage through storage packing, function visibility optimization, loop optimization, and using unchecked arithmetic where safe. Cache array lengths and use memory instead of storage for temporary data.',
        metadata: { category: 'optimization', tags: ['gas', 'optimization', 'performance'] }
      }
    ];

    await this.batchIndexDocuments(coreDocuments);
    console.log('✅ Knowledge base initialization completed');
  }
}

module.exports = VectorKnowledgeSystem;
