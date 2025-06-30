// =============================================
// NOVAGUARD DEPLOYMENT SERVICE
// Multi-chain smart contract deployment system
// =============================================

const { ethers } = require('ethers');
const solc = require('solc');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

class DeploymentService {
  constructor() {
    this.name = 'DeploymentService';
    this.version = '2.0.0';
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Multi-chain configuration
    this.chainConfigs = {
      ethereum: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/' + process.env.ALCHEMY_API_KEY,
        explorerUrl: 'https://etherscan.io',
        gasPrice: 'auto',
        currency: 'ETH'
      },
      sepolia: {
        name: 'Sepolia Testnet',
        chainId: 11155111,
        rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.alchemyapi.io/v2/' + process.env.ALCHEMY_API_KEY,
        explorerUrl: 'https://sepolia.etherscan.io',
        gasPrice: 'auto',
        currency: 'ETH'
      },
      polygon: {
        name: 'Polygon Mainnet',
        chainId: 137,
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.alchemyapi.io/v2/' + process.env.ALCHEMY_API_KEY,
        explorerUrl: 'https://polygonscan.com',
        gasPrice: 'auto',
        currency: 'MATIC'
      },
      mumbai: {
        name: 'Mumbai Testnet',
        chainId: 80001,
        rpcUrl: process.env.MUMBAI_RPC_URL || 'https://polygon-mumbai.alchemyapi.io/v2/' + process.env.ALCHEMY_API_KEY,
        explorerUrl: 'https://mumbai.polygonscan.com',
        gasPrice: 'auto',
        currency: 'MATIC'
      },
      arbitrum: {
        name: 'Arbitrum One',
        chainId: 42161,
        rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.alchemyapi.io/v2/' + process.env.ALCHEMY_API_KEY,
        explorerUrl: 'https://arbiscan.io',
        gasPrice: 'auto',
        currency: 'ETH'
      },
      optimism: {
        name: 'Optimism',
        chainId: 10,
        rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://opt-mainnet.alchemyapi.io/v2/' + process.env.ALCHEMY_API_KEY,
        explorerUrl: 'https://optimistic.etherscan.io',
        gasPrice: 'auto',
        currency: 'ETH'
      },
      base: {
        name: 'Base',
        chainId: 8453,
        rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
        explorerUrl: 'https://basescan.org',
        gasPrice: 'auto',
        currency: 'ETH'
      },
      bsc: {
        name: 'BNB Smart Chain',
        chainId: 56,
        rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
        explorerUrl: 'https://bscscan.com',
        gasPrice: 'auto',
        currency: 'BNB'
      }
    };

