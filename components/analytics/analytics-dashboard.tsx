'use client'

// =============================================
// NOVAGUARD ANALYTICS DASHBOARD
// Advanced analytics and insights visualization
// =============================================

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import {
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Target,
  Lightbulb,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react'
import AnalyticsEngine, { type AnalyticsMetrics, type TrendData, type InsightData } from '@/lib/analytics/analytics-engine'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface AnalyticsDashboardProps {
  contractId?: string
  className?: string
}

export function AnalyticsDashboard({ contractId, className }: AnalyticsDashboardProps) {
  const { user } = useUser()
  const [analyticsEngine] = useState(() => new AnalyticsEngine())

  // State
  const [analytics, setAnalytics] = useState<AnalyticsMetrics | null>(null)
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<any>(null)
  const [trendData, setTrendData] = useState<Record<string, TrendData[]>>({})
  const [insights, setInsights] = useState<InsightData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d')
  const [selectedMetric, setSelectedMetric] = useState('securityScore')
  const [viewMode, setViewMode] = useState<'contract' | 'portfolio'>('contract')

  // Load analytics data
  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user, contractId, timeRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      if (viewMode === 'contract' && contractId) {
        // Load contract-specific analytics
        const [analyticsData, trendsData, insightsData] = await Promise.all([
          analyticsEngine.calculateContractAnalytics(contractId, timeRange),
          loadTrendData(contractId),
          analyticsEngine.generateInsights(contractId)
        ])

        setAnalytics(analyticsData)
        setTrendData(trendsData)
        setInsights(insightsData)
      } else if (viewMode === 'portfolio') {
        // Load portfolio analytics
        const portfolioData = await analyticsEngine.getPortfolioAnalytics(user!.id)
        setPortfolioAnalytics(portfolioData)
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTrendData = async (contractId: string) => {
    const metrics = ['securityScore', 'gasEfficiencyScore', 'mevProtectionScore', 'transactionCount']
    const trends: Record<string, TrendData[]> = {}

    for (const metric of metrics) {
      trends[metric] = await analyticsEngine.getTrendData(contractId, metric, timeRange)
    }

    return trends
  }

  // Get metric color based on value and type
  const getMetricColor = (value: number, type: 'score' | 'count' | 'percentage') => {
    if (type === 'score' || type === 'percentage') {
      if (value >= 80) return 'text-green-600'
      if (value >= 60) return 'text-yellow-600'
      return 'text-red-600'
    }
    return 'text-blue-600'
  }

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  // Get insight severity color
  const getInsightSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'warning': return 'border-yellow-500 bg-yellow-50'
      default: return 'border-blue-500 bg-blue-50'
    }
  }

  // Chart colors
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#6366f1'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights and metrics for your smart contracts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'contract' | 'portfolio') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="portfolio">Portfolio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value: '24h' | '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
              <SelectItem value="90d">90d</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {viewMode === 'contract' && analytics ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.securityScore}/100</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getTrendIcon(analytics.securityTrend)}
                    <span>{analytics.securityTrend}</span>
                  </div>
                  <Progress value={analytics.securityScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gas Efficiency</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.gasEfficiencyScore}/100</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getTrendIcon(analytics.gasTrend)}
                    <span>{analytics.gasTrend}</span>
                  </div>
                  <Progress value={analytics.gasEfficiencyScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">MEV Protection</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.mevProtectionScore}/100</div>
                  <div className="text-xs text-muted-foreground">
                    {analytics.mevAttacks} attacks detected
                  </div>
                  <Progress value={analytics.mevProtectionScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.transactionCount.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getTrendIcon(analytics.activityTrend)}
                    <span>{analytics.activityTrend}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics.uniqueUsers} unique users
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Security Trend</CardTitle>
                  <CardDescription>Security score over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData.securityScore || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={chartColors.primary}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Overview</CardTitle>
                  <CardDescription>Transaction volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData.transactionCount || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartColors.secondary}
                        fill={chartColors.secondary}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Security Metrics</CardTitle>
                  <CardDescription>Detailed security analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Overall Score</span>
                        <span className={cn("text-sm font-medium", getMetricColor(analytics.securityScore, 'score'))}>
                          {analytics.securityScore}/100
                        </span>
                      </div>
                      <Progress value={analytics.securityScore} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Code Quality</span>
                        <span className={cn("text-sm font-medium", getMetricColor(analytics.codeQuality, 'score'))}>
                          {analytics.codeQuality}/100
                        </span>
                      </div>
                      <Progress value={analytics.codeQuality} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analytics.criticalIssues}</div>
                      <div className="text-xs text-muted-foreground">Critical Issues</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{analytics.vulnerabilityCount}</div>
                      <div className="text-xs text-muted-foreground">Total Vulnerabilities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics.testCoverage}%</div>
                      <div className="text-xs text-muted-foreground">Test Coverage</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Low Risk', value: 70, fill: chartColors.secondary },
                          { name: 'Medium Risk', value: 20, fill: chartColors.warning },
                          { name: 'High Risk', value: 10, fill: chartColors.danger }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Gas Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Efficiency Score</span>
                      <span className="text-sm font-medium">{analytics.gasEfficiencyScore}/100</span>
                    </div>
                    <Progress value={analytics.gasEfficiencyScore} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Gas Usage</span>
                      <span className="text-sm font-medium">{analytics.averageGasUsage.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Optimization Potential</span>
                      <span className="text-sm font-medium text-green-600">{analytics.gasOptimizationPotential}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>MEV Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Protection Score</span>
                      <span className="text-sm font-medium">{analytics.mevProtectionScore}/100</span>
                    </div>
                    <Progress value={analytics.mevProtectionScore} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Attacks Detected</span>
                      <span className="text-sm font-medium text-red-600">{analytics.mevAttacks}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total MEV Loss</span>
                      <span className="text-sm font-medium">{analytics.mevLoss}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Uptime</span>
                      <span className="text-sm font-medium text-green-600">{analytics.uptime}%</span>
                    </div>
                    <Progress value={analytics.uptime} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-medium">{analytics.responseTime}ms</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Error Rate</span>
                      <span className="text-sm font-medium">{analytics.errorRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>
                  Actionable recommendations based on your contract analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className={cn(
                          'p-4 rounded-lg border-l-4',
                          getInsightSeverityColor(insight.severity)
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{insight.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {insight.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Priority {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {insight.description}
                            </p>
                            <div className="bg-white/50 p-3 rounded border">
                              <p className="text-sm font-medium mb-1">Recommendation:</p>
                              <p className="text-sm">{insight.recommendation}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Impact: {insight.impact}</span>
                              <span>Effort: {insight.effort}</span>
                              <span>{insight.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {insights.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">All Good!</h3>
                        <p className="text-muted-foreground">
                          No critical insights or recommendations at this time.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : viewMode === 'portfolio' && portfolioAnalytics ? (
        <div className="space-y-6">
          {/* Portfolio Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioAnalytics.totalContracts}</div>
                <p className="text-xs text-muted-foreground">
                  Active smart contracts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Security Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioAnalytics.averageSecurityScore}/100</div>
                <Progress value={portfolioAnalytics.averageSecurityScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioAnalytics.portfolioValue}</div>
                <p className="text-xs text-muted-foreground">
                  Total value locked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MEV Loss</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{portfolioAnalytics.totalMEVLoss}</div>
                <p className="text-xs text-muted-foreground">
                  Total MEV extracted
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Recommendations</CardTitle>
              <CardDescription>
                Key recommendations for your contract portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolioAnalytics.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Contracts</CardTitle>
              <CardDescription>
                Contracts with the highest security scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolioAnalytics.topPerformers.map((performer: any, index: number) => (
                  <div key={performer.contractId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{performer.contractId.slice(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">Smart Contract</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{performer.score}/100</p>
                      <p className="text-sm text-muted-foreground">Security Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              {viewMode === 'contract'
                ? 'Select a contract to view analytics'
                : 'No contracts found in your portfolio'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AnalyticsDashboard