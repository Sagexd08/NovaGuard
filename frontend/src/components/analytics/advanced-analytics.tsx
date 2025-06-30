'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart,
  ReferenceLine
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Zap, 
  Users, 
  Code, 
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Eye,
  EyeOff,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

// Analytics interfaces
interface AnalyticsData {
  security: SecurityAnalytics
  performance: PerformanceAnalytics
  usage: UsageAnalytics
  ai: AIAnalytics
  collaboration: CollaborationAnalytics
  trends: TrendAnalytics
}

interface SecurityAnalytics {
  vulnerabilityTrends: Array<{
    date: string
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }>
  severityDistribution: Array<{
    severity: string
    count: number
    percentage: number
    color: string
  }>
  topVulnerabilities: Array<{
    type: string
    count: number
    trend: number
    severity: string
  }>
  securityScoreHistory: Array<{
    date: string
    score: number
    target: number
  }>
  complianceMetrics: Array<{
    standard: string
    score: number
    requirements: number
    passed: number
  }>
}

interface PerformanceAnalytics {
  gasOptimizationTrends: Array<{
    date: string
    gasUsed: number
    gasSaved: number
    optimizations: number
  }>
  compilationMetrics: Array<{
    date: string
    averageTime: number
    successRate: number
    errors: number
  }>
  deploymentMetrics: Array<{
    blockchain: string
    deployments: number
    successRate: number
    averageTime: number
    gasUsed: number
  }>
  performanceScores: Array<{
    metric: string
    score: number
    target: number
    trend: number
  }>
}

interface UsageAnalytics {
  userActivity: Array<{
    date: string
    activeUsers: number
    newUsers: number
    sessions: number
    avgSessionTime: number
  }>
  featureUsage: Array<{
    feature: string
    usage: number
    users: number
    trend: number
  }>
  projectMetrics: Array<{
    date: string
    created: number
    completed: number
    active: number
  }>
  blockchainUsage: Array<{
    blockchain: string
    projects: number
    deployments: number
    users: number
    color: string
  }>
}

interface AIAnalytics {
  requestVolume: Array<{
    date: string
    requests: number
    successful: number
    failed: number
  }>
  agentPerformance: Array<{
    agent: string
    requests: number
    accuracy: number
    responseTime: number
    satisfaction: number
  }>
  costAnalysis: Array<{
    date: string
    cost: number
    tokens: number
    savings: number
  }>
  topQueries: Array<{
    query: string
    count: number
    category: string
    avgResponseTime: number
  }>
}

interface CollaborationAnalytics {
  sessionMetrics: Array<{
    date: string
    sessions: number
    participants: number
    avgDuration: number
  }>
  collaborationTypes: Array<{
    type: string
    count: number
    percentage: number
    color: string
  }>
  productivityMetrics: Array<{
    metric: string
    value: number
    unit: string
    trend: number
  }>
}

interface TrendAnalytics {
  predictions: Array<{
    metric: string
    current: number
    predicted: number
    confidence: number
    timeframe: string
  }>
  anomalies: Array<{
    date: string
    metric: string
    value: number
    expected: number
    severity: 'low' | 'medium' | 'high'
  }>
  correlations: Array<{
    metric1: string
    metric2: string
    correlation: number
    significance: number
  }>
}

interface AdvancedAnalyticsProps {
  className?: string
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
}

