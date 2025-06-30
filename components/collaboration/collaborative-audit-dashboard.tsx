'use client'

// =============================================
// NOVAGUARD COLLABORATIVE AUDIT DASHBOARD
// Real-time collaborative audit results and insights
// =============================================

import React, { useState, useEffect, useMemo } from 'react'
import { useStorage, useOthers, useBroadcastEvent, useEventListener } from '@/lib/liveblocks/liveblocks.config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  AlertTriangle, 
  Shield, 
  Zap, 
  DollarSign, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Download,
  Filter,
  Search,
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollaborationUtils } from '@/lib/liveblocks/liveblocks.config'

interface CollaborativeAuditDashboardProps {
  contractId: string
  className?: string
  showRealTimeUpdates?: boolean
  enableCollaborativeReview?: boolean
}

export function CollaborativeAuditDashboard({
  contractId,
  className,
  showRealTimeUpdates = true,
  enableCollaborativeReview = true
}: CollaborativeAuditDashboardProps) {
  
  // Liveblocks hooks
  const auditResults = useStorage((root) => root.auditResults)
  const annotations = useStorage((root) => root.annotations)
  const others = useOthers()
  const broadcastEvent = useBroadcastEvent()
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview')
  const [filterSeverity, setFilterSeverity] = useState<string[]>(['critical', 'high', 'medium', 'low'])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([])
  
  // Listen to real-time events
  useEventListener(({ event }) => {
    if (showRealTimeUpdates) {
      setRealtimeEvents(prev => [event, ...prev.slice(0, 49)]) // Keep last 50 events
    }
  })
  
  // Computed values
  const vulnerabilityStats = useMemo(() => {
    if (!auditResults?.vulnerabilities) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
    
    const stats = auditResults.vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity as keyof typeof acc]++
      acc.total++
      return acc
    }, { critical: 0, high: 0, medium: 0, low: 0, total: 0 })
    
    return stats
  }, [auditResults?.vulnerabilities])
  
  const filteredVulnerabilities = useMemo(() => {
    if (!auditResults?.vulnerabilities) return []
    
    return auditResults.vulnerabilities.filter(vuln => {
      const matchesSeverity = filterSeverity.includes(vuln.severity)
      const matchesSearch = searchQuery === '' || 
        vuln.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vuln.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesSeverity && matchesSearch
    })
  }, [auditResults?.vulnerabilities, filterSeverity, searchQuery])
  
  const gasOptimizationStats = useMemo(() => {
    if (!auditResults?.gasOptimizations) return { total: 0, totalSavings: 0, implemented: 0 }
    
    return auditResults.gasOptimizations.reduce((acc, opt) => {
      acc.total++
      acc.totalSavings += opt.gasSavings || 0
      if (opt.status === 'implemented') acc.implemented++
      return acc
    }, { total: 0, totalSavings: 0, implemented: 0 })
  }, [auditResults?.gasOptimizations])
  
  const collaborationMetrics = useMemo(() => {
    return CollaborationUtils.getCollaborationMetrics(others)
  }, [others])
  
  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
  
  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <AlertCircle className="h-4 w-4" />
      case 'low': return <Info className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }
  
  // Handle vulnerability status change
  const handleVulnerabilityStatusChange = (vulnId: string, newStatus: string) => {
    // Broadcast status change event
    broadcastEvent({
      type: 'VULNERABILITY_FOUND',
      data: {
        vulnerability: { id: vulnId, name: 'Status Updated', severity: 'info', line: 0 },
        foundBy: 'Current User',
        timestamp: Date.now()
      }
    })
  }
  
  // Start new audit analysis
  const startAuditAnalysis = () => {
    setIsAnalyzing(true)
    
    // Broadcast audit started event
    broadcastEvent({
      type: 'AUDIT_COMPLETED',
      data: {
        auditId: `audit_${Date.now()}`,
        score: 0,
        vulnerabilityCount: 0,
        completedBy: 'Current User',
        timestamp: Date.now()
      }
    })
    
    // Simulate analysis completion
    setTimeout(() => {
      setIsAnalyzing(false)
    }, 3000)
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Real-time Collaboration Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time collaborative security analysis
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Active Collaborators */}
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {collaborationMetrics.activeUsers + 1} active
              </span>
              
              <div className="flex -space-x-2">
                {others.slice(0, 3).map((other) => {
                  const presence = CollaborationUtils.formatPresence(other)
                  return (
                    <Tooltip key={other.connectionId}>
                      <TooltipTrigger>
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={presence.user.avatar} />
                          <AvatarFallback 
                            className="text-xs"
                            style={{ backgroundColor: presence.user.color }}
                          >
                            {presence.initials}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{presence.displayName}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          </TooltipProvider>
          
          {/* Action Buttons */}
          <Button
            onClick={startAuditAnalysis}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Audit
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditResults?.overallScore || 0}/100
            </div>
            <Progress 
              value={auditResults?.overallScore || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {vulnerabilityStats.total}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="destructive" className="text-xs">
                {vulnerabilityStats.critical} Critical
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {vulnerabilityStats.high} High
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Savings</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {gasOptimizationStats.totalSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {gasOptimizationStats.total} optimizations found
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Analysis</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditResults?.lastAnalysis 
                ? new Date(auditResults.lastAnalysis).toLocaleDateString()
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {collaborationMetrics.activeUsers} collaborators active
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vulnerabilities">
            Vulnerabilities ({vulnerabilityStats.total})
          </TabsTrigger>
          <TabsTrigger value="optimizations">
            Gas ({gasOptimizationStats.total})
          </TabsTrigger>
          <TabsTrigger value="collaboration">
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Vulnerability Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Breakdown</CardTitle>
                <CardDescription>
                  Security issues found by severity level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(vulnerabilityStats).map(([severity, count]) => {
                  if (severity === 'total') return null
                  return (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(severity)}
                        <span className="capitalize">{severity}</span>
                      </div>
                      <Badge className={getSeverityColor(severity)}>
                        {count}
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Real-time collaboration events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {realtimeEvents.slice(0, 10).map((event, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-muted-foreground">
                          {new Date(event.data?.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                        <span>{event.type.replace('_', ' ').toLowerCase()}</span>
                      </div>
                    ))}
                    
                    {realtimeEvents.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="vulnerabilities" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter by severity:</span>
              {['critical', 'high', 'medium', 'low'].map((severity) => (
                <Button
                  key={severity}
                  variant={filterSeverity.includes(severity) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterSeverity(prev => 
                      prev.includes(severity) 
                        ? prev.filter(s => s !== severity)
                        : [...prev, severity]
                    )
                  }}
                  className={cn('capitalize', getSeverityColor(severity))}
                >
                  {severity}
                </Button>
              ))}
            </div>
            
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search vulnerabilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Vulnerabilities List */}
          <div className="space-y-4">
            {filteredVulnerabilities.map((vulnerability) => (
              <Card key={vulnerability.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(vulnerability.severity)}>
                          {getSeverityIcon(vulnerability.severity)}
                          {vulnerability.severity}
                        </Badge>
                        <CardTitle className="text-lg">{vulnerability.name}</CardTitle>
                      </div>
                      <CardDescription>
                        Lines {vulnerability.affectedLines} • Found by {vulnerability.foundBy}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVulnerabilityStatusChange(vulnerability.id, 'acknowledged')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                      
                      {enableCollaborativeReview && (
                        <>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Comment
                          </Button>
                          <Button variant="outline" size="sm">
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {vulnerability.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Status: {vulnerability.status}</span>
                    <span>•</span>
                    <span>Created: {new Date(vulnerability.createdAt).toLocaleDateString()}</span>
                    {others.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{others.length} viewing</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredVulnerabilities.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No vulnerabilities found</h3>
                  <p className="text-muted-foreground">
                    {vulnerabilityStats.total === 0 
                      ? "Great! No security issues detected in this contract."
                      : "No vulnerabilities match your current filters."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="optimizations" className="space-y-4">
          {/* Gas Optimizations Content */}
          <div className="space-y-4">
            {auditResults?.gasOptimizations?.map((optimization) => (
              <Card key={optimization.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{optimization.title}</CardTitle>
                      <CardDescription>
                        Lines {optimization.affectedLines} • {optimization.gasSavings} gas saved
                      </CardDescription>
                    </div>
                    
                    <Badge 
                      variant={optimization.status === 'implemented' ? 'default' : 'secondary'}
                    >
                      {optimization.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {optimization.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Difficulty: {optimization.difficulty}</span>
                    <span>•</span>
                    <span>Savings: {optimization.gasSavings} gas</span>
                    <span>•</span>
                    <span>Created: {new Date(optimization.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <Card>
                <CardContent className="text-center py-8">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No optimizations found</h3>
                  <p className="text-muted-foreground">
                    Run an audit to discover gas optimization opportunities.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="collaboration" className="space-y-4">
          {/* Collaboration metrics and tools */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Collaborators</CardTitle>
                <CardDescription>
                  Users currently working on this contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {others.map((other) => {
                    const presence = CollaborationUtils.formatPresence(other)
                    return (
                      <div key={other.connectionId} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={presence.user.avatar} />
                          <AvatarFallback style={{ backgroundColor: presence.user.color }}>
                            {presence.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{presence.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {presence.isTyping ? 'Typing...' : 'Active'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {presence.currentFunction || 'Viewing'}
                        </Badge>
                      </div>
                    )
                  })}
                  
                  {others.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No other collaborators online
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Collaboration Stats</CardTitle>
                <CardDescription>
                  Real-time collaboration metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Active Users</span>
                  <span className="font-medium">{collaborationMetrics.activeUsers + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Currently Typing</span>
                  <span className="font-medium">{collaborationMetrics.typingUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">With Selections</span>
                  <span className="font-medium">{collaborationMetrics.usersWithSelection}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Annotations</span>
                  <span className="font-medium">
                    {annotations ? Object.values(annotations).flat().length : 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {/* Version history and audit timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
              <CardDescription>
                Timeline of security analyses and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realtimeEvents.slice(0, 20).map((event, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {event.type.replace('_', ' ').toLowerCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.data?.timestamp || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {realtimeEvents.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No audit history available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CollaborativeAuditDashboard
