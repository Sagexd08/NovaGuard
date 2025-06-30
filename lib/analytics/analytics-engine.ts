// =============================================
// NOVAGUARD ANALYTICS ENGINE
// Advanced analytics and insights for smart contracts
// =============================================

import { createClient } from '@supabase/supabase-js'
import { ethers } from 'ethers'
import { SUPPORTED_CHAINS, type ChainName } from '@/lib/deployment/multi-chain-deployer'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AnalyticsMetrics {
  // Security metrics
  securityScore: number
  vulnerabilityCount: number
  criticalIssues: number
  securityTrend: 'improving' | 'stable' | 'declining'
  
  // Gas metrics
  averageGasUsage: number
  gasOptimizationPotential: number
  gasEfficiencyScore: number
  gasTrend: 'improving' | 'stable' | 'declining'
  
  // MEV metrics
  mevExposure: number
  mevAttacks: number
  mevLoss: string
  mevProtectionScore: number
  
  // Usage metrics
  transactionCount: number
  uniqueUsers: number
  totalValue: string
  activityTrend: 'increasing' | 'stable' | 'decreasing'
  
  // Quality metrics
  codeQuality: number
  testCoverage: number
  documentationScore: number
  maintainabilityIndex: number
  
  // Performance metrics
  uptime: number
  responseTime: number
  errorRate: number
  
  // Timestamps
  lastUpdated: Date
  analysisDate: Date
}

export interface TrendData {
  timestamp: Date
  value: number
  label?: string
}

export interface ComparisonData {
  metric: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export interface InsightData {
  id: string
  type: 'security' | 'gas' | 'mev' | 'usage' | 'quality'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  recommendation: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  priority: number
  createdAt: Date
}

export class AnalyticsEngine {
  // Calculate comprehensive analytics for a contract
  async calculateContractAnalytics(contractId: string, timeRange: '24h' | '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsMetrics> {
    try {
      console.log(`📊 Calculating analytics for contract ${contractId} (${timeRange})`)

      const [
        securityMetrics,
        gasMetrics,
        mevMetrics,
        usageMetrics,
        qualityMetrics,
        performanceMetrics
      ] = await Promise.all([
        this.calculateSecurityMetrics(contractId, timeRange),
        this.calculateGasMetrics(contractId, timeRange),
        this.calculateMEVMetrics(contractId, timeRange),
        this.calculateUsageMetrics(contractId, timeRange),
        this.calculateQualityMetrics(contractId),
        this.calculatePerformanceMetrics(contractId, timeRange)
      ])

      const analytics: AnalyticsMetrics = {
        ...securityMetrics,
        ...gasMetrics,
        ...mevMetrics,
        ...usageMetrics,
        ...qualityMetrics,
        ...performanceMetrics,
        lastUpdated: new Date(),
        analysisDate: new Date()
      }

      // Store analytics in database
      await this.storeAnalytics(contractId, analytics)

      console.log(`✅ Analytics calculated for contract ${contractId}`)
      return analytics

    } catch (error) {
      console.error(`❌ Failed to calculate analytics for contract ${contractId}:`, error)
      throw error
    }
  }

  // Calculate security metrics
  private async calculateSecurityMetrics(contractId: string, timeRange: string) {
    const { data: alerts } = await supabase
      .from('contract_alerts')
      .select('severity, created_at')
      .eq('contract_id', contractId)
      .gte('created_at', this.getTimeRangeStart(timeRange))

    const vulnerabilityCount = alerts?.length || 0
    const criticalIssues = alerts?.filter(a => a.severity === 'critical').length || 0
    
    // Calculate security score (0-100)
    let securityScore = 100
    securityScore -= criticalIssues * 20
    securityScore -= (vulnerabilityCount - criticalIssues) * 5
    securityScore = Math.max(0, securityScore)

    // Calculate trend
    const previousPeriodAlerts = await this.getPreviousPeriodAlerts(contractId, timeRange)
    const securityTrend = this.calculateTrend(vulnerabilityCount, previousPeriodAlerts)

    return {
      securityScore,
      vulnerabilityCount,
      criticalIssues,
      securityTrend
    }
  }

