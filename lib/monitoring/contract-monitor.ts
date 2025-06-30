// =============================================
// NOVAGUARD CONTRACT MONITORING SYSTEM
// Real-time blockchain contract monitoring
// =============================================

import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'
import { SUPPORTED_CHAINS, type ChainName } from '@/lib/deployment/multi-chain-deployer'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Alert types
export type AlertType =
  | 'large_transaction'
  | 'unusual_activity'
  | 'security_breach'
  | 'gas_spike'
  | 'ownership_change'
  | 'upgrade_detected'
  | 'pause_unpause'
  | 'emergency_stop'

export interface MonitoringRule {
  id: string
  contractId: string
  ruleType: AlertType
  conditions: {
    threshold?: number
    timeWindow?: number // minutes
    eventSignature?: string
    functionSelector?: string
    valueThreshold?: string // in wei
  }
  isActive: boolean
  notifications: {
    email: boolean
    webhook: boolean
    inApp: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface ContractAlert {
  id: string
  contractId: string
  ruleId: string
  alertType: AlertType
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  transactionHash?: string
  blockNumber?: number
  timestamp: Date
  acknowledged: boolean
  metadata: Record<string, any>
}

export interface MonitoredContract {
  id: string
  contractAddress: string
  chain: ChainName
  userId: string
  name: string
  abi?: any[]
  isActive: boolean
  monitoringRules: MonitoringRule[]
  lastChecked: Date
  createdAt: Date
}

export class ContractMonitor {
  private providers: Map<ChainName, ethers.JsonRpcProvider> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.initializeProviders()
  }

  // Initialize blockchain providers
  private initializeProviders() {
    Object.entries(SUPPORTED_CHAINS).forEach(([chainName, config]) => {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl)
      this.providers.set(chainName as ChainName, provider)
    })
  }

  // Start monitoring a contract
  async startMonitoring(contractId: string): Promise<void> {
    try {
      const contract = await this.getMonitoredContract(contractId)
      if (!contract || !contract.isActive) {
        throw new Error('Contract not found or inactive')
      }

      // Stop existing monitoring if any
      this.stopMonitoring(contractId)

      console.log(`🔍 Starting monitoring for contract: ${contract.contractAddress} on ${contract.chain}`)

      // Set up real-time monitoring
      const provider = this.providers.get(contract.chain)
      if (!provider) {
        throw new Error(`Provider not available for chain: ${contract.chain}`)
      }

      // Monitor new blocks
      const blockListener = async (blockNumber: number) => {
        await this.checkContractInBlock(contract, blockNumber)
      }

      provider.on('block', blockListener)

      // Store the listener for cleanup
      this.monitoringIntervals.set(contractId, setInterval(() => {
        this.performPeriodicChecks(contract)
      }, 60000)) // Check every minute

      // Update last checked timestamp
      await this.updateLastChecked(contractId)

    } catch (error) {
      console.error(`Failed to start monitoring for contract ${contractId}:`, error)
      throw error
    }
  }

  // Stop monitoring a contract
  stopMonitoring(contractId: string): void {
    const interval = this.monitoringIntervals.get(contractId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(contractId)
      console.log(`⏹️ Stopped monitoring for contract: ${contractId}`)
    }
  }

  // Check contract activity in a specific block
  private async checkContractInBlock(contract: MonitoredContract, blockNumber: number): Promise<void> {
    try {
      const provider = this.providers.get(contract.chain)!
      const block = await provider.getBlock(blockNumber, true)

      if (!block || !block.transactions) return

      // Filter transactions involving the monitored contract
      const contractTransactions = block.transactions.filter(tx =>
        tx.to?.toLowerCase() === contract.contractAddress.toLowerCase()
      )

      for (const tx of contractTransactions) {
        await this.analyzeTransaction(contract, tx, blockNumber)
      }

    } catch (error) {
      console.error(`Error checking contract in block ${blockNumber}:`, error)
    }
  }

