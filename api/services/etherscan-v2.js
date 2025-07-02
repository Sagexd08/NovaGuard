const axios = require('axios');

/**
 * Enhanced Etherscan v2 API Service
 * Supports all major EVM-compatible chains with advanced scanning capabilities
 */
class EtherscanV2Service {
  constructor() {
    this.apiKey = process.env.ETHERSCAN_API_KEY;
    
    // Enhanced chain configurations with v2 API endpoints
    this.chains = {
      ethereum: {
        name: 'Ethereum Mainnet',
        apiUrl: 'https://api.etherscan.io/api',
        apiKey: process.env.ETHERSCAN_API_KEY,
        chainId: 1,
        currency: 'ETH'
      },
      sepolia: {
        name: 'Ethereum Sepolia',
        apiUrl: 'https://api-sepolia.etherscan.io/api',
        apiKey: process.env.ETHERSCAN_API_KEY,
        chainId: 11155111,
        currency: 'ETH'
      },
      polygon: {
        name: 'Polygon Mainnet',
        apiUrl: 'https://api.polygonscan.com/api',
        apiKey: process.env.POLYGONSCAN_API_KEY,
        chainId: 137,
        currency: 'MATIC'
      },
      mumbai: {
        name: 'Polygon Mumbai',
        apiUrl: 'https://api-testnet.polygonscan.com/api',
        apiKey: process.env.POLYGONSCAN_API_KEY,
        chainId: 80001,
        currency: 'MATIC'
      },
      arbitrum: {
        name: 'Arbitrum One',
        apiUrl: 'https://api.arbiscan.io/api',
        apiKey: process.env.ARBISCAN_API_KEY,
        chainId: 42161,
        currency: 'ETH'
      },
      optimism: {
        name: 'Optimism',
        apiUrl: 'https://api-optimistic.etherscan.io/api',
        apiKey: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
        chainId: 10,
        currency: 'ETH'
      },
      base: {
        name: 'Base',
        apiUrl: 'https://api.basescan.org/api',
        apiKey: process.env.BASESCAN_API_KEY,
        chainId: 8453,
        currency: 'ETH'
      },
      bsc: {
        name: 'BNB Smart Chain',
        apiUrl: 'https://api.bscscan.com/api',
        apiKey: process.env.BSCSCAN_API_KEY,
        chainId: 56,
        currency: 'BNB'
      },
      avalanche: {
        name: 'Avalanche C-Chain',
        apiUrl: 'https://api.snowtrace.io/api',
        apiKey: process.env.SNOWTRACE_API_KEY,
        chainId: 43114,
        currency: 'AVAX'
      },
      fuji: {
        name: 'Avalanche Fuji Testnet',
        apiUrl: 'https://api-testnet.snowtrace.io/api',
        apiKey: process.env.SNOWTRACE_API_KEY,
        chainId: 43113,
        currency: 'AVAX'
      },
      starknet: {
        name: 'Starknet Mainnet',
        apiUrl: 'https://alpha-mainnet.starknet.io',
        apiKey: process.env.STARKNET_API_KEY,
        chainId: 'SN_MAIN',
        currency: 'ETH',
        type: 'starknet'
      },
      starknet_goerli: {
        name: 'Starknet Goerli',
        apiUrl: 'https://alpha4.starknet.io',
        apiKey: process.env.STARKNET_API_KEY,
        chainId: 'SN_GOERLI',
        currency: 'ETH',
        type: 'starknet'
      }
    };
  }

  /**
   * Get contract source code with enhanced metadata
   */
  async getContractSource(contractAddress, chain = 'ethereum') {
    try {
      const chainConfig = this.chains[chain.toLowerCase()];
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      console.log(`📡 Fetching contract source from ${chainConfig.name} for ${contractAddress}`);

      const response = await axios.get(chainConfig.apiUrl, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: contractAddress,
          apikey: chainConfig.apiKey
        },
        timeout: 10000
      });