  // Calculate gas metrics
  private async calculateGasMetrics(contractId: string, timeRange: string) {
    const { data: transactions } = await supabase
      .from('contract_transactions')
      .select('gas_used, gas_price, created_at')
      .eq('contract_id', contractId)
      .gte('created_at', this.getTimeRangeStart(timeRange))

    if (!transactions || transactions.length === 0) {
      return {
        averageGasUsage: 0,
        gasOptimizationPotential: 0,
        gasEfficiencyScore: 100,
        gasTrend: 'stable' as const
      }
    }

    const averageGasUsage = transactions.reduce((sum, tx) => sum + parseInt(tx.gas_used), 0) / transactions.length
    
    // Estimate optimization potential (simplified)
    const gasOptimizationPotential = Math.min(30, averageGasUsage * 0.15 / 1000) // Up to 30% potential
    
    // Calculate efficiency score
    const gasEfficiencyScore = Math.max(0, 100 - (averageGasUsage / 100000) * 10)
    
    // Calculate trend
    const previousPeriodGas = await this.getPreviousPeriodGasUsage(contractId, timeRange)
    const gasTrend = this.calculateTrend(averageGasUsage, previousPeriodGas, true) // Reverse for gas (lower is better)

    return {
      averageGasUsage: Math.round(averageGasUsage),
      gasOptimizationPotential: Math.round(gasOptimizationPotential),
      gasEfficiencyScore: Math.round(gasEfficiencyScore),
      gasTrend
    }
  }

  // Calculate MEV metrics
  private async calculateMEVMetrics(contractId: string, timeRange: string) {
    const { data: mevAlerts } = await supabase
      .from('mev_alerts')
      .select('risk_level, mev_profit, created_at')
      .eq('contract_id', contractId)
      .gte('created_at', this.getTimeRangeStart(timeRange))

    const mevAttacks = mevAlerts?.length || 0
    const mevLoss = mevAlerts?.reduce((sum, alert) => {
      return sum + (parseFloat(alert.mev_profit || '0'))
    }, 0) || 0

    // Calculate MEV exposure (0-100, higher is worse)
    let mevExposure = 0
    if (mevAttacks > 0) {
      mevExposure = Math.min(100, mevAttacks * 10 + (mevLoss * 100))
    }

    // Calculate MEV protection score (0-100, higher is better)
    const mevProtectionScore = Math.max(0, 100 - mevExposure)

    return {
      mevExposure: Math.round(mevExposure),
      mevAttacks,
      mevLoss: `${mevLoss.toFixed(4)} ETH`,
      mevProtectionScore: Math.round(mevProtectionScore)
    }
  }

  // Calculate usage metrics
  private async calculateUsageMetrics(contractId: string, timeRange: string) {
    const { data: transactions } = await supabase
      .from('contract_transactions')
      .select('from_address, value, created_at')
      .eq('contract_id', contractId)
      .gte('created_at', this.getTimeRangeStart(timeRange))

    const transactionCount = transactions?.length || 0
    const uniqueUsers = new Set(transactions?.map(tx => tx.from_address)).size || 0
    const totalValue = transactions?.reduce((sum, tx) => sum + parseFloat(tx.value || '0'), 0) || 0

    // Calculate activity trend
    const previousPeriodTxCount = await this.getPreviousPeriodTransactionCount(contractId, timeRange)
    const activityTrend = this.calculateTrend(transactionCount, previousPeriodTxCount)

    return {
      transactionCount,
      uniqueUsers,
      totalValue: `${totalValue.toFixed(4)} ETH`,
      activityTrend
    }
  }

  // Calculate quality metrics
  private async calculateQualityMetrics(contractId: string) {
    // These would be calculated from static analysis results
    // For now, using placeholder values
    return {
      codeQuality: 85,
      testCoverage: 75,
      documentationScore: 70,
      maintainabilityIndex: 80
    }
  }

  // Calculate performance metrics
  private async calculatePerformanceMetrics(contractId: string, timeRange: string) {
    // These would be calculated from monitoring data
    // For now, using placeholder values
    return {
      uptime: 99.9,
      responseTime: 150, // ms
      errorRate: 0.1 // %
    }
  }

  // Get trend data for visualization
  async getTrendData(contractId: string, metric: string, timeRange: '24h' | '7d' | '30d' | '90d'): Promise<TrendData[]> {
    try {
      const { data } = await supabase
        .from('analytics_history')
        .select('created_at, metrics')
        .eq('contract_id', contractId)
        .gte('created_at', this.getTimeRangeStart(timeRange))
        .order('created_at', { ascending: true })

      if (!data) return []

      return data.map(record => ({
        timestamp: new Date(record.created_at),
        value: record.metrics[metric] || 0,
        label: new Date(record.created_at).toLocaleDateString()
      }))

    } catch (error) {
      console.error('Error getting trend data:', error)
      return []
    }
  }