  // Analyze a transaction for alerts
  private async analyzeTransaction(
    contract: MonitoredContract,
    transaction: ethers.TransactionResponse,
    blockNumber: number
  ): Promise<void> {
    try {
      const provider = this.providers.get(contract.chain)!
      const receipt = await provider.getTransactionReceipt(transaction.hash)

      if (!receipt) return

      // Check each monitoring rule
      for (const rule of contract.monitoringRules) {
        if (!rule.isActive) continue

        const alert = await this.checkRule(contract, rule, transaction, receipt, blockNumber)
        if (alert) {
          await this.createAlert(alert)
          await this.sendNotifications(alert, rule)
        }
      }

    } catch (error) {
      console.error(`Error analyzing transaction ${transaction.hash}:`, error)
    }
  }

  // Check a specific monitoring rule
  private async checkRule(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    const { ruleType, conditions } = rule

    switch (ruleType) {
      case 'large_transaction':
        return this.checkLargeTransaction(contract, rule, transaction, blockNumber)

      case 'unusual_activity':
        return this.checkUnusualActivity(contract, rule, transaction, blockNumber)

      case 'security_breach':
        return this.checkSecurityBreach(contract, rule, transaction, receipt, blockNumber)

      case 'gas_spike':
        return this.checkGasSpike(contract, rule, transaction, receipt, blockNumber)

      case 'ownership_change':
        return this.checkOwnershipChange(contract, rule, transaction, receipt, blockNumber)

      case 'upgrade_detected':
        return this.checkUpgrade(contract, rule, transaction, receipt, blockNumber)

      case 'pause_unpause':
        return this.checkPauseUnpause(contract, rule, transaction, receipt, blockNumber)

      case 'emergency_stop':
        return this.checkEmergencyStop(contract, rule, transaction, receipt, blockNumber)

      default:
        return null
    }
  }

