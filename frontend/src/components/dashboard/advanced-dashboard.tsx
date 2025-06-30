'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  Shield,
  Zap,
  Code,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Calendar,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Layers,
  GitBranch,
  FileText,
  Settings
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTable } from '@/components/ui/advanced/data-table'
import { cn } from '@/lib/utils'

// Types
interface DashboardMetrics {
  security: SecurityMetrics
  performance: PerformanceMetrics
  collaboration: CollaborationMetrics
  projects: ProjectMetrics
  ai: AIMetrics
  blockchain: BlockchainMetrics
}

interface SecurityMetrics {
  totalScans: number
  vulnerabilitiesFound: number
  criticalIssues: number
  resolvedIssues: number
  averageScore: number
  trendData: Array<{ date: string; score: number; vulnerabilities: number }>
  severityDistribution: Array<{ severity: string; count: number; color: string }>
}

interface PerformanceMetrics {
  gasOptimizations: number
  gasSaved: number
  deploymentTime: number
  compilationTime: number
  trendData: Array<{ date: string; gasUsage: number; optimizations: number }>
}

interface CollaborationMetrics {
  activeUsers: number
  activeSessions: number
  totalCollaborations: number
  averageSessionTime: number
  recentActivity: Array<{
    id: string
    user: string
    action: string
    project: string
    timestamp: Date
    avatar?: string
  }>
}

interface ProjectMetrics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalContracts: number
  blockchainDistribution: Array<{ blockchain: string; count: number; color: string }>
  recentProjects: Array<{
    id: string
    name: string
    blockchain: string
    status: string
    lastActivity: Date
    securityScore: number
  }>
}

interface AIMetrics {
  totalRequests: number
  successRate: number
  averageResponseTime: number
  tokensUsed: number
  costSaved: number
  agentPerformance: Array<{
    agent: string
    requests: number
    accuracy: number
    responseTime: number
  }>
}

interface BlockchainMetrics {
  supportedChains: number
  totalDeployments: number
  gasUsed: number
  transactionVolume: number
  networkDistribution: Array<{ network: string; deployments: number; color: string }>
}

interface AdvancedDashboardProps {
  className?: string
  timeRange?: '24h' | '7d' | '30d' | '90d'
  onTimeRangeChange?: (range: string) => void
}

