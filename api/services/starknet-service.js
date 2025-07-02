const axios = require('axios');

/**
 * Starknet Service for Cairo contract analysis and interaction
 */
class StarknetService {
  constructor() {
    this.apiKey = process.env.STARKNET_API_KEY;
    
    this.networks = {
      mainnet: {
        name: 'Starknet Mainnet',
        rpcUrl: 'https://alpha-mainnet.starknet.io',
        explorerUrl: 'https://starkscan.co',
        chainId: 'SN_MAIN'
      },
      goerli: {
        name: 'Starknet Goerli',
        rpcUrl: 'https://alpha4.starknet.io',
        explorerUrl: 'https://testnet.starkscan.co',
        chainId: 'SN_GOERLI'
      }
    };
  }

  /**
   * Get contract class hash and ABI
   */
  async getContractClass(contractAddress, network = 'mainnet') {
    try {
      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error(`Unsupported Starknet network: ${network}`);
      }

      console.log(`📡 Fetching Starknet contract class for ${contractAddress} on ${network}`);

      const response = await axios.post(networkConfig.rpcUrl, {
        jsonrpc: '2.0',
        method: 'starknet_getClassAt',
        params: [
          'latest',
          contractAddress
        ],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      if (response.data.result) {
        return {
          contractAddress,
          classHash: response.data.result.class_hash,
          abi: response.data.result.abi,
          program: response.data.result.program,
          entryPoints: response.data.result.entry_points_by_type,
          network: networkConfig.name,
          chainId: networkConfig.chainId,
          type: 'cairo'
        };
      } else {
        throw new Error('Contract not found or invalid address');
      }
    } catch (error) {
      console.error(`❌ Error fetching Starknet contract: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get contract storage
   */
  async getContractStorage(contractAddress, key, network = 'mainnet') {
    try {
      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error(`Unsupported Starknet network: ${network}`);
      }

      const response = await axios.post(networkConfig.rpcUrl, {
        jsonrpc: '2.0',
        method: 'starknet_getStorageAt',
        params: [
          contractAddress,
          key,
          'latest'
        ],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      if (response.data.result) {
        return {
          contractAddress,
          storageKey: key,
          value: response.data.result,
          network: networkConfig.name,
          chainId: networkConfig.chainId
        };
      } else {
        throw new Error('Storage key not found');
      }
    } catch (error) {
      console.error(`❌ Error fetching Starknet storage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash, network = 'mainnet') {
    try {
      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error(`Unsupported Starknet network: ${network}`);
      }

      const response = await axios.post(networkConfig.rpcUrl, {
        jsonrpc: '2.0',
        method: 'starknet_getTransactionByHash',
        params: [txHash],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      if (response.data.result) {
        return {
          ...response.data.result,
          network: networkConfig.name,
          chainId: networkConfig.chainId
        };
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      console.error(`❌ Error fetching Starknet transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber = 'latest', network = 'mainnet') {
    try {
      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error(`Unsupported Starknet network: ${network}`);
      }

      const response = await axios.post(networkConfig.rpcUrl, {
        jsonrpc: '2.0',
        method: 'starknet_getBlockWithTxHashes',
        params: [blockNumber],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      if (response.data.result) {
        return {
          ...response.data.result,
          network: networkConfig.name,
          chainId: networkConfig.chainId
        };
      } else {
        throw new Error('Block not found');
      }
    } catch (error) {
      console.error(`❌ Error fetching Starknet block: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze Cairo contract for vulnerabilities
   */
  async analyzeCairoContract(contractAddress, network = 'mainnet') {
    try {
      console.log(`🔍 Starting Cairo contract analysis for ${contractAddress} on ${network}`);

      // Get contract class and ABI
      const contractClass = await this.getContractClass(contractAddress, network);
      
      // Basic Cairo-specific vulnerability checks
      const vulnerabilities = [];
      const warnings = [];

      // Check for common Cairo vulnerabilities
      if (contractClass.abi) {
        // Check for missing access controls
        const hasOwnershipPattern = contractClass.abi.some(item => 
          item.name && (item.name.includes('owner') || item.name.includes('admin'))
        );
        
        if (!hasOwnershipPattern) {
          warnings.push({
            type: 'access_control',
            severity: 'medium',
            message: 'No ownership or admin patterns detected',
            recommendation: 'Consider implementing access control mechanisms'
          });
        }

        // Check for external functions without proper validation
        const externalFunctions = contractClass.abi.filter(item => 
          item.type === 'function' && item.stateMutability !== 'view'
        );

        if (externalFunctions.length > 0) {
          warnings.push({
            type: 'function_exposure',
            severity: 'low',
            message: `${externalFunctions.length} external state-changing functions found`,
            recommendation: 'Ensure all external functions have proper input validation'
          });
        }
      }

      return {
        contractAddress,
        network: contractClass.network,
        chainId: contractClass.chainId,
        contractType: 'cairo',
        analysis: {
          vulnerabilities,
          warnings,
          contractClass,
          securityScore: this.calculateSecurityScore(vulnerabilities, warnings),
          recommendations: this.generateRecommendations(vulnerabilities, warnings)
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Cairo contract analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate security score based on findings
   */
  calculateSecurityScore(vulnerabilities, warnings) {
    let score = 100;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    warnings.forEach(warning => {
      switch (warning.severity) {
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations(vulnerabilities, warnings) {
    const recommendations = [];

    if (vulnerabilities.length === 0 && warnings.length === 0) {
      recommendations.push('Contract appears to follow good security practices');
    }

    if (vulnerabilities.length > 0) {
      recommendations.push('Address all identified vulnerabilities before deployment');
    }

    if (warnings.length > 0) {
      recommendations.push('Review and address security warnings');
    }

    recommendations.push('Consider formal verification for critical contracts');
    recommendations.push('Implement comprehensive testing including edge cases');

    return recommendations;
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks() {
    return Object.keys(this.networks).map(key => ({
      key,
      name: this.networks[key].name,
      chainId: this.networks[key].chainId,
      type: 'starknet'
    }));
  }
}

module.exports = StarknetService;
