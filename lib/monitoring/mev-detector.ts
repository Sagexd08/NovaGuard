// =============================================
// NOVAGUARD MEV DETECTION SYSTEM
// Advanced MEV risk detection and monitoring
// =============================================

import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'
import { SUPPORTED_CHAINS, type ChainName } from '@/lib/deployment/multi-chain-deployer'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type MEVRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type MEVAttackType = 
  | 'frontrunning'
  | 'backrunning' 
  | 'sandwich'
  | 'arbitrage'
  | 'liquidation'
  | 'oracle_manipulation'
  | 'flash_loan_attack'

export interface MEVAlert {
  id: string
  contractId: string
  attackType: MEVAttackType
  riskLevel: MEVRiskLevel
  confidence: number
  description: string
  transactionHash: string
  blockNumber: number
  gasPrice: string
  mevProfit?: string
  victimAddress?: string
  attackerAddress?: string
  timestamp: Date
  metadata: {
    frontrunTx?: string
    backrunTx?: string
    priceImpact?: number
    slippage?: number
    arbitrageProfit?: string
    flashLoanAmount?: string
  }
}

export interface MEVPattern {
  type: MEVAttackType
  indicators: {
    gasPrice: { min?: number; max?: number }
    timeWindow: number // seconds
    transactionCount: { min: number; max?: number }
    valueThreshold?: string
    contractInteractions?: string[]
  }
  riskScore: number
}

export class MEVDetector {
  private providers: Map<ChainName, ethers.JsonRpcProvider> = new Map()
  private mevPatterns: MEVPattern[] = []

  constructor() {
    this.initializeProviders()
    this.initializeMEVPatterns()
  }