      if (response.data.status === '1' && response.data.result[0]) {
        const contractData = response.data.result[0];
        
        return {
          sourceCode: contractData.SourceCode,
          contractName: contractData.ContractName,
          compilerVersion: contractData.CompilerVersion,
          optimizationUsed: contractData.OptimizationUsed,
          runs: contractData.Runs,
          constructorArguments: contractData.ConstructorArguments,
          evmVersion: contractData.EVMVersion,
          library: contractData.Library,
          licenseType: contractData.LicenseType,
          proxy: contractData.Proxy,
          implementation: contractData.Implementation,
          swarmSource: contractData.SwarmSource,
          abi: contractData.ABI,
          chain: chainConfig.name,
          chainId: chainConfig.chainId,
          verified: true
        };
      } else {
        throw new Error('Contract not verified or not found');
      }
    } catch (error) {
      console.error(`❌ Error fetching contract source: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get contract ABI
   */
  async getContractABI(contractAddress, chain = 'ethereum') {
    try {
      const chainConfig = this.chains[chain.toLowerCase()];
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const response = await axios.get(chainConfig.apiUrl, {
        params: {
          module: 'contract',
          action: 'getabi',
          address: contractAddress,
          apikey: chainConfig.apiKey
        },
        timeout: 10000
      });

      if (response.data.status === '1') {
        return {
          abi: JSON.parse(response.data.result),
          chain: chainConfig.name,
          chainId: chainConfig.chainId
        };
      } else {
        throw new Error('ABI not found or contract not verified');
      }
    } catch (error) {
      console.error(`❌ Error fetching contract ABI: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get contract creation transaction
   */
  async getContractCreation(contractAddress, chain = 'ethereum') {
    try {
      const chainConfig = this.chains[chain.toLowerCase()];
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const response = await axios.get(chainConfig.apiUrl, {
        params: {
          module: 'contract',
          action: 'getcontractcreation',
          contractaddresses: contractAddress,
          apikey: chainConfig.apiKey
        },
        timeout: 10000
      });

      if (response.data.status === '1' && response.data.result[0]) {
        const creationData = response.data.result[0];
        return {
          contractAddress: creationData.contractAddress,
          contractCreator: creationData.contractCreator,
          txHash: creationData.txHash,
          chain: chainConfig.name,
          chainId: chainConfig.chainId
        };
      } else {
        throw new Error('Contract creation data not found');
      }
    } catch (error) {
      console.error(`❌ Error fetching contract creation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash, chain = 'ethereum') {
    try {
      const chainConfig = this.chains[chain.toLowerCase()];
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const response = await axios.get(chainConfig.apiUrl, {
        params: {
          module: 'proxy',
          action: 'eth_getTransactionByHash',
          txhash: txHash,
          apikey: chainConfig.apiKey
        },
        timeout: 10000
      });

      if (response.data.result) {
        return {
          ...response.data.result,
          chain: chainConfig.name,
          chainId: chainConfig.chainId
        };
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      console.error(`❌ Error fetching transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get contract execution status
   */
  async getContractExecutionStatus(txHash, chain = 'ethereum') {
    try {
      const chainConfig = this.chains[chain.toLowerCase()];
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const response = await axios.get(chainConfig.apiUrl, {
        params: {
          module: 'transaction',
          action: 'getstatus',
          txhash: txHash,
          apikey: chainConfig.apiKey
        },
        timeout: 10000
      });

      if (response.data.status === '1') {
        return {
          isError: response.data.result.isError,
          errDescription: response.data.result.errDescription,
          chain: chainConfig.name,
          chainId: chainConfig.chainId
        };
      } else {
        throw new Error('Execution status not found');
      }
    } catch (error) {
      console.error(`❌ Error fetching execution status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address, chain = 'ethereum') {
    try {
      const chainConfig = this.chains[chain.toLowerCase()];
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const response = await axios.get(chainConfig.apiUrl, {
        params: {
          module: 'account',
          action: 'balance',
          address: address,
          tag: 'latest',
          apikey: chainConfig.apiKey
        },
        timeout: 10000
      });

      if (response.data.status === '1') {
        return {
          balance: response.data.result,
          balanceEther: (parseInt(response.data.result) / Math.pow(10, 18)).toString(),
          currency: chainConfig.currency,
          chain: chainConfig.name,
          chainId: chainConfig.chainId
        };
      } else {
        throw new Error('Balance not found');
      }
    } catch (error) {
      console.error(`❌ Error fetching balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get comprehensive contract analysis
   */
  async getContractAnalysis(contractAddress, chain = 'ethereum') {
    try {
      console.log(`🔍 Starting comprehensive contract analysis for ${contractAddress} on ${chain}`);

      const [sourceData, creationData, abiData] = await Promise.allSettled([
        this.getContractSource(contractAddress, chain),
        this.getContractCreation(contractAddress, chain),
        this.getContractABI(contractAddress, chain)
      ]);

      const analysis = {
        contractAddress,
        chain: this.chains[chain.toLowerCase()]?.name || chain,
        chainId: this.chains[chain.toLowerCase()]?.chainId,
        timestamp: new Date().toISOString(),
        verified: false,
        sourceCode: null,
        abi: null,
        creation: null,
        metadata: {}
      };

      // Process source code data
      if (sourceData.status === 'fulfilled') {
        analysis.verified = true;
        analysis.sourceCode = sourceData.value.sourceCode;
        analysis.metadata = {
          contractName: sourceData.value.contractName,
          compilerVersion: sourceData.value.compilerVersion,
          optimizationUsed: sourceData.value.optimizationUsed,
          runs: sourceData.value.runs,
          evmVersion: sourceData.value.evmVersion,
          licenseType: sourceData.value.licenseType,
          proxy: sourceData.value.proxy,
          implementation: sourceData.value.implementation
        };
      }

      // Process ABI data
      if (abiData.status === 'fulfilled') {
        analysis.abi = abiData.value.abi;
      }

      // Process creation data
      if (creationData.status === 'fulfilled') {
        analysis.creation = creationData.value;
      }

      console.log(`✅ Contract analysis completed for ${contractAddress}`);
      return analysis;

    } catch (error) {
      console.error(`❌ Error in contract analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains() {
    return Object.keys(this.chains).map(key => ({
      key,
      name: this.chains[key].name,
      chainId: this.chains[key].chainId,
      currency: this.chains[key].currency
    }));
  }
}

module.exports = EtherscanV2Service;
