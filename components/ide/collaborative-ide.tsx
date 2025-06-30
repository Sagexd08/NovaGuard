'use client'

// =============================================
// NOVAGUARD COLLABORATIVE IDE
// Complete real-time collaborative development environment
// =============================================

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Save, 
  Share2, 
  Settings, 
  Users, 
  MessageSquare, 
  History, 
  Download,
  Upload,
  GitBranch,
  Shield,
  Zap,
  DollarSign,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Terminal,
  FileText,
  Code,
  Database
} from 'lucide-react'

import CollaborativeMonacoEditor from '@/components/editor/collaborative-monaco-editor'
import CollaborativeAuditDashboard from '@/components/collaboration/collaborative-audit-dashboard'
import CollaborativeWorkspaceProvider, { useCollaborativeWorkspace } from '@/components/providers/collaborative-workspace-provider'
import { useStorage, useOthers, useBroadcastEvent, useEventListener } from '@/lib/liveblocks/liveblocks.config'
import { CollaborationUtils } from '@/lib/liveblocks/liveblocks.config'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface CollaborativeIDEProps {
  contractId: string
  workspaceId?: string
  initialCode?: string
  className?: string
  onCodeChange?: (code: string) => void
  onAuditComplete?: (results: any) => void
  onDeploymentStart?: (config: any) => void
}