  // Initialize blockchain providers
  private initializeProviders() {
    Object.entries(SUPPORTED_CHAINS).forEach(([chainName, config]) => {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl)
      this.providers.set(chainName as ChainName, provider)
    })
  }

  // Initialize MEV attack patterns
  private initializeMEVPatterns() {
    this.mevPatterns = [
      {
        type: 'frontrunning',
        indicators: {
          gasPrice: { min: 50 }, // High gas price
          timeWindow: 30,
          transactionCount: { min: 2, max: 5 },
          valueThreshold: '1000000000000000000' // 1 ETH
        },
        riskScore: 0.8
      },
      {
        type: 'sandwich',
        indicators: {
          gasPrice: { min: 30 },
          timeWindow: 60,
          transactionCount: { min: 3, max: 10 }
        },
        riskScore: 0.9
      },
      {
        type: 'arbitrage',
        indicators: {
          gasPrice: { min: 20 },
          timeWindow: 120,
          transactionCount: { min: 2, max: 20 }
        },
        riskScore: 0.6
      },
      {
        type: 'flash_loan_attack',
        indicators: {
          gasPrice: { min: 100 },
          timeWindow: 10,
          transactionCount: { min: 1, max: 3 },
          valueThreshold: '10000000000000000000000' // 10,000 ETH
        },
        riskScore: 0.95
      },
      {
        type: 'oracle_manipulation',
        indicators: {
          gasPrice: { min: 80 },
          timeWindow: 300,
          transactionCount: { min: 5, max: 50 }
        },
        riskScore: 0.85
      }
    ]
  }

  // Analyze block for MEV activities
  async analyzeBlockForMEV(
    chain: ChainName,
    blockNumber: number,
    contractAddress: string
  ): Promise<MEVAlert[]> {
    try {
      const provider = this.providers.get(chain)
      if (!provider) {
        throw new Error(`Provider not available for chain: ${chain}`)
      }

      const block = await provider.getBlock(blockNumber, true)
      if (!block || !block.transactions) {
        return []
      }

      const alerts: MEVAlert[] = []

      // Filter transactions involving the monitored contract
      const contractTransactions = block.transactions.filter(tx => 
        tx.to?.toLowerCase() === contractAddress.toLowerCase() ||
        tx.from?.toLowerCase() === contractAddress.toLowerCase()
      )

      if (contractTransactions.length === 0) {
        return []
      }

      // Analyze for different MEV patterns
      for (const pattern of this.mevPatterns) {
        const patternAlerts = await this.detectMEVPattern(
          pattern,
          contractTransactions,
          block,
          contractAddress,
          chain
        )
        alerts.push(...patternAlerts)
      }

      // Additional analysis for complex MEV strategies
      const complexAlerts = await this.detectComplexMEVStrategies(
        contractTransactions,
        block,
        contractAddress,
        chain
      )
      alerts.push(...complexAlerts)

      return alerts

    } catch (error) {
      console.error(`Error analyzing block ${blockNumber} for MEV:`, error)
      return []
    }
  }

  // Detect specific MEV pattern
  private async detectMEVPattern(
    pattern: MEVPattern,
    transactions: ethers.TransactionResponse[],
    block: ethers.Block,
    contractAddress: string,
    chain: ChainName
  ): Promise<MEVAlert[]> {
    const alerts: MEVAlert[] = []

    try {
      // Check transaction count
      if (transactions.length < pattern.indicators.transactionCount.min ||
          (pattern.indicators.transactionCount.max && transactions.length > pattern.indicators.transactionCount.max)) {
        return alerts
      }

      // Analyze gas prices
      const gasPrices = transactions.map(tx => Number(ethers.formatUnits(tx.gasPrice || 0, 'gwei')))
      const avgGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length

      if (pattern.indicators.gasPrice.min && avgGasPrice < pattern.indicators.gasPrice.min) {
        return alerts
      }

      // Check for specific attack patterns
      switch (pattern.type) {
        case 'frontrunning':
          alerts.push(...await this.detectFrontrunning(transactions, block, contractAddress, chain))
          break
        case 'sandwich':
          alerts.push(...await this.detectSandwichAttack(transactions, block, contractAddress, chain))
          break
        case 'arbitrage':
          alerts.push(...await this.detectArbitrage(transactions, block, contractAddress, chain))
          break
        case 'flash_loan_attack':
          alerts.push(...await this.detectFlashLoanAttack(transactions, block, contractAddress, chain))
          break
        case 'oracle_manipulation':
          alerts.push(...await this.detectOracleManipulation(transactions, block, contractAddress, chain))
          break
      }

    } catch (error) {
      console.error(`Error detecting MEV pattern ${pattern.type}:`, error)
    }

    return alerts
  }

  // Detect frontrunning attacks
  private async detectFrontrunning(
    transactions: ethers.TransactionResponse[],
    block: ethers.Block,
    contractAddress: string,
    chain: ChainName
  ): Promise<MEVAlert[]> {
    const alerts: MEVAlert[] = []

    // Sort transactions by gas price (descending)
    const sortedTxs = transactions.sort((a, b) => 
      Number(b.gasPrice || 0) - Number(a.gasPrice || 0)
    )

    for (let i = 0; i < sortedTxs.length - 1; i++) {
      const highGasTx = sortedTxs[i]
      const normalTx = sortedTxs[i + 1]

      const gasRatio = Number(highGasTx.gasPrice || 0) / Number(normalTx.gasPrice || 0)

      // Potential frontrunning if gas price is significantly higher
      if (gasRatio > 1.5) {
        const alert: MEVAlert = {
          id: `mev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contractId: contractAddress,
          attackType: 'frontrunning',
          riskLevel: this.calculateRiskLevel(gasRatio, 0.8),
          confidence: Math.min(gasRatio / 2, 0.95),
          description: `Potential frontrunning detected: ${gasRatio.toFixed(2)}x higher gas price`,
          transactionHash: highGasTx.hash,
          blockNumber: block.number,
          gasPrice: ethers.formatUnits(highGasTx.gasPrice || 0, 'gwei'),
          attackerAddress: highGasTx.from,
          victimAddress: normalTx.from,
          timestamp: new Date(block.timestamp * 1000),
          metadata: {
            frontrunTx: highGasTx.hash,
            backrunTx: normalTx.hash
          }
        }

        alerts.push(alert)
      }
    }

    return alerts
  }

  // Detect sandwich attacks
  private async detectSandwichAttack(
    transactions: ethers.TransactionResponse[],
    block: ethers.Block,
    contractAddress: string,
    chain: ChainName
  ): Promise<MEVAlert[]> {
    const alerts: MEVAlert[] = []

    // Look for sandwich pattern: high gas -> normal gas -> high gas
    for (let i = 0; i < transactions.length - 2; i++) {
      const tx1 = transactions[i]
      const tx2 = transactions[i + 1]
      const tx3 = transactions[i + 2]

      const gas1 = Number(ethers.formatUnits(tx1.gasPrice || 0, 'gwei'))
      const gas2 = Number(ethers.formatUnits(tx2.gasPrice || 0, 'gwei'))
      const gas3 = Number(ethers.formatUnits(tx3.gasPrice || 0, 'gwei'))

      // Check for sandwich pattern
      if (gas1 > gas2 * 1.3 && gas3 > gas2 * 1.3 && tx1.from === tx3.from) {
        const alert: MEVAlert = {
          id: `mev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contractId: contractAddress,
          attackType: 'sandwich',
          riskLevel: 'high',
          confidence: 0.85,
          description: 'Potential sandwich attack detected: front-run and back-run pattern',
          transactionHash: tx2.hash,
          blockNumber: block.number,
          gasPrice: ethers.formatUnits(tx2.gasPrice || 0, 'gwei'),
          attackerAddress: tx1.from,
          victimAddress: tx2.from,
          timestamp: new Date(block.timestamp * 1000),
          metadata: {
            frontrunTx: tx1.hash,
            backrunTx: tx3.hash
          }
        }

        alerts.push(alert)
      }
    }

    return alerts
  }

  // Detect arbitrage opportunities
  private async detectArbitrage(
    transactions: ethers.TransactionResponse[],
    block: ethers.Block,
    contractAddress: string,
    chain: ChainName
  ): Promise<MEVAlert[]> {
    const alerts: MEVAlert[] = []

    // Look for rapid buy/sell patterns
    const addressActivity = new Map<string, ethers.TransactionResponse[]>()

    transactions.forEach(tx => {
      if (!addressActivity.has(tx.from)) {
        addressActivity.set(tx.from, [])
      }
      addressActivity.get(tx.from)!.push(tx)
    })

    for (const [address, txs] of addressActivity) {
      if (txs.length >= 2) {
        // Check if transactions are close in time and potentially profitable
        const timeSpan = Math.max(...txs.map(tx => tx.nonce || 0)) - Math.min(...txs.map(tx => tx.nonce || 0))
        
        if (timeSpan <= 5) { // Within 5 nonce difference (likely same block or close blocks)
          const alert: MEVAlert = {
            id: `mev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractId: contractAddress,
            attackType: 'arbitrage',
            riskLevel: 'medium',
            confidence: 0.7,
            description: `Potential arbitrage detected: ${txs.length} rapid transactions`,
            transactionHash: txs[0].hash,
            blockNumber: block.number,
            gasPrice: ethers.formatUnits(txs[0].gasPrice || 0, 'gwei'),
            attackerAddress: address,
            timestamp: new Date(block.timestamp * 1000),
            metadata: {
              arbitrageProfit: 'Unknown'
            }
          }

          alerts.push(alert)
        }
      }
    }

    return alerts
  }

  // Detect flash loan attacks
  private async detectFlashLoanAttack(
    transactions: ethers.TransactionResponse[],
    block: ethers.Block,
    contractAddress: string,
    chain: ChainName
  ): Promise<MEVAlert[]> {
    const alerts: MEVAlert[] = []

    // Look for high-value transactions with complex call data
    for (const tx of transactions) {
      const value = tx.value
      const gasPrice = Number(ethers.formatUnits(tx.gasPrice || 0, 'gwei'))

      // High value + high gas price + complex transaction
      if (value > ethers.parseEther('1000') && gasPrice > 100 && tx.data.length > 1000) {
        const alert: MEVAlert = {
          id: `mev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contractId: contractAddress,
          attackType: 'flash_loan_attack',
          riskLevel: 'critical',
          confidence: 0.9,
          description: 'Potential flash loan attack: high value transaction with complex execution',
          transactionHash: tx.hash,
          blockNumber: block.number,
          gasPrice: ethers.formatUnits(tx.gasPrice || 0, 'gwei'),
          attackerAddress: tx.from,
          timestamp: new Date(block.timestamp * 1000),
          metadata: {
            flashLoanAmount: ethers.formatEther(value)
          }
        }

        alerts.push(alert)
      }
    }

    return alerts
  }

  // Detect oracle manipulation
  private async detectOracleManipulation(
    transactions: ethers.TransactionResponse[],
    block: ethers.Block,
    contractAddress: string,
    chain: ChainName
  ): Promise<MEVAlert[]> {
    const alerts: MEVAlert[] = []

    // Look for patterns that might indicate oracle manipulation
    const highGasTxs = transactions.filter(tx => 
      Number(ethers.formatUnits(tx.gasPrice || 0, 'gwei')) > 80
    )

    if (highGasTxs.length >= 3) {
      const alert: MEVAlert = {
        id: `mev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contractAddress,
        attackType: 'oracle_manipulation',
        riskLevel: 'high',
        confidence: 0.75,
        description: `Potential oracle manipulation: ${highGasTxs.length} high-gas transactions`,
        transactionHash: highGasTxs[0].hash,
        blockNumber: block.number,
        gasPrice: ethers.formatUnits(highGasTxs[0].gasPrice || 0, 'gwei'),
        attackerAddress: highGasTxs[0].from,
        timestamp: new Date(block.timestamp * 1000),
        metadata: {}
      }

      alerts.push(alert)
    }

    return alerts
  }

  // Detect complex MEV strategies
  private async detectComplexMEVStrategies(
    transactions: ethers.TransactionResponse[],
    block: ethers.Block,
    contractAddress: string,
    chain: ChainName
  ): Promise<MEVAlert[]> {
    const alerts: MEVAlert[] = []

    // Analyze transaction patterns for complex strategies
    const gasAnalysis = this.analyzeGasPatterns(transactions)
    const timeAnalysis = this.analyzeTimingPatterns(transactions)
    const valueAnalysis = this.analyzeValuePatterns(transactions)

    // Combine analyses to detect sophisticated attacks
    if (gasAnalysis.suspiciousPatterns && timeAnalysis.rapidExecution && valueAnalysis.highValue) {
      const alert: MEVAlert = {
        id: `mev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contractAddress,
        attackType: 'frontrunning', // Default type for complex strategies
        riskLevel: 'high',
        confidence: 0.8,
        description: 'Complex MEV strategy detected: sophisticated gas, timing, and value patterns',
        transactionHash: transactions[0].hash,
        blockNumber: block.number,
        gasPrice: ethers.formatUnits(transactions[0].gasPrice || 0, 'gwei'),
        attackerAddress: transactions[0].from,
        timestamp: new Date(block.timestamp * 1000),
        metadata: {
          gasAnalysis,
          timeAnalysis,
          valueAnalysis
        }
      }

      alerts.push(alert)
    }

    return alerts
  }

  // Analyze gas patterns
  private analyzeGasPatterns(transactions: ethers.TransactionResponse[]) {
    const gasPrices = transactions.map(tx => Number(ethers.formatUnits(tx.gasPrice || 0, 'gwei')))
    const avgGas = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length
    const maxGas = Math.max(...gasPrices)
    const minGas = Math.min(...gasPrices)

    return {
      average: avgGas,
      max: maxGas,
      min: minGas,
      variance: maxGas - minGas,
      suspiciousPatterns: maxGas > avgGas * 2
    }
  }

  // Analyze timing patterns
  private analyzeTimingPatterns(transactions: ethers.TransactionResponse[]) {
    const nonces = transactions.map(tx => tx.nonce || 0)
    const nonceSpread = Math.max(...nonces) - Math.min(...nonces)

    return {
      nonceSpread,
      rapidExecution: nonceSpread <= 10 && transactions.length >= 3
    }
  }

  // Analyze value patterns
  private analyzeValuePatterns(transactions: ethers.TransactionResponse[]) {
    const values = transactions.map(tx => Number(ethers.formatEther(tx.value)))
    const totalValue = values.reduce((sum, value) => sum + value, 0)
    const maxValue = Math.max(...values)

    return {
      totalValue,
      maxValue,
      highValue: maxValue > 10 || totalValue > 50 // ETH
    }
  }

  // Calculate risk level based on confidence and base risk
  private calculateRiskLevel(factor: number, baseRisk: number): MEVRiskLevel {
    const risk = baseRisk * Math.min(factor, 2)
    
    if (risk >= 0.9) return 'critical'
    if (risk >= 0.7) return 'high'
    if (risk >= 0.4) return 'medium'
    return 'low'
  }

  // Store MEV alert in database
  async storeMEVAlert(alert: MEVAlert): Promise<void> {
    try {
      const { error } = await supabase
        .from('mev_alerts')
        .insert({
          id: alert.id,
          contract_id: alert.contractId,
          attack_type: alert.attackType,
          risk_level: alert.riskLevel,
          confidence: alert.confidence,
          description: alert.description,
          transaction_hash: alert.transactionHash,
          block_number: alert.blockNumber,
          gas_price: alert.gasPrice,
          mev_profit: alert.mevProfit,
          victim_address: alert.victimAddress,
          attacker_address: alert.attackerAddress,
          timestamp: alert.timestamp.toISOString(),
          metadata: alert.metadata
        })

      if (error) {
        console.error('Error storing MEV alert:', error)
      } else {
        console.log(`🚨 MEV Alert stored: ${alert.attackType} - ${alert.riskLevel}`)
      }
    } catch (error) {
      console.error('Error storing MEV alert:', error)
    }
  }

  // Get MEV alerts for a contract
  async getMEVAlerts(contractId: string, limit: number = 50): Promise<MEVAlert[]> {
    try {
      const { data, error } = await supabase
        .from('mev_alerts')
        .select('*')
        .eq('contract_id', contractId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        contractId: item.contract_id,
        attackType: item.attack_type,
        riskLevel: item.risk_level,
        confidence: item.confidence,
        description: item.description,
        transactionHash: item.transaction_hash,
        blockNumber: item.block_number,
        gasPrice: item.gas_price,
        mevProfit: item.mev_profit,
        victimAddress: item.victim_address,
        attackerAddress: item.attacker_address,
        timestamp: new Date(item.timestamp),
        metadata: item.metadata
      }))
    } catch (error) {
      console.error('Error getting MEV alerts:', error)
      return []
    }
  }

  // Get MEV statistics
  async getMEVStats(contractId: string): Promise<{
    totalAlerts: number
    alertsByType: Record<MEVAttackType, number>
    alertsByRisk: Record<MEVRiskLevel, number>
    totalMEVProfit: string
    lastAlert: Date | null
  }> {
    try {
      const alerts = await this.getMEVAlerts(contractId, 1000)

      const alertsByType = alerts.reduce((acc, alert) => {
        acc[alert.attackType] = (acc[alert.attackType] || 0) + 1
        return acc
      }, {} as Record<MEVAttackType, number>)

      const alertsByRisk = alerts.reduce((acc, alert) => {
        acc[alert.riskLevel] = (acc[alert.riskLevel] || 0) + 1
        return acc
      }, {} as Record<MEVRiskLevel, number>)

      const totalMEVProfit = alerts
        .filter(alert => alert.mevProfit)
        .reduce((sum, alert) => sum + parseFloat(alert.mevProfit!), 0)
        .toFixed(4)

      const lastAlert = alerts.length > 0 ? alerts[0].timestamp : null

      return {
        totalAlerts: alerts.length,
        alertsByType,
        alertsByRisk,
        totalMEVProfit: `${totalMEVProfit} ETH`,
        lastAlert
      }
    } catch (error) {
      console.error('Error getting MEV stats:', error)
      return {
        totalAlerts: 0,
        alertsByType: {} as Record<MEVAttackType, number>,
        alertsByRisk: {} as Record<MEVRiskLevel, number>,
        totalMEVProfit: '0 ETH',
        lastAlert: null
      }
    }
  }
}

export default MEVDetector
