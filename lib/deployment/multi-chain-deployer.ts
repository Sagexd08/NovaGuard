// =============================================
// NOVAGUARD MULTI-CHAIN DEPLOYMENT SYSTEM
// Advanced smart contract deployment across multiple chains
// =============================================

import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'
import solc from 'solc'

// Supported chains configuration
export const SUPPORTED_CHAINS = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL!,
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/api',
    currency: 'ETH',
    gasMultiplier: 1.2,
    confirmations: 2
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL!,
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
    currency: 'ETH',
    gasMultiplier: 1.1,
    confirmations: 1
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL!,
    explorerUrl: 'https://polygonscan.com',
    explorerApiUrl: 'https://api.polygonscan.com/api',
    currency: 'MATIC',
    gasMultiplier: 1.3,
    confirmations: 3
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL!,
    explorerUrl: 'https://arbiscan.io',
    explorerApiUrl: 'https://api.arbiscan.io/api',
    currency: 'ETH',
    gasMultiplier: 1.1,
    confirmations: 1
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL!,
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerApiUrl: 'https://api-optimistic.etherscan.io/api',
    currency: 'ETH',
    gasMultiplier: 1.1,
    confirmations: 1
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL!,
    explorerUrl: 'https://basescan.org',
    explorerApiUrl: 'https://api.basescan.org/api',
    currency: 'ETH',
    gasMultiplier: 1.1,
    confirmations: 1
  },
  bsc: {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL!,
    explorerUrl: 'https://bscscan.com',
    explorerApiUrl: 'https://api.bscscan.com/api',
    currency: 'BNB',
    gasMultiplier: 1.2,
    confirmations: 3
  },
  zksync: {
    name: 'zkSync Era',
    chainId: 324,
    rpcUrl: process.env.ZKSYNC_RPC_URL!,
    explorerUrl: 'https://explorer.zksync.io',
    explorerApiUrl: 'https://block-explorer-api.mainnet.zksync.io/api',
    currency: 'ETH',
    gasMultiplier: 1.5,
    confirmations: 1
  }
} as const

export type ChainName = keyof typeof SUPPORTED_CHAINS

export interface DeploymentConfig {
  contractCode: string
  constructorArgs: any[]
  compilerVersion: string
  optimizationEnabled: boolean
  optimizationRuns: number
  gasLimit?: number
  gasPrice?: string
  value?: string
  salt?: string // For CREATE2
  verifyContract: boolean
  deploymentNotes?: string
}

export interface DeploymentResult {
  success: boolean
  deploymentId: string
  contractAddress?: string
  transactionHash?: string
  blockNumber?: number
  gasUsed?: string
  deploymentCost?: string
  verificationStatus?: 'pending' | 'verified' | 'failed'
  explorerUrl?: string
  error?: string
}