export function AdvancedAnalytics({ 
  className, 
  timeRange = '30d',
  onTimeRangeChange 
}: AdvancedAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line')
  const [showPredictions, setShowPredictions] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['security', 'performance'])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setData(generateMockAnalyticsData())
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
  }

  const generateMockAnalyticsData = (): AnalyticsData => ({
    security: {
      vulnerabilityTrends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        critical: Math.floor(Math.random() * 5),
        high: Math.floor(Math.random() * 10),
        medium: Math.floor(Math.random() * 15),
        low: Math.floor(Math.random() * 20),
        total: 0
      })).map(item => ({ ...item, total: item.critical + item.high + item.medium + item.low })),
      severityDistribution: [
        { severity: 'Critical', count: 23, percentage: 15, color: '#ef4444' },
        { severity: 'High', count: 45, percentage: 30, color: '#f97316' },
        { severity: 'Medium', count: 52, percentage: 35, color: '#eab308' },
        { severity: 'Low', count: 30, percentage: 20, color: '#22c55e' }
      ],
      topVulnerabilities: [
        { type: 'Reentrancy', count: 23, trend: -5, severity: 'critical' },
        { type: 'Integer Overflow', count: 18, trend: +2, severity: 'high' },
        { type: 'Access Control', count: 15, trend: -8, severity: 'medium' },
        { type: 'Unchecked Call', count: 12, trend: +3, severity: 'low' }
      ],
      securityScoreHistory: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        score: 75 + Math.random() * 20,
        target: 90
      })),
      complianceMetrics: [
        { standard: 'OWASP Top 10', score: 85, requirements: 10, passed: 8 },
        { standard: 'CWE Top 25', score: 78, requirements: 25, passed: 19 },
        { standard: 'NIST Framework', score: 92, requirements: 15, passed: 14 }
      ]
    },
    performance: {
      gasOptimizationTrends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        gasUsed: 200000 + Math.random() * 100000,
        gasSaved: Math.random() * 50000,
        optimizations: Math.floor(Math.random() * 20)
      })),
      compilationMetrics: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        averageTime: 10 + Math.random() * 20,
        successRate: 85 + Math.random() * 15,
        errors: Math.floor(Math.random() * 10)
      })),
      deploymentMetrics: [
        { blockchain: 'Ethereum', deployments: 156, successRate: 94, averageTime: 45, gasUsed: 2100000 },
        { blockchain: 'Polygon', deployments: 89, successRate: 97, averageTime: 12, gasUsed: 850000 },
        { blockchain: 'Arbitrum', deployments: 67, successRate: 96, averageTime: 8, gasUsed: 450000 },
        { blockchain: 'Optimism', deployments: 45, successRate: 98, averageTime: 6, gasUsed: 380000 }
      ],
      performanceScores: [
        { metric: 'Gas Efficiency', score: 87, target: 90, trend: +3 },
        { metric: 'Compilation Speed', score: 92, target: 85, trend: +5 },
        { metric: 'Deployment Success', score: 95, target: 95, trend: 0 },
        { metric: 'Code Quality', score: 88, target: 90, trend: +2 }
      ]
    },
    usage: {
      userActivity: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activeUsers: 50 + Math.floor(Math.random() * 100),
        newUsers: Math.floor(Math.random() * 20),
        sessions: 100 + Math.floor(Math.random() * 200),
        avgSessionTime: 30 + Math.random() * 60
      })),
      featureUsage: [
        { feature: 'Security Analysis', usage: 89, users: 234, trend: +5 },
        { feature: 'Gas Optimization', usage: 76, users: 189, trend: +8 },
        { feature: 'Code Review', usage: 65, users: 156, trend: +3 },
        { feature: 'Collaboration', usage: 54, users: 123, trend: +12 },
        { feature: 'AI Assistant', usage: 43, users: 98, trend: +15 }
      ],
      projectMetrics: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created: Math.floor(Math.random() * 10),
        completed: Math.floor(Math.random() * 8),
        active: 20 + Math.floor(Math.random() * 30)
      })),
      blockchainUsage: [
        { blockchain: 'Ethereum', projects: 145, deployments: 234, users: 89, color: '#627EEA' },
        { blockchain: 'Polygon', projects: 89, deployments: 156, users: 67, color: '#8247E5' },
        { blockchain: 'Solana', projects: 67, deployments: 123, users: 45, color: '#9945FF' },
        { blockchain: 'Arbitrum', projects: 45, deployments: 89, users: 34, color: '#28A0F0' }
      ]
    },
    ai: {
      requestVolume: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requests: 100 + Math.floor(Math.random() * 200),
        successful: 0,
        failed: 0
      })).map(item => ({
        ...item,
        successful: Math.floor(item.requests * (0.9 + Math.random() * 0.1)),
        failed: item.requests - item.successful
      })),
      agentPerformance: [
        { agent: 'Security Auditor', requests: 1234, accuracy: 94.5, responseTime: 2.3, satisfaction: 4.6 },
        { agent: 'Gas Optimizer', requests: 987, accuracy: 91.2, responseTime: 1.8, satisfaction: 4.4 },
        { agent: 'Code Reviewer', requests: 765, accuracy: 96.1, responseTime: 3.1, satisfaction: 4.7 },
        { agent: 'Documentation Generator', requests: 543, accuracy: 88.9, responseTime: 1.5, satisfaction: 4.2 }
      ],
      costAnalysis: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: 50 + Math.random() * 100,
        tokens: 10000 + Math.random() * 20000,
        savings: Math.random() * 50
      })),
      topQueries: [
        { query: 'Analyze smart contract security', count: 234, category: 'Security', avgResponseTime: 2.3 },
        { query: 'Optimize gas usage', count: 189, category: 'Performance', avgResponseTime: 1.8 },
        { query: 'Review code quality', count: 156, category: 'Quality', avgResponseTime: 3.1 },
        { query: 'Generate documentation', count: 123, category: 'Documentation', avgResponseTime: 1.5 }
      ]
    },
    collaboration: {
      sessionMetrics: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sessions: Math.floor(Math.random() * 20),
        participants: Math.floor(Math.random() * 50),
        avgDuration: 30 + Math.random() * 60
      })),
      collaborationTypes: [
        { type: 'Code Review', count: 45, percentage: 35, color: '#3b82f6' },
        { type: 'Pair Programming', count: 32, percentage: 25, color: '#10b981' },
        { type: 'Security Audit', count: 28, percentage: 22, color: '#f59e0b' },
        { type: 'Documentation', count: 23, percentage: 18, color: '#8b5cf6' }
      ],
      productivityMetrics: [
        { metric: 'Lines of Code', value: 12500, unit: 'LOC', trend: +8 },
        { metric: 'Commits', value: 234, unit: 'commits', trend: +12 },
        { metric: 'Pull Requests', value: 89, unit: 'PRs', trend: +5 },
        { metric: 'Issues Resolved', value: 156, unit: 'issues', trend: +15 }
      ]
    },
    trends: {
      predictions: [
        { metric: 'Security Score', current: 87, predicted: 92, confidence: 85, timeframe: '30 days' },
        { metric: 'Gas Efficiency', current: 78, predicted: 83, confidence: 78, timeframe: '30 days' },
        { metric: 'User Growth', current: 234, predicted: 289, confidence: 92, timeframe: '30 days' }
      ],
      anomalies: [
        { date: '2024-01-15', metric: 'Security Score', value: 65, expected: 85, severity: 'high' },
        { date: '2024-01-18', metric: 'Gas Usage', value: 350000, expected: 250000, severity: 'medium' },
        { date: '2024-01-22', metric: 'Response Time', value: 5.2, expected: 2.3, severity: 'low' }
      ],
      correlations: [
        { metric1: 'Security Score', metric2: 'Code Quality', correlation: 0.87, significance: 0.95 },
        { metric1: 'Gas Efficiency', metric2: 'Optimization Count', correlation: 0.76, significance: 0.89 },
        { metric1: 'User Activity', metric2: 'Feature Usage', correlation: 0.92, significance: 0.98 }
      ]
    }
  })

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
          <Button onClick={loadAnalyticsData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your smart contract development and security metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Chart Type Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {chartType === 'line' && <LineChartIcon className="w-4 h-4 mr-2" />}
                {chartType === 'area' && <BarChart3 className="w-4 h-4 mr-2" />}
                {chartType === 'bar' && <BarChart3 className="w-4 h-4 mr-2" />}
                Chart Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setChartType('line')}>
                <LineChartIcon className="w-4 h-4 mr-2" />
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType('area')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Area Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType('bar')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Bar Chart
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          {/* Predictions Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={showPredictions}
              onCheckedChange={setShowPredictions}
            />
            <span className="text-sm">Predictions</span>
          </div>

          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </Button>

          {/* Export Button */}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <AnalyticsMetricCard
          title="Security Score"
          value={87.5}
          unit="%"
          change={+2.3}
          icon={Shield}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-950"
        />
        <AnalyticsMetricCard
          title="Performance"
          value={92.1}
          unit="%"
          change={+1.8}
          icon={Zap}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950"
        />
        <AnalyticsMetricCard
          title="Active Users"
          value={234}
          change={+12.5}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-950"
        />
        <AnalyticsMetricCard
          title="AI Accuracy"
          value={94.2}
          unit="%"
          change={+0.8}
          icon={Target}
          color="text-orange-600"
          bgColor="bg-orange-50 dark:bg-orange-950"
        />
        <AnalyticsMetricCard
          title="Collaboration"
          value={156}
          unit="sessions"
          change={+8.3}
          icon={Activity}
          color="text-pink-600"
          bgColor="bg-pink-50 dark:bg-pink-950"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="ai">AI Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewAnalytics data={data} chartType={chartType} showPredictions={showPredictions} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityAnalytics data={data.security} chartType={chartType} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceAnalytics data={data.performance} chartType={chartType} />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageAnalytics data={data.usage} chartType={chartType} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <AIAnalyticsTab data={data.ai} chartType={chartType} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendsAnalytics data={data.trends} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