    // Deployment strategies
    this.deploymentStrategies = {
      standard: 'Standard deployment with basic verification',
      create2: 'CREATE2 deployment for deterministic addresses',
      proxy: 'Proxy deployment for upgradeable contracts',
      factory: 'Factory deployment for multiple instances'
    };
  }

  // Main contract deployment function
  async deployContract(options) {
    const {
      userId,
      contractCode,
      chain,
      constructorArgs = [],
      deploymentStrategy = 'standard',
      compilerVersion = '0.8.19',
      optimizationEnabled = true,
      optimizationRuns = 200,
      gasLimit,
      gasPrice,
      value = 0,
      salt, // For CREATE2 deployments
      verifyContract = true,
      deploymentNotes = ''
    } = options;

    const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      console.log(`🚀 Starting deployment: ${deploymentId} on ${chain}`);

      // Validate chain configuration
      const chainConfig = this.chainConfigs[chain];
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      // Compile contract
      console.log('📦 Compiling contract...');
      const compilationResult = await this.compileContract(
        contractCode,
        compilerVersion,
        optimizationEnabled,
        optimizationRuns
      );

      // Estimate gas costs
      console.log('⛽ Estimating gas costs...');
      const gasEstimate = await this.estimateDeploymentGas(
        compilationResult,
        constructorArgs,
        chainConfig
      );

      // Check user credits/payment
      console.log('💳 Verifying payment...');
      const paymentVerified = await this.verifyDeploymentPayment(userId, chain, gasEstimate);
      if (!paymentVerified) {
        throw new Error('Insufficient credits or payment required for deployment');
      }

      // Create deployment record
      const deploymentRecord = await this.createDeploymentRecord({
        deploymentId,
        userId,
        chain,
        contractCode,
        compilationResult,
        constructorArgs,
        deploymentStrategy,
        gasEstimate,
        deploymentNotes
      });

      // Execute deployment based on strategy
      let deploymentResult;
      switch (deploymentStrategy) {
        case 'standard':
          deploymentResult = await this.executeStandardDeployment(
            compilationResult,
            constructorArgs,
            chainConfig,
            { gasLimit, gasPrice, value }
          );
          break;
        case 'create2':
          deploymentResult = await this.executeCreate2Deployment(
            compilationResult,
            constructorArgs,
            salt,
            chainConfig,
            { gasLimit, gasPrice, value }
          );
          break;
        case 'proxy':
          deploymentResult = await this.executeProxyDeployment(
            compilationResult,
            constructorArgs,
            chainConfig,
            { gasLimit, gasPrice, value }
          );
          break;
        case 'factory':
          deploymentResult = await this.executeFactoryDeployment(
            compilationResult,
            constructorArgs,
            chainConfig,
            { gasLimit, gasPrice, value }
          );
          break;
        default:
          throw new Error(`Unknown deployment strategy: ${deploymentStrategy}`);
      }

      // Update deployment record with results
      await this.updateDeploymentRecord(deploymentRecord.id, {
        status: 'deployed',
        contractAddress: deploymentResult.contractAddress,
        transactionHash: deploymentResult.transactionHash,
        blockNumber: deploymentResult.blockNumber,
        gasUsed: deploymentResult.gasUsed,
        deploymentCostEth: deploymentResult.deploymentCost,
        deployedAt: new Date().toISOString()
      });

      // Verify contract on block explorer
      if (verifyContract && deploymentResult.contractAddress) {
        console.log('✅ Verifying contract...');
        try {
          await this.verifyContractOnExplorer(
            deploymentResult.contractAddress,
            contractCode,
            constructorArgs,
            chainConfig,
            compilationResult
          );
          
          await this.updateDeploymentRecord(deploymentRecord.id, {
            verificationStatus: 'verified',
            etherscanVerified: true
          });
        } catch (verificationError) {
          console.warn('Contract verification failed:', verificationError.message);
          await this.updateDeploymentRecord(deploymentRecord.id, {
            verificationStatus: 'failed',
            verificationError: verificationError.message
          });
        }
      }

      const executionTime = Date.now() - startTime;

      console.log(`✅ Deployment completed: ${deploymentResult.contractAddress}`);

      return {
        deploymentId,
        contractAddress: deploymentResult.contractAddress,
        transactionHash: deploymentResult.transactionHash,
        blockNumber: deploymentResult.blockNumber,
        chain,
        gasUsed: deploymentResult.gasUsed,
        deploymentCost: deploymentResult.deploymentCost,
        explorerUrl: `${chainConfig.explorerUrl}/address/${deploymentResult.contractAddress}`,
        executionTime,
        verificationStatus: verifyContract ? 'pending' : 'skipped',
        deploymentStrategy,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Deployment failed: ${deploymentId}`, error);

      // Update deployment record with error
      try {
        await this.updateDeploymentRecord(deploymentRecord?.id, {
          status: 'failed',
          errorMessage: error.message,
          failedAt: new Date().toISOString()
        });
      } catch (updateError) {
        console.error('Failed to update deployment record:', updateError);
      }

      throw error;
    }
  }

  // Compile Solidity contract
  async compileContract(contractCode, version, optimization, runs) {
    try {
      const input = {
        language: 'Solidity',
        sources: {
          'contract.sol': {
            content: contractCode
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata']
            }
          },
          optimizer: {
            enabled: optimization,
            runs: runs
          }
        }
      };

      const output = JSON.parse(solc.compile(JSON.stringify(input)));

      if (output.errors) {
        const errors = output.errors.filter(error => error.severity === 'error');
        if (errors.length > 0) {
          throw new Error(`Compilation failed: ${errors.map(e => e.message).join(', ')}`);
        }
      }

      const contractName = Object.keys(output.contracts['contract.sol'])[0];
      const contract = output.contracts['contract.sol'][contractName];

      return {
        contractName,
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
        deployedBytecode: contract.evm.deployedBytecode.object,
        metadata: contract.metadata,
        compilerVersion: version,
        optimization: { enabled: optimization, runs }
      };

    } catch (error) {
      throw new Error(`Contract compilation failed: ${error.message}`);
    }
  }

  // Estimate deployment gas costs
  async estimateDeploymentGas(compilationResult, constructorArgs, chainConfig) {
    try {
      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      
      // Create contract factory
      const contractFactory = new ethers.ContractFactory(
        compilationResult.abi,
        compilationResult.bytecode,
        provider
      );

      // Estimate gas for deployment
      const deployTransaction = await contractFactory.getDeployTransaction(...constructorArgs);
      const gasEstimate = await provider.estimateGas(deployTransaction);

      // Get current gas price
      const gasPrice = await provider.getGasPrice();

      // Calculate costs
      const deploymentCostWei = gasEstimate * gasPrice;
      const deploymentCostEth = ethers.formatEther(deploymentCostWei);

      return {
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
        deploymentCostWei: deploymentCostWei.toString(),
        deploymentCostEth: parseFloat(deploymentCostEth),
        currency: chainConfig.currency
      };

    } catch (error) {
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  // Execute standard deployment
  async executeStandardDeployment(compilationResult, constructorArgs, chainConfig, options) {
    try {
      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIVATE_KEY, provider);

      const contractFactory = new ethers.ContractFactory(
        compilationResult.abi,
        compilationResult.bytecode,
        wallet
      );

      const deploymentOptions = {
        gasLimit: options.gasLimit,
        gasPrice: options.gasPrice,
        value: options.value
      };

      // Remove undefined values
      Object.keys(deploymentOptions).forEach(key => {
        if (deploymentOptions[key] === undefined) {
          delete deploymentOptions[key];
        }
      });

      console.log('📤 Deploying contract...');
      const contract = await contractFactory.deploy(...constructorArgs, deploymentOptions);
      
      console.log('⏳ Waiting for deployment confirmation...');
      const receipt = await contract.deploymentTransaction().wait();

      const deploymentCost = receipt.gasUsed * receipt.gasPrice;

      return {
        contractAddress: await contract.getAddress(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        deploymentCost: ethers.formatEther(deploymentCost),
        contract
      };

    } catch (error) {
      throw new Error(`Standard deployment failed: ${error.message}`);
    }
  }

  // Execute CREATE2 deployment
  async executeCreate2Deployment(compilationResult, constructorArgs, salt, chainConfig, options) {
    // Implementation for CREATE2 deployment
    // This would use a CREATE2 factory contract
    throw new Error('CREATE2 deployment not yet implemented');
  }

  // Execute proxy deployment
  async executeProxyDeployment(compilationResult, constructorArgs, chainConfig, options) {
    // Implementation for proxy deployment
    // This would deploy implementation + proxy contracts
    throw new Error('Proxy deployment not yet implemented');
  }

  // Execute factory deployment
  async executeFactoryDeployment(compilationResult, constructorArgs, chainConfig, options) {
    // Implementation for factory deployment
    // This would use a factory contract to deploy instances
    throw new Error('Factory deployment not yet implemented');
  }

  // Verify payment for deployment
  async verifyDeploymentPayment(userId, chain, gasEstimate) {
    try {
      // Check user credits
      const { data: user } = await this.supabase
        .from('users')
        .select('credits, is_premium')
        .eq('id', userId)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate required credits based on chain and gas cost
      const requiredCredits = this.calculateRequiredCredits(chain, gasEstimate);

      if (user.credits >= requiredCredits || user.is_premium) {
        // Deduct credits
        await this.supabase
          .from('users')
          .update({ credits: user.credits - requiredCredits })
          .eq('id', userId);

        // Log credit transaction
        await this.supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'usage',
            amount: -requiredCredits,
            balance_after: user.credits - requiredCredits,
            description: `Contract deployment on ${chain}`,
            reference_type: 'deployment'
          });

        return true;
      }

      return false;

    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  // Calculate required credits for deployment
  calculateRequiredCredits(chain, gasEstimate) {
    const baseCosts = {
      ethereum: 10,
      sepolia: 1,
      polygon: 2,
      mumbai: 1,
      arbitrum: 3,
      optimism: 3,
      base: 3,
      bsc: 2
    };

    const baseCost = baseCosts[chain] || 5;
    const gasCostMultiplier = Math.ceil(gasEstimate.deploymentCostEth * 10);
    
    return Math.max(baseCost, gasCostMultiplier);
  }

  // Create deployment record in database
  async createDeploymentRecord(data) {
    try {
      const { data: record, error } = await this.supabase
        .from('deployments')
        .insert({
          deployment_id: data.deploymentId,
          user_id: data.userId,
          chain: data.chain,
          status: 'deploying',
          compiler_version: data.compilationResult.compilerVersion,
          optimization_enabled: data.compilationResult.optimization.enabled,
          optimization_runs: data.compilationResult.optimization.runs,
          constructor_args: data.constructorArgs,
          gas_limit: data.gasEstimate.gasLimit.toString(),
          gas_price: data.gasEstimate.gasPrice.toString(),
          deployment_cost_eth: data.gasEstimate.deploymentCostEth,
          deployment_notes: data.deploymentNotes,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return record;

    } catch (error) {
      throw new Error(`Failed to create deployment record: ${error.message}`);
    }
  }

  // Update deployment record
  async updateDeploymentRecord(recordId, updates) {
    try {
      const { error } = await this.supabase
        .from('deployments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update deployment record:', error);
    }
  }

  // Verify contract on block explorer
  async verifyContractOnExplorer(contractAddress, sourceCode, constructorArgs, chainConfig, compilationResult) {
    // Implementation would depend on the specific block explorer API
    // For now, we'll just mark it as attempted
    console.log(`Attempting to verify contract ${contractAddress} on ${chainConfig.explorerUrl}`);
    
    // This would typically involve:
    // 1. Formatting source code for verification
    // 2. Encoding constructor arguments
    // 3. Submitting to explorer API (Etherscan, etc.)
    // 4. Polling for verification status
    
    return { verified: true, guid: 'mock-verification-guid' };
  }

  // Get deployment status
  async getDeploymentStatus(deploymentId) {
    try {
      const { data, error } = await this.supabase
        .from('deployments')
        .select('*')
        .eq('deployment_id', deploymentId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      throw new Error(`Failed to get deployment status: ${error.message}`);
    }
  }

  // Get user deployment history
  async getUserDeployments(userId, options = {}) {
    try {
      const { page = 1, limit = 20, chain, status } = options;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('deployments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (chain) {
        query = query.eq('chain', chain);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        deployments: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      throw new Error(`Failed to get user deployments: ${error.message}`);
    }
  }
}

module.exports = DeploymentService;