  // Get comparison data
  async getComparisonData(contractId: string, metrics: string[]): Promise<ComparisonData[]> {
    try {
      const current = await this.calculateContractAnalytics(contractId, '30d')
      const previous = await this.getPreviousPeriodAnalytics(contractId, '30d')

      return metrics.map(metric => {
        const currentValue = (current as any)[metric] || 0
        const previousValue = (previous as any)[metric] || 0
        const change = currentValue - previousValue
        const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0

        return {
          metric,
          current: currentValue,
          previous: previousValue,
          change,
          changePercent,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        }
      })

    } catch (error) {
      console.error('Error getting comparison data:', error)
      return []
    }
  }

  // Generate insights and recommendations
  async generateInsights(contractId: string): Promise<InsightData[]> {
    try {
      const analytics = await this.calculateContractAnalytics(contractId)
      const insights: InsightData[] = []

      // Security insights
      if (analytics.criticalIssues > 0) {
        insights.push({
          id: `insight_${Date.now()}_1`,
          type: 'security',
          severity: 'critical',
          title: 'Critical Security Issues Detected',
          description: `${analytics.criticalIssues} critical security issues found that require immediate attention.`,
          recommendation: 'Review and fix critical vulnerabilities immediately. Consider pausing contract operations if necessary.',
          impact: 'high',
          effort: 'high',
          priority: 1,
          createdAt: new Date()
        })
      }

      // Gas optimization insights
      if (analytics.gasOptimizationPotential > 15) {
        insights.push({
          id: `insight_${Date.now()}_2`,
          type: 'gas',
          severity: 'warning',
          title: 'Significant Gas Optimization Opportunity',
          description: `Contract could save approximately ${analytics.gasOptimizationPotential}% on gas costs.`,
          recommendation: 'Implement gas optimization patterns such as storage packing, loop optimization, and efficient data structures.',
          impact: 'medium',
          effort: 'medium',
          priority: 2,
          createdAt: new Date()
        })
      }

      // MEV insights
      if (analytics.mevExposure > 50) {
        insights.push({
          id: `insight_${Date.now()}_3`,
          type: 'mev',
          severity: 'warning',
          title: 'High MEV Exposure',
          description: `Contract has high MEV exposure with ${analytics.mevAttacks} attacks detected.`,
          recommendation: 'Implement MEV protection mechanisms such as commit-reveal schemes, time delays, or MEV-resistant design patterns.',
          impact: 'high',
          effort: 'high',
          priority: 1,
          createdAt: new Date()
        })
      }

      // Usage insights
      if (analytics.activityTrend === 'decreasing') {
        insights.push({
          id: `insight_${Date.now()}_4`,
          type: 'usage',
          severity: 'info',
          title: 'Declining Usage Trend',
          description: 'Contract usage has been declining over the recent period.',
          recommendation: 'Analyze user feedback and consider feature improvements or marketing initiatives.',
          impact: 'medium',
          effort: 'low',
          priority: 3,
          createdAt: new Date()
        })
      }

      // Quality insights
      if (analytics.testCoverage < 80) {
        insights.push({
          id: `insight_${Date.now()}_5`,
          type: 'quality',
          severity: 'warning',
          title: 'Low Test Coverage',
          description: `Test coverage is ${analytics.testCoverage}%, below the recommended 80% threshold.`,
          recommendation: 'Increase test coverage by adding unit tests, integration tests, and edge case testing.',
          impact: 'medium',
          effort: 'medium',
          priority: 2,
          createdAt: new Date()
        })
      }

      // Sort by priority
      insights.sort((a, b) => a.priority - b.priority)

      return insights

    } catch (error) {
      console.error('Error generating insights:', error)
      return []
    }
  }