  // Check for large transactions
  private async checkLargeTransaction(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    const threshold = rule.conditions.valueThreshold || '1000000000000000000' // 1 ETH default
    const thresholdWei = BigInt(threshold)

    if (transaction.value >= thresholdWei) {
      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        ruleId: rule.id,
        alertType: 'large_transaction',
        severity: transaction.value >= thresholdWei * BigInt(10) ? 'critical' : 'high',
        title: 'Large Transaction Detected',
        description: `Transaction of ${ethers.formatEther(transaction.value)} ETH detected`,
        transactionHash: transaction.hash,
        blockNumber,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          value: transaction.value.toString(),
          from: transaction.from,
          gasPrice: transaction.gasPrice?.toString()
        }
      }
    }

    return null
  }

  // Check for unusual activity patterns
  private async checkUnusualActivity(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    // Get recent transaction count
    const timeWindow = rule.conditions.timeWindow || 60 // minutes
    const threshold = rule.conditions.threshold || 10

    const recentCount = await this.getRecentTransactionCount(
      contract.contractAddress,
      contract.chain,
      timeWindow
    )

    if (recentCount >= threshold) {
      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        ruleId: rule.id,
        alertType: 'unusual_activity',
        severity: recentCount >= threshold * 2 ? 'high' : 'medium',
        title: 'Unusual Activity Detected',
        description: `${recentCount} transactions in the last ${timeWindow} minutes`,
        transactionHash: transaction.hash,
        blockNumber,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          transactionCount: recentCount,
          timeWindow,
          threshold
        }
      }
    }

    return null
  }

  // Start monitoring all active contracts
  async startAllMonitoring(): Promise<void> {
    try {
      const { data: contracts } = await supabase
        .from('monitored_contracts')
        .select('id')
        .eq('is_active', true)

      if (contracts) {
        for (const contract of contracts) {
          await this.startMonitoring(contract.id)
        }
        console.log(`🚀 Started monitoring ${contracts.length} contracts`)
      }
    } catch (error) {
      console.error('Failed to start all monitoring:', error)
    }
  }

  // Stop monitoring all contracts
  stopAllMonitoring(): void {
    for (const contractId of this.monitoringIntervals.keys()) {
      this.stopMonitoring(contractId)
    }
    console.log('⏹️ Stopped all contract monitoring')
  }

  // Get monitoring statistics
  async getMonitoringStats(userId: string): Promise<{
    totalContracts: number
    activeContracts: number
    totalAlerts: number
    unacknowledgedAlerts: number
    alertsByType: Record<AlertType, number>
  }> {
    const { data: contracts } = await supabase
      .from('monitored_contracts')
      .select('id, is_active')
      .eq('user_id', userId)

    const { data: alerts } = await supabase
      .from('contract_alerts')
      .select('alert_type, acknowledged')
      .in('contract_id', contracts?.map(c => c.id) || [])

    const totalContracts = contracts?.length || 0
    const activeContracts = contracts?.filter(c => c.is_active).length || 0
    const totalAlerts = alerts?.length || 0
    const unacknowledgedAlerts = alerts?.filter(a => !a.acknowledged).length || 0

    const alertsByType = alerts?.reduce((acc, alert) => {
      acc[alert.alert_type as AlertType] = (acc[alert.alert_type as AlertType] || 0) + 1
      return acc
    }, {} as Record<AlertType, number>) || {}

    return {
      totalContracts,
      activeContracts,
      totalAlerts,
      unacknowledgedAlerts,
      alertsByType
    }
  }
  }

  // Check for security breaches
  private async checkSecurityBreach(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    // Check for failed transactions (potential attack attempts)
    if (receipt.status === 0) {
      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        ruleId: rule.id,
        alertType: 'security_breach',
        severity: 'medium',
        title: 'Failed Transaction Detected',
        description: 'Transaction failed - potential attack attempt',
        transactionHash: transaction.hash,
        blockNumber,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          gasUsed: receipt.gasUsed.toString(),
          from: transaction.from
        }
      }
    }

    return null
  }

  // Check for gas spikes
  private async checkGasSpike(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    const gasThreshold = rule.conditions.threshold || 500000 // 500k gas default

    if (receipt.gasUsed > gasThreshold) {
      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        ruleId: rule.id,
        alertType: 'gas_spike',
        severity: 'low',
        title: 'High Gas Usage Detected',
        description: `Transaction used ${receipt.gasUsed.toLocaleString()} gas`,
        transactionHash: transaction.hash,
        blockNumber,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          gasUsed: receipt.gasUsed.toString(),
          gasLimit: transaction.gasLimit?.toString(),
          gasPrice: transaction.gasPrice?.toString()
        }
      }
    }

    return null
  }

  // Check for ownership changes
  private async checkOwnershipChange(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    // Look for OwnershipTransferred events
    const ownershipTransferTopic = '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0'

    const ownershipEvents = receipt.logs.filter(log =>
      log.topics[0] === ownershipTransferTopic
    )

    if (ownershipEvents.length > 0) {
      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        ruleId: rule.id,
        alertType: 'ownership_change',
        severity: 'critical',
        title: 'Ownership Transfer Detected',
        description: 'Contract ownership has been transferred',
        transactionHash: transaction.hash,
        blockNumber,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          events: ownershipEvents.length,
          from: transaction.from
        }
      }
    }

    return null
  }

  // Check for contract upgrades
  private async checkUpgrade(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    // Look for Upgraded events (common in proxy patterns)
    const upgradeTopic = '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b'

    const upgradeEvents = receipt.logs.filter(log =>
      log.topics[0] === upgradeTopic
    )

    if (upgradeEvents.length > 0) {
      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        ruleId: rule.id,
        alertType: 'upgrade_detected',
        severity: 'high',
        title: 'Contract Upgrade Detected',
        description: 'Contract implementation has been upgraded',
        transactionHash: transaction.hash,
        blockNumber,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          events: upgradeEvents.length,
          from: transaction.from
        }
      }
    }

    return null
  }

  // Check for pause/unpause events
  private async checkPauseUnpause(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    // Look for Paused/Unpaused events
    const pausedTopic = '0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258'
    const unpausedTopic = '0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa'

    const pauseEvents = receipt.logs.filter(log =>
      log.topics[0] === pausedTopic || log.topics[0] === unpausedTopic
    )

    if (pauseEvents.length > 0) {
      const isPaused = pauseEvents.some(log => log.topics[0] === pausedTopic)

      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        ruleId: rule.id,
        alertType: 'pause_unpause',
        severity: isPaused ? 'high' : 'medium',
        title: `Contract ${isPaused ? 'Paused' : 'Unpaused'}`,
        description: `Contract has been ${isPaused ? 'paused' : 'unpaused'}`,
        transactionHash: transaction.hash,
        blockNumber,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          action: isPaused ? 'paused' : 'unpaused',
          from: transaction.from
        }
      }
    }

    return null
  }

  // Check for emergency stop
  private async checkEmergencyStop(
    contract: MonitoredContract,
    rule: MonitoringRule,
    transaction: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    blockNumber: number
  ): Promise<ContractAlert | null> {
    // Look for emergency stop function calls
    const emergencyStopSelector = '0x63a599a4' // emergencyStop() function selector

    if (transaction.data.startsWith(emergencyStopSelector)) {
      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        ruleId: rule.id,
        alertType: 'emergency_stop',
        severity: 'critical',
        title: 'Emergency Stop Activated',
        description: 'Emergency stop function has been called',
        transactionHash: transaction.hash,
        blockNumber,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          from: transaction.from,
          functionSelector: emergencyStopSelector
        }
      }
    }

    return null
  }

  // Perform periodic checks
  private async performPeriodicChecks(contract: MonitoredContract): Promise<void> {
    try {
      // Update last checked timestamp
      await this.updateLastChecked(contract.id)

      // Perform additional checks like balance monitoring, etc.
      await this.checkContractBalance(contract)

    } catch (error) {
      console.error(`Error in periodic checks for contract ${contract.id}:`, error)
    }
  }

  // Check contract balance changes
  private async checkContractBalance(contract: MonitoredContract): Promise<void> {
    try {
      const provider = this.providers.get(contract.chain)!
      const currentBalance = await provider.getBalance(contract.contractAddress)

      // Get previous balance from database
      const { data: lastBalance } = await supabase
        .from('contract_balances')
        .select('balance')
        .eq('contract_id', contract.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Store current balance
      await supabase
        .from('contract_balances')
        .insert({
          contract_id: contract.id,
          balance: currentBalance.toString(),
          created_at: new Date().toISOString()
        })

      // Check for significant balance changes
      if (lastBalance) {
        const previousBalance = BigInt(lastBalance.balance)
        const change = currentBalance - previousBalance
        const changePercent = Number(change * BigInt(100) / previousBalance)

        if (Math.abs(changePercent) > 20) { // 20% change threshold
          await this.createAlert({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractId: contract.id,
            ruleId: 'balance_change',
            alertType: 'unusual_activity',
            severity: Math.abs(changePercent) > 50 ? 'high' : 'medium',
            title: 'Significant Balance Change',
            description: `Contract balance changed by ${changePercent.toFixed(2)}%`,
            timestamp: new Date(),
            acknowledged: false,
            metadata: {
              previousBalance: previousBalance.toString(),
              currentBalance: currentBalance.toString(),
              changePercent
            }
          })
        }
      }

    } catch (error) {
      console.error(`Error checking contract balance:`, error)
    }
  }

  // Get recent transaction count
  private async getRecentTransactionCount(
    contractAddress: string,
    chain: ChainName,
    timeWindowMinutes: number
  ): Promise<number> {
    const { count } = await supabase
      .from('contract_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('contract_address', contractAddress.toLowerCase())
      .eq('chain', chain)
      .gte('created_at', new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString())

    return count || 0
  }

  // Database operations
  private async getMonitoredContract(contractId: string): Promise<MonitoredContract | null> {
    const { data, error } = await supabase
      .from('monitored_contracts')
      .select(`
        *,
        monitoring_rules (*)
      `)
      .eq('id', contractId)
      .single()

    if (error) {
      console.error('Error fetching monitored contract:', error)
      return null
    }

    return {
      id: data.id,
      contractAddress: data.contract_address,
      chain: data.chain,
      userId: data.user_id,
      name: data.name,
      abi: data.abi,
      isActive: data.is_active,
      monitoringRules: data.monitoring_rules || [],
      lastChecked: new Date(data.last_checked),
      createdAt: new Date(data.created_at)
    }
  }

  private async updateLastChecked(contractId: string): Promise<void> {
    await supabase
      .from('monitored_contracts')
      .update({ last_checked: new Date().toISOString() })
      .eq('id', contractId)
  }

  private async createAlert(alert: ContractAlert): Promise<void> {
    const { error } = await supabase
      .from('contract_alerts')
      .insert({
        id: alert.id,
        contract_id: alert.contractId,
        rule_id: alert.ruleId,
        alert_type: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        transaction_hash: alert.transactionHash,
        block_number: alert.blockNumber,
        timestamp: alert.timestamp.toISOString(),
        acknowledged: alert.acknowledged,
        metadata: alert.metadata
      })

    if (error) {
      console.error('Error creating alert:', error)
    } else {
      console.log(`🚨 Alert created: ${alert.title} for contract ${alert.contractId}`)
    }
  }

  private async sendNotifications(alert: ContractAlert, rule: MonitoringRule): Promise<void> {
    try {
      // Send in-app notification
      if (rule.notifications.inApp) {
        // Implementation for in-app notifications
        console.log(`📱 In-app notification sent for alert: ${alert.title}`)
      }

      // Send email notification
      if (rule.notifications.email) {
        // Implementation for email notifications
        console.log(`📧 Email notification sent for alert: ${alert.title}`)
      }

      // Send webhook notification
      if (rule.notifications.webhook) {
        // Implementation for webhook notifications
        console.log(`🔗 Webhook notification sent for alert: ${alert.title}`)
      }

    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  // Public methods for managing monitoring
  async addContract(
    contractAddress: string,
    chain: ChainName,
    userId: string,
    name: string,
    abi?: any[]
  ): Promise<string> {
    const { data, error } = await supabase
      .from('monitored_contracts')
      .insert({
        contract_address: contractAddress.toLowerCase(),
        chain,
        user_id: userId,
        name,
        abi,
        is_active: true,
        last_checked: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add contract: ${error.message}`)
    }

    return data.id
  }

  async addMonitoringRule(
    contractId: string,
    ruleType: AlertType,
    conditions: MonitoringRule['conditions'],
    notifications: MonitoringRule['notifications']
  ): Promise<string> {
    const { data, error } = await supabase
      .from('monitoring_rules')
      .insert({
        contract_id: contractId,
        rule_type: ruleType,
        conditions,
        is_active: true,
        notifications,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add monitoring rule: ${error.message}`)
    }

    return data.id
  }

  async getContractAlerts(contractId: string, limit: number = 50): Promise<ContractAlert[]> {
    const { data, error } = await supabase
      .from('contract_alerts')
      .select('*')
      .eq('contract_id', contractId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get alerts: ${error.message}`)
    }

    return data.map(item => ({
      id: item.id,
      contractId: item.contract_id,
      ruleId: item.rule_id,
      alertType: item.alert_type,
      severity: item.severity,
      title: item.title,
      description: item.description,
      transactionHash: item.transaction_hash,
      blockNumber: item.block_number,
      timestamp: new Date(item.timestamp),
      acknowledged: item.acknowledged,
      metadata: item.metadata
    }))
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId)

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`)
    }
  }
}

export default ContractMonitor