export function AdvancedDashboard({
  className,
  timeRange = '7d',
  onTimeRangeChange
}: AdvancedDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMetrics(generateMockData())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const generateMockData = (): DashboardMetrics => ({
    security: {
      totalScans: 1247,
      vulnerabilitiesFound: 89,
      criticalIssues: 12,
      resolvedIssues: 156,
      averageScore: 87.5,
      trendData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        score: 80 + Math.random() * 20,
        vulnerabilities: Math.floor(Math.random() * 10)
      })),
      severityDistribution: [
        { severity: 'Critical', count: 12, color: '#ef4444' },
        { severity: 'High', count: 23, color: '#f97316' },
        { severity: 'Medium', count: 34, color: '#eab308' },
        { severity: 'Low', count: 20, color: '#22c55e' }
      ]
    },
    performance: {
      gasOptimizations: 342,
      gasSaved: 1250000,
      deploymentTime: 45.2,
      compilationTime: 12.8,
      trendData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        gasUsage: 200000 + Math.random() * 100000,
        optimizations: Math.floor(Math.random() * 20)
      }))
    },
    collaboration: {
      activeUsers: 24,
      activeSessions: 8,
      totalCollaborations: 156,
      averageSessionTime: 42.5,
      recentActivity: [
        {
          id: '1',
          user: 'Alice Johnson',
          action: 'deployed contract',
          project: 'DeFi Protocol',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          avatar: '/avatars/alice.jpg'
        },
        {
          id: '2',
          user: 'Bob Smith',
          action: 'fixed vulnerability',
          project: 'NFT Marketplace',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          avatar: '/avatars/bob.jpg'
        },
        {
          id: '3',
          user: 'Carol Davis',
          action: 'optimized gas usage',
          project: 'Token Bridge',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          avatar: '/avatars/carol.jpg'
        }
      ]
    },
    projects: {
      totalProjects: 89,
      activeProjects: 23,
      completedProjects: 66,
      totalContracts: 234,
      blockchainDistribution: [
        { blockchain: 'Ethereum', count: 45, color: '#627EEA' },
        { blockchain: 'Polygon', count: 23, color: '#8247E5' },
        { blockchain: 'Arbitrum', count: 12, color: '#28A0F0' },
        { blockchain: 'Optimism', count: 9, color: '#FF0420' }
      ],
      recentProjects: [
        {
          id: '1',
          name: 'DeFi Lending Protocol',
          blockchain: 'Ethereum',
          status: 'active',
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          securityScore: 92
        },
        {
          id: '2',
          name: 'NFT Marketplace',
          blockchain: 'Polygon',
          status: 'completed',
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
          securityScore: 88
        }
      ]
    },
    ai: {
      totalRequests: 5678,
      successRate: 94.2,
      averageResponseTime: 2.3,
      tokensUsed: 2340000,
      costSaved: 1250,
      agentPerformance: [
        { agent: 'Security Auditor', requests: 1234, accuracy: 96.5, responseTime: 2.1 },
        { agent: 'Gas Optimizer', requests: 987, accuracy: 92.3, responseTime: 1.8 },
        { agent: 'Code Reviewer', requests: 765, accuracy: 94.7, responseTime: 2.5 }
      ]
    },
    blockchain: {
      supportedChains: 12,
      totalDeployments: 456,
      gasUsed: 12500000,
      transactionVolume: 2340000,
      networkDistribution: [
        { network: 'Ethereum', deployments: 156, color: '#627EEA' },
        { network: 'Polygon', deployments: 123, color: '#8247E5' },
        { network: 'Arbitrum', deployments: 89, color: '#28A0F0' },
        { network: 'Optimism', deployments: 67, color: '#FF0420' },
        { network: 'Base', deployments: 21, color: '#0052FF' }
      ]
    }
  })

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to load dashboard</h3>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your smart contract development and security metrics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time Range Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                {timeRange}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Time Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTimeRangeChange?.('24h')}>
                Last 24 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTimeRangeChange?.('7d')}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTimeRangeChange?.('30d')}>
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTimeRangeChange?.('90d')}>
                Last 90 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Security Score"
          value={metrics.security.averageScore}
          unit="%"
          change={+2.5}
          icon={Shield}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-950"
        />
        <MetricCard
          title="Gas Saved"
          value={metrics.performance.gasSaved}
          unit="wei"
          change={+15.2}
          icon={Zap}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950"
          format="compact"
        />
        <MetricCard
          title="Active Projects"
          value={metrics.projects.activeProjects}
          change={+3}
          icon={Code}
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-950"
        />
        <MetricCard
          title="AI Requests"
          value={metrics.ai.totalRequests}
          change={+12.8}
          icon={Activity}
          color="text-orange-600"
          bgColor="bg-orange-50 dark:bg-orange-950"
          format="compact"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="ai">AI Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityTab metrics={metrics.security} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab metrics={metrics.performance} />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <CollaborationTab metrics={metrics.collaboration} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <AITab metrics={metrics.ai} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: number
  unit?: string
  change?: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  format?: 'default' | 'compact' | 'currency'
}

function MetricCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  color,
  bgColor,
  format = 'default'
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'compact':
        return val >= 1000000
          ? `${(val / 1000000).toFixed(1)}M`
          : val >= 1000
          ? `${(val / 1000).toFixed(1)}K`
          : val.toString()
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(val)
      default:
        return val.toLocaleString()
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-1">
              <p className="text-2xl font-bold">
                {formatValue(value)}
              </p>
              {unit && (
                <span className="text-sm text-muted-foreground">{unit}</span>
              )}
            </div>
            {change !== undefined && (
              <div className="flex items-center space-x-1">
                {change > 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  change > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {Math.abs(change)}%
                </span>
                <span className="text-sm text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', bgColor)}>
            <Icon className={cn('w-6 h-6', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Overview Tab Component
function OverviewTab({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Security Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Security Score Trend</CardTitle>
          <CardDescription>
            Security score and vulnerabilities over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.security.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#22c55e"
                strokeWidth={2}
                name="Security Score"
              />
              <Line
                type="monotone"
                dataKey="vulnerabilities"
                stroke="#ef4444"
                strokeWidth={2}
                name="Vulnerabilities"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Blockchain Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Distribution</CardTitle>
          <CardDescription>
            Projects by blockchain platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.projects.blockchainDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ blockchain, count }) => `${blockchain}: ${count}`}
              >
                {metrics.projects.blockchainDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.collaboration.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activity.avatar} />
                  <AvatarFallback>
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>
                    {' '}
                    <span className="text-muted-foreground">{activity.action}</span>
                    {' '}
                    <span className="font-medium">{activity.project}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Security Tab Component
function SecurityTab({ metrics }: { metrics: SecurityMetrics }) {
  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold">{metrics.totalScans.toLocaleString()}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vulnerabilities</p>
                <p className="text-2xl font-bold">{metrics.vulnerabilitiesFound}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</p>
              </div>
              <Target className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{metrics.resolvedIssues}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vulnerability Severity</CardTitle>
            <CardDescription>
              Distribution of vulnerabilities by severity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.severityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {metrics.severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Security Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Security Score History</CardTitle>
            <CardDescription>
              Security score improvement over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Performance Tab Component
function PerformanceTab({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimizations</p>
                <p className="text-2xl font-bold">{metrics.gasOptimizations}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gas Saved</p>
                <p className="text-2xl font-bold">
                  {(metrics.gasSaved / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deploy Time</p>
                <p className="text-2xl font-bold">{metrics.deploymentTime}s</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compile Time</p>
                <p className="text-2xl font-bold">{metrics.compilationTime}s</p>
              </div>
              <Cpu className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gas Usage Optimization</CardTitle>
          <CardDescription>
            Gas usage and optimization trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={metrics.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="gasUsage"
                stroke="#ef4444"
                strokeWidth={2}
                name="Gas Usage"
              />
              <Line
                type="monotone"
                dataKey="optimizations"
                stroke="#22c55e"
                strokeWidth={2}
                name="Optimizations"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Collaboration Tab Component
function CollaborationTab({ metrics }: { metrics: CollaborationMetrics }) {
  return (
    <div className="space-y-6">
      {/* Collaboration Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{metrics.activeSessions}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Collaborations</p>
                <p className="text-2xl font-bold">{metrics.totalCollaborations}</p>
              </div>
              <GitBranch className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold">{metrics.averageSessionTime}m</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Collaboration Activity</CardTitle>
          <CardDescription>
            Latest collaborative actions across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {metrics.recentActivity.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-4 p-4 rounded-lg border"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={activity.avatar} />
                  <AvatarFallback>
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{activity.user}</span>
                    <Badge variant="secondary">{activity.action}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.project} • {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// AI Tab Component
function AITab({ metrics }: { metrics: AIMetrics }) {
  return (
    <div className="space-y-6">
      {/* AI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">
                  {(metrics.totalRequests / 1000).toFixed(1)}K
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{metrics.successRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{metrics.averageResponseTime}s</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tokens Used</p>
                <p className="text-2xl font-bold">
                  {(metrics.tokensUsed / 1000000).toFixed(1)}M
                </p>
              </div>
              <Database className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Saved</p>
                <p className="text-2xl font-bold">${metrics.costSaved}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Performance</CardTitle>
          <CardDescription>
            Performance metrics for each AI agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.agentPerformance.map((agent, index) => (
              <div key={index} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{agent.agent}</h4>
                  <Badge variant="outline">{agent.requests} requests</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={agent.accuracy} className="flex-1" />
                      <span className="text-sm font-medium">{agent.accuracy}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className="text-lg font-semibold">{agent.responseTime}s</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Utility function
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}