function CollaborativeIDEContent({
  contractId,
  initialCode = '',
  className,
  onCodeChange,
  onAuditComplete,
  onDeploymentStart
}: Omit<CollaborativeIDEProps, 'workspaceId'>) {
  
  const { user } = useUser()
  const workspace = useCollaborativeWorkspace()
  const others = useOthers()
  const broadcastEvent = useBroadcastEvent()
  
  // Storage hooks
  const contractCode = useStorage((root) => root.contractCode)
  const auditResults = useStorage((root) => root.auditResults)
  const workspaceSettings = useStorage((root) => root.workspaceSettings)
  const annotations = useStorage((root) => root.annotations)
  
  // Local state
  const [activeTab, setActiveTab] = useState('editor')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [bottomPanelVisible, setBottomPanelVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  
  // Collaboration metrics
  const collaborationMetrics = useMemo(() => {
    return CollaborationUtils.getCollaborationMetrics(others)
  }, [others])
  
  // Handle code changes
  const handleCodeChange = useCallback((code: string) => {
    setUnsavedChanges(true)
    onCodeChange?.(code)
    
    // Auto-save after 2 seconds of inactivity
    const autoSaveTimeout = setTimeout(() => {
      setLastSaved(new Date())
      setUnsavedChanges(false)
      toast.success('Auto-saved', { duration: 1000 })
    }, 2000)
    
    return () => clearTimeout(autoSaveTimeout)
  }, [onCodeChange])
  
  // Manual save
  const handleSave = useCallback(() => {
    setLastSaved(new Date())
    setUnsavedChanges(false)
    toast.success('Saved successfully')
    
    // Broadcast save event
    broadcastEvent({
      type: 'CODE_SUGGESTION',
      data: {
        suggestionId: `save_${Date.now()}`,
        line: 1,
        suggestion: 'Contract saved',
        author: user?.fullName || 'Anonymous',
        timestamp: Date.now()
      }
    })
  }, [broadcastEvent, user?.fullName])
  
  // Run security audit
  const handleRunAudit = useCallback(async () => {
    if (!contractCode) {
      toast.error('No code to audit')
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/audit/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractCode,
          options: {
            analysisMode: 'comprehensive',
            agents: ['security', 'gasOptimizer', 'tokenomics']
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Audit failed')
      }
      
      const results = await response.json()
      
      // Broadcast audit completion
      broadcastEvent({
        type: 'AUDIT_COMPLETED',
        data: {
          auditId: results.data.auditId,
          score: results.data.overallScore,
          vulnerabilityCount: results.data.vulnerabilities?.length || 0,
          completedBy: user?.fullName || 'Anonymous',
          timestamp: Date.now()
        }
      })
      
      onAuditComplete?.(results.data)
      toast.success('Security audit completed')
      
    } catch (error) {
      console.error('Audit failed:', error)
      toast.error('Security audit failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [contractCode, broadcastEvent, user?.fullName, onAuditComplete])
  
  // Share workspace
  const handleShare = useCallback(async () => {
    try {
      const shareUrl = `${window.location.origin}/collaborate/${contractId}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy share link')
    }
  }, [contractId])
  
  // Export contract
  const handleExport = useCallback(() => {
    if (!contractCode) {
      toast.error('No code to export')
      return
    }
    
    const blob = new Blob([contractCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contract_${contractId}.sol`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Contract exported')
  }, [contractCode, contractId])
  
  // Listen to real-time events
  useEventListener(({ event }) => {
    switch (event.type) {
      case 'VULNERABILITY_FOUND':
        toast.error(`Vulnerability found by ${event.data.foundBy}`, {
          duration: 3000,
          icon: '🔒'
        })
        break
      case 'AUDIT_COMPLETED':
        if (event.data.completedBy !== user?.fullName) {
          toast.success(`Audit completed by ${event.data.completedBy}`, {
            duration: 3000,
            icon: '✅'
          })
        }
        break
      case 'USER_JOINED':
        toast.success(`${event.data.userName} joined the workspace`, {
          duration: 2000,
          icon: '👋'
        })
        break
      case 'USER_LEFT':
        toast(`${event.data.userName} left the workspace`, {
          duration: 2000,
          icon: '👋'
        })
        break
    }
  })
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      
      // Ctrl/Cmd + R for run audit
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        handleRunAudit()
      }
      
      // Ctrl/Cmd + Shift + S for share
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        handleShare()
      }
      
      // F11 for fullscreen
      if (e.key === 'F11') {
        e.preventDefault()
        setIsFullscreen(!isFullscreen)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleRunAudit, handleShare, isFullscreen])
  
  return (
    <div className={cn('h-screen flex flex-col bg-background', className)}>
      {/* Header Toolbar */}
      <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">NovaGuard IDE</h1>
          <Badge variant="outline" className="text-xs">
            Contract {contractId.slice(0, 8)}...
          </Badge>
          
          {unsavedChanges && (
            <Badge variant="secondary" className="text-xs">
              Unsaved changes
            </Badge>
          )}
          
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Collaboration Status */}
          <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {collaborationMetrics.activeUsers + 1} active
            </span>
            
            {/* Active Users Avatars */}
            <div className="flex -space-x-1">
              {others.slice(0, 3).map((other) => {
                const presence = CollaborationUtils.formatPresence(other)
                return (
                  <div
                    key={other.connectionId}
                    className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: presence.user.color }}
                    title={presence.displayName}
                  >
                    {presence.initials}
                  </div>
                )
              })}
              {others.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                  +{others.length - 3}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!unsavedChanges}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAudit}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-1" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Audit'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          {/* View Controls */}
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            {sidebarVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Main IDE Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          {sidebarVisible && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full border-r">
                  <Tabs defaultValue="files" className="h-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="files">
                        <FileText className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="comments">
                        <MessageSquare className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="history">
                        <History className="h-4 w-4" />
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="files" className="h-full p-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Code className="h-4 w-4" />
                          <span className="text-sm">contract.sol</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="comments" className="h-full p-2">
                      <ScrollArea className="h-full">
                        <div className="space-y-2">
                          {annotations && Object.entries(annotations).map(([lineNumber, lineAnnotations]) => (
                            <div key={lineNumber} className="space-y-1">
                              {lineAnnotations.map((annotation) => (
                                <Card key={annotation.id} className="p-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                    <div className="flex-1">
                                      <p className="text-xs text-muted-foreground">
                                        Line {lineNumber}
                                      </p>
                                      <p className="text-sm">{annotation.content}</p>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ))}
                          
                          {(!annotations || Object.keys(annotations).length === 0) && (
                            <p className="text-muted-foreground text-center py-8 text-sm">
                              No comments yet
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="history" className="h-full p-2">
                      <ScrollArea className="h-full">
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-center py-8 text-sm">
                            Version history coming soon
                          </p>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          
          {/* Main Editor Area */}
          <ResizablePanel defaultSize={sidebarVisible ? 60 : 80}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={bottomPanelVisible ? 70 : 100}>
                <div className="h-full">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                    <TabsList className="w-full justify-start border-b rounded-none">
                      <TabsTrigger value="editor">
                        <Code className="h-4 w-4 mr-1" />
                        Editor
                      </TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="editor" className="h-full mt-0">
                      <CollaborativeMonacoEditor
                        contractId={contractId}
                        initialValue={initialCode}
                        onValueChange={handleCodeChange}
                        showCollaborators={true}
                        enableVulnerabilityHighlighting={true}
                        enableGasOptimizationHints={true}
                        className="h-full"
                      />
                    </TabsContent>
                    
                    <TabsContent value="preview" className="h-full mt-0 p-4">
                      <div className="h-full bg-muted rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground">Contract preview coming soon</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
              
              {/* Bottom Panel */}
              {bottomPanelVisible && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                    <div className="h-full border-t">
                      <Tabs defaultValue="audit" className="h-full">
                        <TabsList className="w-full justify-start border-b rounded-none">
                          <TabsTrigger value="audit">
                            <Shield className="h-4 w-4 mr-1" />
                            Security Audit
                          </TabsTrigger>
                          <TabsTrigger value="console">
                            <Terminal className="h-4 w-4 mr-1" />
                            Console
                          </TabsTrigger>
                          <TabsTrigger value="database">
                            <Database className="h-4 w-4 mr-1" />
                            Database
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="audit" className="h-full mt-0">
                          <CollaborativeAuditDashboard
                            contractId={contractId}
                            showRealTimeUpdates={true}
                            enableCollaborativeReview={true}
                            className="h-full p-4"
                          />
                        </TabsContent>
                        
                        <TabsContent value="console" className="h-full mt-0 p-4">
                          <div className="h-full bg-black rounded-md p-4 font-mono text-green-400 text-sm">
                            <p>NovaGuard Console v2.0.0</p>
                            <p>Ready for commands...</p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="database" className="h-full mt-0 p-4">
                          <div className="h-full bg-muted rounded-md flex items-center justify-center">
                            <p className="text-muted-foreground">Database explorer coming soon</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
          
          {/* Right Sidebar - Audit Results */}
          <ResizableHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full border-l p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Quick Stats</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Security Score</span>
                      <Badge variant="outline">
                        {auditResults?.overallScore || 0}/100
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Vulnerabilities</span>
                      <Badge variant="destructive">
                        {auditResults?.vulnerabilities?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Gas Optimizations</span>
                      <Badge variant="secondary">
                        {auditResults?.gasOptimizations?.length || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Active Collaborators</h3>
                  <div className="space-y-2">
                    {others.map((other) => {
                      const presence = CollaborationUtils.formatPresence(other)
                      return (
                        <div key={other.connectionId} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: presence.user.color }}
                          />
                          <span>{presence.displayName}</span>
                          {presence.isTyping && (
                            <Badge variant="outline" className="text-xs">
                              Typing...
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                    
                    {others.length === 0 && (
                      <p className="text-muted-foreground text-sm">
                        No other collaborators
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export function CollaborativeIDE(props: CollaborativeIDEProps) {
  return (
    <CollaborativeWorkspaceProvider
      contractId={props.contractId}
      workspaceId={props.workspaceId}
      initialMode="edit"
      enableAutoSave={true}
      enablePresence={true}
    >
      <CollaborativeIDEContent {...props} />
    </CollaborativeWorkspaceProvider>
  )
}

export default CollaborativeIDE
