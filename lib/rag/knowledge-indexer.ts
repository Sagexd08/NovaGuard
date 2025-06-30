// =============================================
// NOVAGUARD KNOWLEDGE INDEXER
// Advanced RAG system for smart contract knowledge
// =============================================

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Document types for knowledge base
export type DocumentType =
  | 'solidity_docs'
  | 'openzeppelin_contracts'
  | 'audit_playbooks'
  | 'vulnerability_database'
  | 'gas_optimization_patterns'
  | 'defi_patterns'
  | 'security_best_practices'
  | 'eip_standards'

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  type: DocumentType
  source: string
  url?: string
  metadata: {
    version?: string
    category?: string
    tags?: string[]
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    lastUpdated?: string
    author?: string
  }
  embedding?: number[]
  createdAt: Date
  updatedAt: Date
}

export interface ChunkDocument {
  id: string
  documentId: string
  content: string
  chunkIndex: number
  embedding: number[]
  metadata: Record<string, any>
}

export class KnowledgeIndexer {
  private textSplitter: RecursiveCharacterTextSplitter

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', '']
    })
  }

  // Index a single document
  async indexDocument(document: Omit<KnowledgeDocument, 'id' | 'embedding' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log(`📚 Indexing document: ${document.title}`)

      // Generate document ID
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Split document into chunks
      const chunks = await this.textSplitter.splitText(document.content)
      console.log(`📄 Split into ${chunks.length} chunks`)

      // Generate embeddings for each chunk
      const chunkDocuments: ChunkDocument[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = await this.generateEmbedding(chunk)

        chunkDocuments.push({
          id: `${documentId}_chunk_${i}`,
          documentId,
          content: chunk,
          chunkIndex: i,
          embedding,
          metadata: {
            ...document.metadata,
            chunkIndex: i,
            totalChunks: chunks.length
          }
        })
      }

      // Generate embedding for full document
      const documentEmbedding = await this.generateEmbedding(
        `${document.title}\n\n${document.content.substring(0, 2000)}`
      )

      // Store document in database
      const { error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          id: documentId,
          title: document.title,
          content: document.content,
          type: document.type,
          source: document.source,
          url: document.url,
          metadata: document.metadata,
          embedding: documentEmbedding,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (docError) {
        throw new Error(`Failed to store document: ${docError.message}`)
      }

      // Store chunks in database
      const { error: chunkError } = await supabase
        .from('knowledge_chunks')
        .insert(
          chunkDocuments.map(chunk => ({
            id: chunk.id,
            document_id: chunk.documentId,
            content: chunk.content,
            chunk_index: chunk.chunkIndex,
            embedding: chunk.embedding,
            metadata: chunk.metadata
          }))
        )

      if (chunkError) {
        throw new Error(`Failed to store chunks: ${chunkError.message}`)
      }

      console.log(`✅ Successfully indexed document: ${document.title}`)
      return documentId

    } catch (error) {
      console.error(`❌ Failed to index document: ${document.title}`, error)
      throw error
    }
  }

  // Batch index multiple documents
  async batchIndexDocuments(documents: Omit<KnowledgeDocument, 'id' | 'embedding' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    const documentIds: string[] = []

    for (const document of documents) {
      try {
        const documentId = await this.indexDocument(document)
        documentIds.push(documentId)
      } catch (error) {
        console.error(`Failed to index document: ${document.title}`, error)
        // Continue with other documents
      }
    }

    return documentIds
  }

  // Generate embedding using OpenAI
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' ').trim()
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      throw new Error('Failed to generate embedding')
    }
  }

  // Index Solidity documentation
  async indexSolidityDocs(): Promise<void> {
    console.log('📚 Indexing Solidity documentation...')

    const solidityDocs = [
      {
        title: 'Solidity Language Basics',
        content: `
Solidity is a statically-typed curly-braces programming language designed for developing smart contracts that run on Ethereum.

Key Features:
- Statically typed
- Supports inheritance, libraries and complex user-defined types
- Compiled to bytecode that runs on the Ethereum Virtual Machine (EVM)
- Influenced by C++, Python and JavaScript

Basic Syntax:
- Contract declarations: contract MyContract { }
- State variables: uint256 public myVariable;
- Functions: function myFunction() public { }
- Modifiers: modifier onlyOwner() { require(msg.sender == owner); _; }
- Events: event Transfer(address indexed from, address indexed to, uint256 value);

Data Types:
- Boolean: bool
- Integers: int/uint (8 to 256 bits)
- Address: address (20 bytes)
- Fixed-size byte arrays: bytes1 to bytes32
- Dynamic arrays: uint[] or bytes
- Mappings: mapping(address => uint256)
- Structs and enums

Visibility Specifiers:
- public: accessible from anywhere
- private: only within the same contract
- internal: within the same contract and derived contracts
- external: only from outside the contract
        `,
        type: 'solidity_docs' as DocumentType,
        source: 'Solidity Official Documentation',
        url: 'https://docs.soliditylang.org/',
        metadata: {
          category: 'language_basics',
          tags: ['solidity', 'basics', 'syntax'],
          difficulty: 'beginner' as const
        }
      },
      {
        title: 'Smart Contract Security Patterns',
        content: `
Security is paramount in smart contract development. Here are essential security patterns:

1. Checks-Effects-Interactions Pattern:
Always follow this order:
- Checks: Validate conditions and inputs
- Effects: Update state variables
- Interactions: Call external contracts

Example:
function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount); // Checks
    balances[msg.sender] -= amount;          // Effects
    msg.sender.transfer(amount);             // Interactions
}

2. Reentrancy Guard:
Use a state variable to prevent recursive calls:
bool private locked;
modifier noReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}

3. Pull over Push Pattern:
Instead of pushing payments, let users withdraw:
mapping(address => uint) public pendingWithdrawals;

function withdraw() public {
    uint amount = pendingWithdrawals[msg.sender];
    pendingWithdrawals[msg.sender] = 0;
    msg.sender.transfer(amount);
}

4. Access Control:
Use modifiers for access control:
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

5. Circuit Breaker:
Implement emergency stops:
bool public stopped = false;
modifier stopInEmergency() {
    require(!stopped, "Contract is stopped");
    _;
}
        `,
        type: 'security_best_practices' as DocumentType,
        source: 'Smart Contract Security Patterns',
        metadata: {
          category: 'security',
          tags: ['security', 'patterns', 'best-practices'],
          difficulty: 'intermediate' as const
        }
      }
    ]

    await this.batchIndexDocuments(solidityDocs)
    console.log('✅ Solidity documentation indexed')
  }

  // Index OpenZeppelin contracts
  async indexOpenZeppelinContracts(): Promise<void> {
  // Semantic search using vector similarity
  async semanticSearch(
    query: string,
    options: {
      limit?: number
      threshold?: number
      types?: DocumentType[]
      includeMetadata?: boolean
    } = {}
  ): Promise<{
    documents: Array<{
      id: string
      title: string
      content: string
      type: DocumentType
      similarity: number
      metadata?: any
    }>
    chunks: Array<{
      id: string
      content: string
      similarity: number
      documentId: string
      metadata?: any
    }>
  }> {
    const { limit = 10, threshold = 0.7, types, includeMetadata = true } = options

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query)

      // Search documents
      let documentQuery = supabase.rpc('match_knowledge_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      })

      if (types && types.length > 0) {
        documentQuery = documentQuery.in('type', types)
      }

      const { data: documents, error: docError } = await documentQuery

      if (docError) {
        throw new Error(`Document search failed: ${docError.message}`)
      }

      // Search chunks for more granular results
      let chunkQuery = supabase.rpc('match_knowledge_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit * 2
      })

      const { data: chunks, error: chunkError } = await chunkQuery

      if (chunkError) {
        throw new Error(`Chunk search failed: ${chunkError.message}`)
      }

      return {
        documents: documents?.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          type: doc.type,
          similarity: doc.similarity,
          metadata: includeMetadata ? doc.metadata : undefined
        })) || [],
        chunks: chunks?.map((chunk: any) => ({
          id: chunk.id,
          content: chunk.content,
          similarity: chunk.similarity,
          documentId: chunk.document_id,
          metadata: includeMetadata ? chunk.metadata : undefined
        })) || []
      }
    } catch (error) {
      console.error('Semantic search failed:', error)
      throw error
    }
  }

  // Generate embedding for search query
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.replace(/\n/g, ' ').trim()
    })

    return response.data[0].embedding
  }

  // Hybrid search combining semantic and keyword search
  async hybridSearch(
    query: string,
    options: {
      limit?: number
      semanticWeight?: number
      keywordWeight?: number
      types?: DocumentType[]
    } = {}
  ): Promise<Array<{
    id: string
    title: string
    content: string
    type: DocumentType
    score: number
    metadata?: any
  }>> {
    const {
      limit = 10,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      types
    } = options

    // Perform semantic search
    const semanticResults = await this.semanticSearch(query, {
      limit: limit * 2,
      types,
      threshold: 0.5
    })

    // Perform keyword search
    const keywordResults = await this.keywordSearch(query, {
      limit: limit * 2,
      types
    })

    // Combine and rank results
    const combinedResults = new Map<string, any>()

    // Add semantic results
    semanticResults.documents.forEach(doc => {
      combinedResults.set(doc.id, {
        ...doc,
        semanticScore: doc.similarity,
        keywordScore: 0,
        combinedScore: doc.similarity * semanticWeight
      })
    })

    // Add keyword results
    keywordResults.forEach(doc => {
      if (combinedResults.has(doc.id)) {
        const existing = combinedResults.get(doc.id)
        existing.keywordScore = doc.score
        existing.combinedScore = (existing.semanticScore * semanticWeight) + (doc.score * keywordWeight)
      } else {
        combinedResults.set(doc.id, {
          ...doc,
          semanticScore: 0,
          keywordScore: doc.score,
          combinedScore: doc.score * keywordWeight
        })
      }
    })

    // Sort by combined score and return top results
    return Array.from(combinedResults.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit)
      .map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        type: result.type,
        score: result.combinedScore,
        metadata: result.metadata
      }))
  }

  // Keyword-based search using full-text search
  async keywordSearch(
    query: string,
    options: {
      limit?: number
      types?: DocumentType[]
    } = {}
  ): Promise<Array<{
    id: string
    title: string
    content: string
    type: DocumentType
    score: number
    metadata?: any
  }>> {
    const { limit = 10, types } = options

    let searchQuery = supabase
      .from('knowledge_documents')
      .select('*')
      .textSearch('content', query, { type: 'websearch' })
      .limit(limit)

    if (types && types.length > 0) {
      searchQuery = searchQuery.in('type', types)
    }

    const { data, error } = await searchQuery

    if (error) {
      throw new Error(`Keyword search failed: ${error.message}`)
    }

    return data?.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      type: doc.type,
      score: 1.0, // Full-text search doesn't provide relevance scores
      metadata: doc.metadata
    })) || []
  }

  // Get context for a specific question
  async getContextForQuestion(
    question: string,
    contractCode?: string,
    options: {
      maxTokens?: number
      includeTypes?: DocumentType[]
    } = {}
  ): Promise<{
    context: string
    sources: Array<{
      title: string
      type: DocumentType
      url?: string
    }>
  }> {
    const { maxTokens = 4000, includeTypes } = options

    // Enhance query with contract context
    let enhancedQuery = question
    if (contractCode) {
      enhancedQuery = `${question}\n\nContract context:\n${contractCode.substring(0, 1000)}`
    }

    // Search for relevant knowledge
    const results = await this.hybridSearch(enhancedQuery, {
      limit: 20,
      types: includeTypes
    })

    // Build context string within token limit
    let context = ''
    const sources: Array<{ title: string; type: DocumentType; url?: string }> = []
    let tokenCount = 0

    for (const result of results) {
      const resultText = `${result.title}\n${result.content}\n\n`
      const resultTokens = Math.ceil(resultText.length / 4) // Rough token estimation

      if (tokenCount + resultTokens > maxTokens) {
        break
      }

      context += resultText
      tokenCount += resultTokens

      sources.push({
        title: result.title,
        type: result.type,
        url: result.metadata?.url
      })
    }

    return { context, sources }
  }
}