  // Get portfolio analytics for multiple contracts
  async getPortfolioAnalytics(userId: string): Promise<{
    totalContracts: number
    averageSecurityScore: number
    totalGasSaved: number
    totalMEVLoss: string
    totalTransactions: number
    portfolioValue: string
    riskDistribution: Record<string, number>
    topPerformers: Array<{ contractId: string; score: number }>
    recommendations: string[]
  }> {
    try {
      const { data: contracts } = await supabase
        .from('monitored_contracts')
        .select('id')
        .eq('user_id', userId)

      if (!contracts || contracts.length === 0) {
        return {
          totalContracts: 0,
          averageSecurityScore: 0,
          totalGasSaved: 0,
          totalMEVLoss: '0 ETH',
          totalTransactions: 0,
          portfolioValue: '0 ETH',
          riskDistribution: {},
          topPerformers: [],
          recommendations: []
        }
      }

      const analyticsPromises = contracts.map(contract => 
        this.calculateContractAnalytics(contract.id)
      )

      const allAnalytics = await Promise.all(analyticsPromises)

      const totalContracts = contracts.length
      const averageSecurityScore = allAnalytics.reduce((sum, a) => sum + a.securityScore, 0) / totalContracts
      const totalGasSaved = allAnalytics.reduce((sum, a) => sum + a.gasOptimizationPotential, 0)
      const totalMEVLoss = allAnalytics.reduce((sum, a) => sum + parseFloat(a.mevLoss.replace(' ETH', '')), 0)
      const totalTransactions = allAnalytics.reduce((sum, a) => sum + a.transactionCount, 0)
      const portfolioValue = allAnalytics.reduce((sum, a) => sum + parseFloat(a.totalValue.replace(' ETH', '')), 0)

      // Risk distribution
      const riskDistribution = allAnalytics.reduce((dist, a) => {
        if (a.securityScore >= 80) dist.low = (dist.low || 0) + 1
        else if (a.securityScore >= 60) dist.medium = (dist.medium || 0) + 1
        else dist.high = (dist.high || 0) + 1
        return dist
      }, {} as Record<string, number>)

      // Top performers
      const topPerformers = allAnalytics
        .map((a, i) => ({ contractId: contracts[i].id, score: a.securityScore }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      // Generate recommendations
      const recommendations = []
      if (averageSecurityScore < 70) {
        recommendations.push('Focus on improving security across your contract portfolio')
      }
      if (totalMEVLoss > 1) {
        recommendations.push('Implement MEV protection mechanisms to reduce losses')
      }
      if (totalGasSaved > 20) {
        recommendations.push('Significant gas optimization opportunities available')
      }

      return {
        totalContracts,
        averageSecurityScore: Math.round(averageSecurityScore),
        totalGasSaved: Math.round(totalGasSaved),
        totalMEVLoss: `${totalMEVLoss.toFixed(4)} ETH`,
        totalTransactions,
        portfolioValue: `${portfolioValue.toFixed(4)} ETH`,
        riskDistribution,
        topPerformers,
        recommendations
      }

    } catch (error) {
      console.error('Error getting portfolio analytics:', error)
      throw error
    }
  }

  // Helper methods
  private getTimeRangeStart(timeRange: string): string {
    const now = new Date()
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  private calculateTrend(current: number, previous: number, reverse: boolean = false): 'improving' | 'stable' | 'declining' {
    const change = current - previous
    const threshold = Math.abs(previous * 0.1) // 10% threshold
    
    if (Math.abs(change) < threshold) return 'stable'
    
    if (reverse) {
      return change < 0 ? 'improving' : 'declining'
    } else {
      return change > 0 ? 'improving' : 'declining'
    }
  }

  private async getPreviousPeriodAlerts(contractId: string, timeRange: string): Promise<number> {
    const startDate = this.getTimeRangeStart(timeRange)
    const endDate = new Date(new Date(startDate).getTime() - this.getTimeRangeMs(timeRange)).toISOString()

    const { data } = await supabase
      .from('contract_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('contract_id', contractId)
      .gte('created_at', endDate)
      .lt('created_at', startDate)

    return data || 0
  }

  private async getPreviousPeriodGasUsage(contractId: string, timeRange: string): Promise<number> {
    // Simplified implementation
    return 50000 // Placeholder
  }

  private async getPreviousPeriodTransactionCount(contractId: string, timeRange: string): Promise<number> {
    // Simplified implementation
    return 100 // Placeholder
  }

  private async getPreviousPeriodAnalytics(contractId: string, timeRange: string): Promise<Partial<AnalyticsMetrics>> {
    // Simplified implementation
    return {} // Placeholder
  }

  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case '24h': return 24 * 60 * 60 * 1000
      case '7d': return 7 * 24 * 60 * 60 * 1000
      case '30d': return 30 * 24 * 60 * 60 * 1000
      case '90d': return 90 * 24 * 60 * 60 * 1000
      default: return 30 * 24 * 60 * 60 * 1000
    }
  }

  private async storeAnalytics(contractId: string, analytics: AnalyticsMetrics): Promise<void> {
    try {
      await supabase
        .from('analytics_history')
        .insert({
          contract_id: contractId,
          metrics: analytics,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error storing analytics:', error)
    }
  }
}

export default AnalyticsEngine