export class MultiChainDeployer {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Deploy contract to specified chain
  async deployContract(
    chain: ChainName,
    config: DeploymentConfig,
    userId: string
  ): Promise<DeploymentResult> {
    const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      console.log(`🚀 Starting deployment to ${chain}: ${deploymentId}`)

      // Validate chain
      const chainConfig = SUPPORTED_CHAINS[chain]
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chain}`)
      }

      // Compile contract
      const compilationResult = await this.compileContract(config)
      
      // Estimate gas and costs
      const gasEstimate = await this.estimateGas(chainConfig, compilationResult, config)
      
      // Verify user has sufficient credits
      await this.verifyUserCredits(userId, chain, gasEstimate)
      
      // Create deployment record
      const deploymentRecord = await this.createDeploymentRecord({
        deploymentId,
        userId,
        chain,
        config,
        gasEstimate
      })

      // Execute deployment
      const deploymentResult = await this.executeDeployment(
        chainConfig,
        compilationResult,
        config,
        deploymentId
      )

      // Update deployment record
      await this.updateDeploymentRecord(deploymentRecord.id, {
        status: 'deployed',
        contract_address: deploymentResult.contractAddress,
        transaction_hash: deploymentResult.transactionHash,
        block_number: deploymentResult.blockNumber,
        gas_used: deploymentResult.gasUsed,
        deployment_cost: deploymentResult.deploymentCost,
        deployed_at: new Date().toISOString()
      })

      // Verify contract if requested
      if (config.verifyContract && deploymentResult.contractAddress) {
        this.verifyContractAsync(
          chainConfig,
          deploymentResult.contractAddress,
          config,
          compilationResult,
          deploymentRecord.id
        )
      }

      console.log(`✅ Deployment successful: ${deploymentResult.contractAddress}`)

      return {
        success: true,
        deploymentId,
        contractAddress: deploymentResult.contractAddress,
        transactionHash: deploymentResult.transactionHash,
        blockNumber: deploymentResult.blockNumber,
        gasUsed: deploymentResult.gasUsed,
        deploymentCost: deploymentResult.deploymentCost,
        verificationStatus: config.verifyContract ? 'pending' : undefined,
        explorerUrl: `${chainConfig.explorerUrl}/address/${deploymentResult.contractAddress}`
      }

    } catch (error) {
      console.error(`❌ Deployment failed: ${deploymentId}`, error)
      
      // Update deployment record with error
      try {
        await this.updateDeploymentRecord(deploymentRecord?.id, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failed_at: new Date().toISOString()
        })
      } catch (updateError) {
        console.error('Failed to update deployment record:', updateError)
      }

      return {
        success: false,
        deploymentId,
        error: error instanceof Error ? error.message : 'Deployment failed'
      }
    }
  }

  // Compile Solidity contract
  private async compileContract(config: DeploymentConfig) {
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: config.contractCode
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata']
          }
        },
        optimizer: {
          enabled: config.optimizationEnabled,
          runs: config.optimizationRuns
        }
      }
    }

    const output = JSON.parse(solc.compile(JSON.stringify(input)))

    if (output.errors) {
      const errors = output.errors.filter((error: any) => error.severity === 'error')
      if (errors.length > 0) {
        throw new Error(`Compilation failed: ${errors.map((e: any) => e.message).join(', ')}`)
      }
    }

    const contractName = Object.keys(output.contracts['contract.sol'])[0]
    const contract = output.contracts['contract.sol'][contractName]

    return {
      contractName,
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
      deployedBytecode: contract.evm.deployedBytecode.object,
      metadata: contract.metadata
    }
  }

  // Estimate gas costs
  private async estimateGas(chainConfig: any, compilationResult: any, config: DeploymentConfig) {
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl)
    
    const contractFactory = new ethers.ContractFactory(
      compilationResult.abi,
      compilationResult.bytecode,
      provider
    )

    const deployTransaction = await contractFactory.getDeployTransaction(...config.constructorArgs)
    const gasEstimate = await provider.estimateGas(deployTransaction)
    const gasPrice = await provider.getGasPrice()

    const adjustedGasPrice = gasPrice * BigInt(Math.floor(chainConfig.gasMultiplier * 100)) / BigInt(100)
    const deploymentCost = gasEstimate * adjustedGasPrice

    return {
      gasLimit: gasEstimate,
      gasPrice: adjustedGasPrice,
      deploymentCost: ethers.formatEther(deploymentCost),
      currency: chainConfig.currency
    }
  }

  // Verify user has sufficient credits
  private async verifyUserCredits(userId: string, chain: ChainName, gasEstimate: any) {
    const { data: user } = await this.supabase
      .from('users')
      .select('credits, is_premium')
      .eq('id', userId)
      .single()

    if (!user) {
      throw new Error('User not found')
    }

    const requiredCredits = this.calculateRequiredCredits(chain, gasEstimate)

    if (user.credits < requiredCredits && !user.is_premium) {
      throw new Error(`Insufficient credits. Required: ${requiredCredits}, Available: ${user.credits}`)
    }

    // Deduct credits
    if (!user.is_premium) {
      await this.supabase
        .from('users')
        .update({ credits: user.credits - requiredCredits })
        .eq('id', userId)
    }
  }

  // Calculate required credits
  private calculateRequiredCredits(chain: ChainName, gasEstimate: any): number {
    const baseCosts: Record<ChainName, number> = {
      ethereum: 20,
      sepolia: 1,
      polygon: 3,
      arbitrum: 5,
      optimism: 5,
      base: 5,
      bsc: 3,
      zksync: 8
    }

    const baseCost = baseCosts[chain] || 10
    const gasCostMultiplier = Math.ceil(parseFloat(gasEstimate.deploymentCost) * 100)
    
    return Math.max(baseCost, gasCostMultiplier)
  }

  // Execute deployment
  private async executeDeployment(
    chainConfig: any,
    compilationResult: any,
    config: DeploymentConfig,
    deploymentId: string
  ) {
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl)
    const wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIVATE_KEY!, provider)

    const contractFactory = new ethers.ContractFactory(
      compilationResult.abi,
      compilationResult.bytecode,
      wallet
    )

    const deploymentOptions: any = {
      gasLimit: config.gasLimit,
      gasPrice: config.gasPrice,
      value: config.value || 0
    }

    // Remove undefined values
    Object.keys(deploymentOptions).forEach(key => {
      if (deploymentOptions[key] === undefined) {
        delete deploymentOptions[key]
      }
    })

    console.log(`📤 Deploying contract on ${chainConfig.name}...`)
    const contract = await contractFactory.deploy(...config.constructorArgs, deploymentOptions)
    
    console.log(`⏳ Waiting for ${chainConfig.confirmations} confirmations...`)
    const receipt = await contract.deploymentTransaction().wait(chainConfig.confirmations)

    const deploymentCost = receipt!.gasUsed * receipt!.gasPrice!

    return {
      contractAddress: await contract.getAddress(),
      transactionHash: receipt!.hash,
      blockNumber: receipt!.blockNumber,
      gasUsed: receipt!.gasUsed.toString(),
      deploymentCost: ethers.formatEther(deploymentCost)
    }
  }

  // Create deployment record
  private async createDeploymentRecord(data: any) {
    const { data: record, error } = await this.supabase
      .from('deployments')
      .insert({
        deployment_id: data.deploymentId,
        user_id: data.userId,
        chain: data.chain,
        status: 'deploying',
        contract_code: data.config.contractCode,
        constructor_args: data.config.constructorArgs,
        compiler_version: data.config.compilerVersion,
        optimization_enabled: data.config.optimizationEnabled,
        optimization_runs: data.config.optimizationRuns,
        gas_limit: data.gasEstimate.gasLimit.toString(),
        gas_price: data.gasEstimate.gasPrice.toString(),
        estimated_cost: data.gasEstimate.deploymentCost,
        deployment_notes: data.config.deploymentNotes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return record
  }

  // Update deployment record
  private async updateDeploymentRecord(recordId: string, updates: any) {
    const { error } = await this.supabase
      .from('deployments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)

    if (error) {
      console.error('Failed to update deployment record:', error)
    }
  }

  // Verify contract on block explorer (async)
  private async verifyContractAsync(
    chainConfig: any,
    contractAddress: string,
    config: DeploymentConfig,
    compilationResult: any,
    recordId: string
  ) {
    try {
      console.log(`🔍 Verifying contract ${contractAddress} on ${chainConfig.name}...`)
      
      // Prepare verification data
      const verificationData = {
        apikey: this.getExplorerApiKey(chainConfig.name),
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contractAddress,
        sourceCode: config.contractCode,
        codeformat: 'solidity-single-file',
        contractname: compilationResult.contractName,
        compilerversion: `v${config.compilerVersion}`,
        optimizationUsed: config.optimizationEnabled ? '1' : '0',
        runs: config.optimizationRuns.toString(),
        constructorArguements: this.encodeConstructorArgs(config.constructorArgs, compilationResult.abi)
      }

      // Submit verification
      const response = await fetch(chainConfig.explorerApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(verificationData)
      })

      const result = await response.json()

      if (result.status === '1') {
        // Poll for verification status
        const guid = result.result
        await this.pollVerificationStatus(chainConfig, guid, recordId)
      } else {
        throw new Error(result.result || 'Verification submission failed')
      }

    } catch (error) {
      console.error('Contract verification failed:', error)
      await this.updateDeploymentRecord(recordId, {
        verification_status: 'failed',
        verification_error: error instanceof Error ? error.message : 'Verification failed'
      })
    }
  }

  // Poll verification status
  private async pollVerificationStatus(chainConfig: any, guid: string, recordId: string) {
    const maxAttempts = 20
    const delay = 5000 // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delay))

      try {
        const response = await fetch(
          `${chainConfig.explorerApiUrl}?module=contract&action=checkverifystatus&guid=${guid}&apikey=${this.getExplorerApiKey(chainConfig.name)}`
        )
        const result = await response.json()

        if (result.status === '1') {
          console.log(`✅ Contract verification successful`)
          await this.updateDeploymentRecord(recordId, {
            verification_status: 'verified',
            verification_guid: guid
          })
          return
        } else if (result.result === 'Pending in queue') {
          console.log(`⏳ Verification pending... (${attempt + 1}/${maxAttempts})`)
          continue
        } else {
          throw new Error(result.result || 'Verification failed')
        }
      } catch (error) {
        console.error(`Verification check failed (attempt ${attempt + 1}):`, error)
      }
    }

    // Timeout
    await this.updateDeploymentRecord(recordId, {
      verification_status: 'failed',
      verification_error: 'Verification timeout'
    })
  }

  // Get explorer API key
  private getExplorerApiKey(chainName: string): string {
    const apiKeys: Record<string, string> = {
      'Ethereum Mainnet': process.env.ETHERSCAN_API_KEY!,
      'Sepolia Testnet': process.env.ETHERSCAN_API_KEY!,
      'Polygon Mainnet': process.env.POLYGONSCAN_API_KEY!,
      'Arbitrum One': process.env.ARBISCAN_API_KEY!,
      'Optimism': process.env.OPTIMISM_API_KEY!,
      'Base': process.env.BASESCAN_API_KEY!,
      'BNB Smart Chain': process.env.BSCSCAN_API_KEY!
    }

    return apiKeys[chainName] || process.env.ETHERSCAN_API_KEY!
  }

  // Encode constructor arguments
  private encodeConstructorArgs(args: any[], abi: any[]): string {
    if (args.length === 0) return ''

    const constructor = abi.find(item => item.type === 'constructor')
    if (!constructor) return ''

    const coder = ethers.AbiCoder.defaultAbiCoder()
    return coder.encode(constructor.inputs.map((input: any) => input.type), args).slice(2)
  }

  // Get deployment status
  async getDeploymentStatus(deploymentId: string) {
    const { data, error } = await this.supabase
      .from('deployments')
      .select('*')
      .eq('deployment_id', deploymentId)
      .single()

    if (error) throw error
    return data
  }

  // Get user deployments
  async getUserDeployments(userId: string, options: { page?: number; limit?: number; chain?: ChainName } = {}) {
    const { page = 1, limit = 20, chain } = options
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('deployments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (chain) {
      query = query.eq('chain', chain)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      deployments: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  }
}

export default MultiChainDeployer