// Knowledge retrieval and search functionality
export class KnowledgeRetriever {
  // Semantic search using vector similarity
  async semanticSearch(
    query: string,
    options: {
      limit?: number
      threshold?: number
      types?: DocumentType[]
      includeMetadata?: boolean
    } = {}
  ): Promise<{
    documents: Array<{
      id: string
      title: string
      content: string
      type: DocumentType
      similarity: number
      metadata?: any
    }>
    chunks: Array<{
      id: string
      content: string
      similarity: number
      documentId: string
      metadata?: any
    }>
  }> {
    const { limit = 10, threshold = 0.7, types, includeMetadata = true } = options

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query)

      // Search documents
      let documentQuery = supabase.rpc('match_knowledge_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      })

      if (types && types.length > 0) {
        documentQuery = documentQuery.in('type', types)
      }

      const { data: documents, error: docError } = await documentQuery

      if (docError) {
        throw new Error(`Document search failed: ${docError.message}`)
      }

      // Search chunks for more granular results
      let chunkQuery = supabase.rpc('match_knowledge_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit * 2
      })

      const { data: chunks, error: chunkError } = await chunkQuery

      if (chunkError) {
        throw new Error(`Chunk search failed: ${chunkError.message}`)
      }

      return {
        documents: documents?.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          type: doc.type,
          similarity: doc.similarity,
          metadata: includeMetadata ? doc.metadata : undefined
        })) || [],
        chunks: chunks?.map((chunk: any) => ({
          id: chunk.id,
          content: chunk.content,
          similarity: chunk.similarity,
          documentId: chunk.document_id,
          metadata: includeMetadata ? chunk.metadata : undefined
        })) || []
      }
    } catch (error) {
      console.error('Semantic search failed:', error)
      throw error
    }
  }

  // Generate embedding for search query
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.replace(/\n/g, ' ').trim()
    })

    return response.data[0].embedding
  }

  // Get context for a specific question
  async getContextForQuestion(
    question: string,
    contractCode?: string,
    options: {
      maxTokens?: number
      includeTypes?: DocumentType[]
    } = {}
  ): Promise<{
    context: string
    sources: Array<{
      title: string
      type: DocumentType
      url?: string
    }>
  }> {
    const { maxTokens = 4000, includeTypes } = options

    // Enhance query with contract context
    let enhancedQuery = question
    if (contractCode) {
      enhancedQuery = `${question}\n\nContract context:\n${contractCode.substring(0, 1000)}`
    }

    // Search for relevant knowledge
    const results = await this.semanticSearch(enhancedQuery, {
      limit: 20,
      types: includeTypes,
      threshold: 0.5
    })

    // Build context string within token limit
    let context = ''
    const sources: Array<{ title: string; type: DocumentType; url?: string }> = []
    let tokenCount = 0

    for (const result of results.documents) {
      const resultText = `${result.title}\n${result.content}\n\n`
      const resultTokens = Math.ceil(resultText.length / 4) // Rough token estimation

      if (tokenCount + resultTokens > maxTokens) {
        break
      }

      context += resultText
      tokenCount += resultTokens

      sources.push({
        title: result.title,
        type: result.type,
        url: result.metadata?.url
      })
    }

    return { context, sources }
  }
}
    console.log('📚 Indexing OpenZeppelin contracts...')

    const ozContracts = [
      {
        title: 'OpenZeppelin ERC20 Token Standard',
        content: `
The ERC20 token standard is the most widely used token standard on Ethereum.

OpenZeppelin ERC20 Implementation:
contract ERC20 is Context, IERC20, IERC20Metadata {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

Key Functions:
- totalSupply(): Returns total token supply
- balanceOf(address): Returns balance of an account
- transfer(address, uint256): Transfers tokens
- approve(address, uint256): Approves spending allowance
- transferFrom(address, address, uint256): Transfers on behalf

Security Features:
- SafeMath operations (built into Solidity 0.8+)
- Overflow/underflow protection
- Zero address checks
- Proper event emissions

Extensions:
- ERC20Burnable: Allows token burning
- ERC20Mintable: Allows token minting
- ERC20Pausable: Allows pausing transfers
- ERC20Snapshot: Creates balance snapshots
- ERC20Votes: Adds governance voting power

Best Practices:
- Always use OpenZeppelin's audited implementations
- Inherit from base contracts rather than copying code
- Use extensions for additional functionality
- Implement proper access controls for minting/burning
        `,
        type: 'openzeppelin_contracts' as DocumentType,
        source: 'OpenZeppelin Contracts',
        url: 'https://docs.openzeppelin.com/contracts/4.x/erc20',
        metadata: {
          category: 'tokens',
          tags: ['erc20', 'tokens', 'openzeppelin'],
          difficulty: 'intermediate' as const,
          version: '4.x'
        }
      },
      {
        title: 'OpenZeppelin Access Control',
        content: `
OpenZeppelin provides robust access control mechanisms for smart contracts.

1. Ownable Contract:
Simple ownership model with a single owner:
contract MyContract is Ownable {
    function sensitiveFunction() public onlyOwner {
        // Only owner can call this
    }
}

2. AccessControl Contract:
Role-based access control system:
contract MyContract is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}

3. AccessControlEnumerable:
Extends AccessControl with role member enumeration:
- getRoleMemberCount(bytes32 role)
- getRoleMember(bytes32 role, uint256 index)

Key Features:
- Hierarchical roles with admin roles
- Role granting and revoking
- Role renunciation
- Multiple roles per account
- Enumerable role members

Security Considerations:
- Always set up admin roles carefully
- Use time delays for critical role changes
- Implement multi-signature for admin operations
- Monitor role changes with events
- Consider using TimelockController for governance
        `,
        type: 'openzeppelin_contracts' as DocumentType,
        source: 'OpenZeppelin Access Control',
        url: 'https://docs.openzeppelin.com/contracts/4.x/access-control',
        metadata: {
          category: 'access_control',
          tags: ['access-control', 'roles', 'security'],
          difficulty: 'intermediate' as const
        }
      }
    ]

    await this.batchIndexDocuments(ozContracts)
    console.log('✅ OpenZeppelin contracts indexed')
  }

  // Index audit playbooks
  async indexAuditPlaybooks(): Promise<void> {
    console.log('📚 Indexing audit playbooks...')

    const auditPlaybooks = [
      {
        title: 'Smart Contract Audit Checklist',
        content: `
Comprehensive checklist for smart contract security audits:

1. Code Quality & Architecture:
- [ ] Code follows Solidity style guide
- [ ] Proper contract structure and organization
- [ ] Clear function and variable naming
- [ ] Adequate documentation and comments
- [ ] Modular design with separation of concerns

2. Access Control:
- [ ] Proper role-based access control
- [ ] Owner privileges are not excessive
- [ ] Multi-signature for critical operations
- [ ] Time delays for sensitive changes
- [ ] Role transfer mechanisms are secure

3. Input Validation:
- [ ] All external inputs are validated
- [ ] Proper bounds checking
- [ ] Address zero checks
- [ ] Array length validations
- [ ] Overflow/underflow protection

4. Reentrancy Protection:
- [ ] Checks-Effects-Interactions pattern
- [ ] Reentrancy guards where needed
- [ ] No state changes after external calls
- [ ] Pull over push for payments

5. Gas Optimization:
- [ ] Efficient storage usage
- [ ] Minimal external calls
- [ ] Proper loop bounds
- [ ] Gas-efficient data structures

6. Error Handling:
- [ ] Proper error messages
- [ ] Graceful failure handling
- [ ] No silent failures
- [ ] Consistent error patterns

7. Testing Coverage:
- [ ] Unit tests for all functions
- [ ] Integration tests
- [ ] Edge case testing
- [ ] Fuzzing tests
- [ ] Gas usage tests
        `,
        type: 'audit_playbooks' as DocumentType,
        source: 'Smart Contract Audit Methodology',
        metadata: {
          category: 'audit_checklist',
          tags: ['audit', 'checklist', 'security'],
          difficulty: 'advanced' as const
        }
      },
      {
        title: 'Common Vulnerability Patterns',
        content: `
Common vulnerability patterns found in smart contract audits:

1. Reentrancy Attacks:
Description: External calls allow malicious contracts to re-enter
Example:
function withdraw() public {
    uint amount = balances[msg.sender];
    (bool success, ) = msg.sender.call{value: amount}("");
    balances[msg.sender] = 0; // State change after external call
}

Fix: Use checks-effects-interactions pattern or reentrancy guards

2. Integer Overflow/Underflow:
Description: Arithmetic operations exceed type limits
Example:
uint8 a = 255;
a = a + 1; // Overflows to 0 in Solidity < 0.8

Fix: Use SafeMath library or Solidity 0.8+ built-in checks

3. Access Control Issues:
Description: Missing or improper access controls
Example:
function mint(address to, uint amount) public {
    _mint(to, amount); // Anyone can mint tokens
}

Fix: Add proper access control modifiers

4. Front-running:
Description: Miners can see and reorder transactions
Example: DEX trades can be front-run for profit

Fix: Use commit-reveal schemes or batch auctions

5. Oracle Manipulation:
Description: Price oracles can be manipulated
Example: Flash loan attacks on price feeds

Fix: Use multiple oracles, time-weighted averages, circuit breakers

6. Denial of Service:
Description: Attackers can make contracts unusable
Example: Unbounded loops that consume all gas

Fix: Implement gas limits, pagination, circuit breakers

7. Logic Errors:
Description: Incorrect business logic implementation
Example: Wrong calculation formulas, incorrect state transitions

Fix: Thorough testing, formal verification, peer review
        `,
        type: 'vulnerability_database' as DocumentType,
        source: 'Common Smart Contract Vulnerabilities',
        metadata: {
          category: 'vulnerabilities',
          tags: ['vulnerabilities', 'security', 'patterns'],
          difficulty: 'advanced' as const
        }
      }
    ]

    await this.batchIndexDocuments(auditPlaybooks)
    console.log('✅ Audit playbooks indexed')
  }

  // Index gas optimization patterns
  async indexGasOptimizationPatterns(): Promise<void> {
    console.log('📚 Indexing gas optimization patterns...')

    const gasPatterns = [
      {
        title: 'Gas Optimization Techniques',
        content: `
Essential gas optimization techniques for smart contracts:

1. Storage Optimization:
- Pack structs efficiently (use smaller types)
- Use mappings instead of arrays when possible
- Delete unused storage variables
- Use events for data that doesn't need on-chain storage

Example:
struct User {
    uint128 balance;    // 16 bytes
    uint64 timestamp;   // 8 bytes
    bool active;        // 1 byte (packed in same slot)
}

2. Function Optimization:
- Use external instead of public for functions only called externally
- Mark functions as pure/view when possible
- Use calldata instead of memory for external function parameters
- Avoid unnecessary function calls

3. Loop Optimization:
- Cache array length in loops
- Use unchecked blocks for safe arithmetic
- Avoid storage reads in loops
- Consider pagination for large datasets

Example:
uint256 length = array.length;
for (uint256 i = 0; i < length;) {
    // loop body
    unchecked { ++i; }
}

4. Variable Optimization:
- Use appropriate data types (uint256 vs uint8)
- Initialize variables efficiently
- Use constants and immutable variables
- Pack multiple boolean values into single uint256

5. Contract Design:
- Use libraries for common functionality
- Implement proxy patterns for upgradability
- Minimize external contract calls
- Use CREATE2 for deterministic addresses

6. Advanced Techniques:
- Assembly for critical operations
- Bit manipulation for flags
- Custom errors instead of string messages
- Batch operations to reduce transaction costs
        `,
        type: 'gas_optimization_patterns' as DocumentType,
        source: 'Gas Optimization Guide',
        metadata: {
          category: 'optimization',
          tags: ['gas', 'optimization', 'efficiency'],
          difficulty: 'advanced' as const
        }
      }
    ]

    await this.batchIndexDocuments(gasPatterns)
    console.log('✅ Gas optimization patterns indexed')
  }

  // Initialize complete knowledge base
  async initializeKnowledgeBase(): Promise<void> {
    console.log('🚀 Initializing NovaGuard knowledge base...')

    try {
      await Promise.all([
        this.indexSolidityDocs(),
        this.indexOpenZeppelinContracts(),
        this.indexAuditPlaybooks(),
        this.indexGasOptimizationPatterns()
      ])

      console.log('✅ Knowledge base initialization complete!')
    } catch (error) {
      console.error('❌ Failed to initialize knowledge base:', error)
      throw error
    }
  }

  // Update existing document
  async updateDocument(documentId: string, updates: Partial<KnowledgeDocument>): Promise<void> {
    try {
      // Get existing document
      const { data: existingDoc, error: fetchError } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchError || !existingDoc) {
        throw new Error('Document not found')
      }

      // If content changed, re-index
      if (updates.content && updates.content !== existingDoc.content) {
        // Delete existing chunks
        await supabase
          .from('knowledge_chunks')
          .delete()
          .eq('document_id', documentId)

        // Re-index with new content
        const chunks = await this.textSplitter.splitText(updates.content)
        const chunkDocuments: ChunkDocument[] = []

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          const embedding = await this.generateEmbedding(chunk)

          chunkDocuments.push({
            id: `${documentId}_chunk_${i}`,
            documentId,
            content: chunk,
            chunkIndex: i,
            embedding,
            metadata: {
              ...existingDoc.metadata,
              ...updates.metadata,
              chunkIndex: i,
              totalChunks: chunks.length
            }
          })
        }

        // Store new chunks
        await supabase
          .from('knowledge_chunks')
          .insert(
            chunkDocuments.map(chunk => ({
              id: chunk.id,
              document_id: chunk.documentId,
              content: chunk.content,
              chunk_index: chunk.chunkIndex,
              embedding: chunk.embedding,
              metadata: chunk.metadata
            }))
          )

        // Generate new document embedding
        updates.embedding = await this.generateEmbedding(
          `${updates.title || existingDoc.title}\n\n${updates.content.substring(0, 2000)}`
        )
      }

      // Update document
      const { error: updateError } = await supabase
        .from('knowledge_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (updateError) {
        throw new Error(`Failed to update document: ${updateError.message}`)
      }

      console.log(`✅ Updated document: ${documentId}`)
    } catch (error) {
      console.error(`❌ Failed to update document: ${documentId}`, error)
      throw error
    }
  }

  // Delete document and its chunks
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Delete chunks first
      await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('document_id', documentId)

      // Delete document
      await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', documentId)

      console.log(`✅ Deleted document: ${documentId}`)
    } catch (error) {
      console.error(`❌ Failed to delete document: ${documentId}`, error)
      throw error
    }
  }

  // Get indexing statistics
  async getIndexingStats(): Promise<{
    totalDocuments: number
    totalChunks: number
    documentsByType: Record<DocumentType, number>
    lastUpdated: Date | null
  }> {
    const { data: docs, count: docCount } = await supabase
      .from('knowledge_documents')
      .select('type, updated_at', { count: 'exact' })

    const { count: chunkCount } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true })

    const documentsByType = docs?.reduce((acc, doc) => {
      acc[doc.type as DocumentType] = (acc[doc.type as DocumentType] || 0) + 1
      return acc
    }, {} as Record<DocumentType, number>) || {}

    const lastUpdated = docs?.length > 0
      ? new Date(Math.max(...docs.map(doc => new Date(doc.updated_at).getTime())))
      : null

    return {
      totalDocuments: docCount || 0,
      totalChunks: chunkCount || 0,
      documentsByType,
      lastUpdated
    }
  }
}

export default KnowledgeIndexer
