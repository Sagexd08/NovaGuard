'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  TrendingUp,
  Clock,
  FileText,
  Download,
  Share2,
  Eye,
  Code,
  Gauge
} from 'lucide-react'
import { cn, getSeverityColor } from '@/lib/utils'

interface Vulnerability {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  line?: number
  column?: number
  function?: string
  recommendation: string
  cweId?: string
  confidence: number
}

interface GasOptimization {
  id: string
  type: string
  title: string
  description: string
  line?: number
  function?: string
  estimatedSavings: number
  difficulty: 'easy' | 'medium' | 'hard'
  codeExample?: string
}

interface AnalysisResult {
  id: string
  contractName: string
  securityScore: number
  gasScore: number
  overallScore: number
  vulnerabilities: Vulnerability[]
  gasOptimizations: GasOptimization[]
  recommendations: Array<{
    id: string
    category: string
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    implementation?: string
  }>
  summary: string
  metadata: {
    analysisTime: number
    linesOfCode: number
    complexity: number
    timestamp: string
  }
}

interface AnalysisDashboardProps {
  result: AnalysisResult
  onExportReport?: () => void
  onShareResults?: () => void
  onViewDetails?: (vulnerabilityId: string) => void
  className?: string
}

export function AnalysisDashboard({
  result,
  onExportReport,
  onShareResults,
  onViewDetails,
  className,
}: AnalysisDashboardProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4" />
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />
      case 'low':
        return <Info className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-nova-green-600 bg-nova-green-100 dark:text-nova-green-300 dark:bg-nova-green-900/20'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/20'
      case 'hard':
        return 'text-nova-red-600 bg-nova-red-100 dark:text-nova-red-300 dark:bg-nova-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-nova-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-nova-orange-600'
    return 'text-nova-red-600'
  }

  const criticalVulns = result.vulnerabilities.filter(v => v.severity === 'critical')
  const highVulns = result.vulnerabilities.filter(v => v.severity === 'high')
  const mediumVulns = result.vulnerabilities.filter(v => v.severity === 'medium')
  const lowVulns = result.vulnerabilities.filter(v => v.severity === 'low')

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
          <p className="text-muted-foreground">
            {result.contractName} • Analyzed {new Date(result.metadata.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onShareResults && (
            <Button variant="outline" onClick={onShareResults}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          {onExportReport && (
            <Button variant="default" onClick={onExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getScoreColor(result.securityScore)}>
                {result.securityScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <Progress value={result.securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {result.vulnerabilities.length} vulnerabilities found
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getScoreColor(result.gasScore)}>
                {result.gasScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <Progress value={result.gasScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {result.gasOptimizations.length} optimizations available
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getScoreColor(result.overallScore)}>
                {result.overallScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <Progress value={result.overallScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Based on security and gas efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-nova-red-600" />
              <span className="text-sm font-medium">Critical</span>
              <Badge variant="critical" size="sm">
                {criticalVulns.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-nova-orange-600" />
              <span className="text-sm font-medium">High</span>
              <Badge variant="high" size="sm">
                {highVulns.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Medium</span>
              <Badge variant="medium" size="sm">
                {mediumVulns.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-nova-blue-600" />
              <span className="text-sm font-medium">Low</span>
              <Badge variant="low" size="sm">
                {lowVulns.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="vulnerabilities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vulnerabilities">
            Vulnerabilities ({result.vulnerabilities.length})
          </TabsTrigger>
          <TabsTrigger value="gas">
            Gas Optimizations ({result.gasOptimizations.length})
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommendations ({result.recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerabilities" className="space-y-4">
          {result.vulnerabilities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-nova-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Vulnerabilities Found</h3>
                <p className="text-muted-foreground">
                  Great job! Your smart contract appears to be secure.
                </p>
              </CardContent>
            </Card>
          ) : (
            result.vulnerabilities.map((vuln) => (
              <Card key={vuln.id} variant="elevated">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(vuln.severity)}
                        <CardTitle className="text-lg">{vuln.title}</CardTitle>
                        <Badge variant={vuln.severity} size="sm">
                          {vuln.severity.toUpperCase()}
                        </Badge>
                        {vuln.cweId && (
                          <Badge variant="outline" size="sm">
                            {vuln.cweId}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {vuln.line && (
                          <span className="text-xs">
                            Line {vuln.line}
                            {vuln.function && ` in ${vuln.function}()`}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" size="sm">
                        {Math.round(vuln.confidence * 100)}% confidence
                      </Badge>
                      {onViewDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(vuln.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{vuln.description}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommendation</h4>
                      <p className="text-sm text-muted-foreground">{vuln.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="gas" className="space-y-4">
          {result.gasOptimizations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 text-nova-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fully Optimized</h3>
                <p className="text-muted-foreground">
                  Your contract is already well-optimized for gas efficiency.
                </p>
              </CardContent>
            </Card>
          ) : (
            result.gasOptimizations.map((opt) => (
              <Card key={opt.id} variant="elevated">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-nova-green-600" />
                        <CardTitle className="text-lg">{opt.title}</CardTitle>
                        <Badge 
                          className={getDifficultyColor(opt.difficulty)}
                          size="sm"
                        >
                          {opt.difficulty}
                        </Badge>
                      </div>
                      <CardDescription>
                        {opt.line && (
                          <span className="text-xs">
                            Line {opt.line}
                            {opt.function && ` in ${opt.function}()`}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="success" size="sm">
                      Save ~{opt.estimatedSavings} gas
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </div>
                    {opt.codeExample && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Example</h4>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                          <code>{opt.codeExample}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {result.recommendations.map((rec) => (
            <Card key={rec.id} variant="elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-nova-blue-600" />
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <Badge variant={rec.priority} size="sm">
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <CardDescription>{rec.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  {rec.implementation && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Implementation</h4>
                      <p className="text-sm text-muted-foreground">{rec.implementation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="summary">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
              <CardDescription>
                Comprehensive overview of your smart contract analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Executive Summary</h4>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Analysis Metadata</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Lines of Code:</span>
                      <span>{result.metadata.linesOfCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Complexity Score:</span>
                      <span>{result.metadata.complexity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analysis Time:</span>
                      <span>{(result.metadata.analysisTime / 1000).toFixed(2)}s</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Security Breakdown</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Critical Issues:</span>
                      <span className="text-nova-red-600">{criticalVulns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Issues:</span>
                      <span className="text-nova-orange-600">{highVulns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium Issues:</span>
                      <span className="text-yellow-600">{mediumVulns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Issues:</span>
                      <span className="text-nova-green-600">{lowVulns.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
