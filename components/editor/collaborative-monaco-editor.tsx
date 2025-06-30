'use client'

// =============================================
// NOVAGUARD COLLABORATIVE MONACO EDITOR
// Real-time collaborative Solidity editor
// =============================================

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Editor, Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useMyPresence, useOthers, useMutation, useStorage, useBroadcastEvent } from '@/lib/liveblocks/liveblocks.config'
import { CollaborationUtils, type Presence } from '@/lib/liveblocks/liveblocks.config'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  Users,
  MessageSquare,
  AlertTriangle,
  Zap,
  Eye,
  EyeOff,
  Save,
  History,
  Settings
} from 'lucide-react'

interface CollaborativeMonacoEditorProps {
  contractId: string
  initialValue?: string
  language?: string
  theme?: 'light' | 'dark' | 'auto'
  readOnly?: boolean
  onValueChange?: (value: string) => void
  onSelectionChange?: (selection: monaco.ISelection) => void
  onCursorPositionChange?: (position: monaco.IPosition) => void
  className?: string
  showCollaborators?: boolean
  showMinimap?: boolean
  enableVulnerabilityHighlighting?: boolean
  enableGasOptimizationHints?: boolean
}

export function CollaborativeMonacoEditor({
  contractId,
  initialValue = '',
  language = 'solidity',
  theme = 'dark',
  readOnly = false,
  onValueChange,
  onSelectionChange,
  onCursorPositionChange,
  className,
  showCollaborators = true,
  showMinimap = true,
  enableVulnerabilityHighlighting = true,
  enableGasOptimizationHints = true
}: CollaborativeMonacoEditorProps) {

  // Liveblocks hooks for real-time collaboration
  const [myPresence, updateMyPresence] = useMyPresence()
  const others = useOthers()
  const broadcastEvent = useBroadcastEvent()

  // Storage mutations for persistent data
  const updateContractCode = useMutation(({ storage }, code: string) => {
    storage.set('contractCode', code)
  }, [])

  const addAnnotation = useMutation(({ storage }, lineNumber: number, annotation: any) => {
    const annotations = storage.get('annotations') || {}
    const lineAnnotations = annotations[lineNumber.toString()] || []
    lineAnnotations.push(annotation)
    annotations[lineNumber.toString()] = lineAnnotations
    storage.set('annotations', annotations)
  }, [])

  // Get stored contract code
  const storedCode = useStorage((root) => root.contractCode)
  const annotations = useStorage((root) => root.annotations)
  const auditResults = useStorage((root) => root.auditResults)

  // Local state
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [monaco, setMonaco] = useState<Monaco | null>(null)
  const [showPresence, setShowPresence] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Refs
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const decorationsRef = useRef<string[]>([])

  // Initialize Monaco Editor with Solidity support
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    setEditor(editor)
    setMonaco(monaco)
    editorRef.current = editor

    // Configure Solidity language support
    configureSolidityLanguage(monaco)

    // Set up collaborative features
    setupCollaborativeFeatures(editor, monaco)

    // Set initial value from storage or prop
    const initialCode = storedCode || initialValue
    if (initialCode && initialCode !== editor.getValue()) {
      editor.setValue(initialCode)
    }

    // Focus editor
    editor.focus()

  }, [storedCode, initialValue])

  // Configure Solidity language support
  const configureSolidityLanguage = useCallback((monaco: Monaco) => {
    // Register Solidity language if not already registered
    if (!monaco.languages.getLanguages().some(lang => lang.id === 'solidity')) {
      monaco.languages.register({ id: 'solidity' })

      // Define Solidity syntax highlighting
      monaco.languages.setMonarchTokensProvider('solidity', {
        tokenizer: {
          root: [
            [/pragma\s+solidity/, 'keyword'],
            [/contract|library|interface/, 'keyword'],
            [/function|modifier|event|struct|enum|mapping/, 'keyword'],
            [/public|private|internal|external/, 'keyword'],
            [/view|pure|payable|nonpayable/, 'keyword'],
            [/if|else|for|while|do|break|continue|return/, 'keyword'],
            [/uint256|uint|int|bool|address|string|bytes/, 'type'],
            [/msg\.sender|msg\.value|block\.timestamp/, 'variable.predefined'],
            [/require|assert|revert/, 'keyword.control'],
            [/\/\/.*$/, 'comment'],
            [/\/\*[\s\S]*?\*\//, 'comment'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string'],
            [/\d+/, 'number'],
            [/0x[0-9a-fA-F]+/, 'number.hex'],
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop']
          ]
        }
      })

      // Configure language features
      monaco.languages.setLanguageConfiguration('solidity', {
        comments: {
          lineComment: '//',
          blockComment: ['/*', '*/']
        },
        brackets: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')']
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" }
        ],
        surroundingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" }
        ]
      })
    }
  }, [])

  // Set up collaborative features
  const setupCollaborativeFeatures = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position
      updateMyPresence({
        cursor: { x: position.column, y: position.lineNumber },
        selection: null,
        lastActivity: Date.now()
      })

      onCursorPositionChange?.(position)
    })

    // Track selection changes
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection
      updateMyPresence({
        selection: {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn
        },
        lastActivity: Date.now()
      })

      onSelectionChange?.(selection)
    })

    // Track content changes
    editor.onDidChangeModelContent((e) => {
      const value = editor.getValue()

      // Update typing status
      setIsTyping(true)
      updateMyPresence({ isTyping: true, lastActivity: Date.now() })

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        updateMyPresence({ isTyping: false })
      }, 1000)

      // Update storage and trigger callbacks
      updateContractCode(value)
      onValueChange?.(value)

      // Broadcast content change event
      broadcastEvent({
        type: 'CODE_SUGGESTION',
        data: {
          suggestionId: `edit_${Date.now()}`,
          line: e.changes[0]?.range.startLineNumber || 1,
          suggestion: 'Code updated',
          author: myPresence.user?.name || 'Anonymous',
          timestamp: Date.now()
        }
      })
    })

    // Add context menu items for collaboration
    editor.addAction({
      id: 'add-comment',
      label: 'Add Comment',
      contextMenuGroupId: 'collaboration',
      contextMenuOrder: 1,
      run: (editor) => {
        const position = editor.getPosition()
        if (position) {
          addCommentAtLine(position.lineNumber)
        }
      }
    })

    editor.addAction({
      id: 'mark-vulnerability',
      label: 'Mark as Vulnerability',
      contextMenuGroupId: 'collaboration',
      contextMenuOrder: 2,
      run: (editor) => {
        const position = editor.getPosition()
        if (position) {
          markVulnerabilityAtLine(position.lineNumber)
        }
      }
    })

  }, [updateMyPresence, updateContractCode, onValueChange, onSelectionChange, onCursorPositionChange, broadcastEvent, myPresence.user?.name])

  // Add comment at specific line
  const addCommentAtLine = useCallback((lineNumber: number) => {
    const annotation = {
      id: `comment_${Date.now()}`,
      userId: myPresence.user?.id || 'anonymous',
      content: 'New comment',
      type: 'comment' as const,
      resolved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replies: []
    }

    addAnnotation(lineNumber, annotation)
  }, [addAnnotation, myPresence.user?.id])

  // Mark vulnerability at specific line
  const markVulnerabilityAtLine = useCallback((lineNumber: number) => {
    const annotation = {
      id: `vuln_${Date.now()}`,
      userId: myPresence.user?.id || 'anonymous',
      content: 'Potential vulnerability detected',
      type: 'vulnerability' as const,
  // Handle real-time events
  useEffect(() => {
    const handleVulnerabilityFound = (event: any) => {
      // Show notification for new vulnerability
      console.log('Vulnerability found:', event.data)
      // You could show a toast notification here
    }

    const handleAuditCompleted = (event: any) => {
      // Handle audit completion
      console.log('Audit completed:', event.data)
      // Update UI to reflect new audit results
    }

    const handleUserJoined = (event: any) => {
      console.log('User joined:', event.data)
      // Show user joined notification
    }

    const handleUserLeft = (event: any) => {
      console.log('User left:', event.data)
      // Show user left notification
    }

    // Set up event listeners
    const unsubscribeVuln = broadcastEvent.subscribe('VULNERABILITY_FOUND', handleVulnerabilityFound)
    const unsubscribeAudit = broadcastEvent.subscribe('AUDIT_COMPLETED', handleAuditCompleted)
    const unsubscribeJoin = broadcastEvent.subscribe('USER_JOINED', handleUserJoined)
    const unsubscribeLeave = broadcastEvent.subscribe('USER_LEFT', handleUserLeft)

    return () => {
      // Cleanup event listeners
      unsubscribeVuln?.()
      unsubscribeAudit?.()
      unsubscribeJoin?.()
      unsubscribeLeave?.()
    }
  }, [broadcastEvent])

  // Keyboard shortcuts for collaboration
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for quick comment
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const position = editor.getPosition()
        if (position) {
          addCommentAtLine(position.lineNumber)
        }
      }

      // Ctrl/Cmd + Shift + V for mark vulnerability
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault()
        const position = editor.getPosition()
        if (position) {
          markVulnerabilityAtLine(position.lineNumber)
        }
      }

      // Ctrl/Cmd + S for manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        setLastSaved(new Date())
        // Trigger save
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editor, addCommentAtLine, markVulnerabilityAtLine])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])
      severity: 'medium' as const,
      resolved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replies: []
    }

    addAnnotation(lineNumber, annotation)

    // Broadcast vulnerability found event
    broadcastEvent({
      type: 'VULNERABILITY_FOUND',
      data: {
        vulnerability: {
          id: annotation.id,
          name: 'Manual Review Finding',
          severity: 'medium',
          line: lineNumber
        },
        foundBy: myPresence.user?.name || 'Anonymous',
        timestamp: Date.now()
      }
    })
  }, [addAnnotation, broadcastEvent, myPresence.user])

  // Update decorations for collaborators and annotations
  useEffect(() => {
    if (!editor || !monaco) return

    const newDecorations: monaco.editor.IModelDeltaDecoration[] = []

    // Add collaborator cursors and selections
    if (showPresence) {
      others.forEach((other) => {
        const presence = CollaborationUtils.formatPresence(other)

        // Add cursor decoration
        if (presence.cursor && presence.isActive) {
          newDecorations.push({
            range: new monaco.Range(presence.cursor.y, presence.cursor.x, presence.cursor.y, presence.cursor.x),
            options: {
              className: 'collaborator-cursor',
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              beforeContentClassName: 'collaborator-cursor-line',
              afterContentClassName: 'collaborator-cursor-label',
              after: {
                content: presence.displayName,
                inlineClassName: 'collaborator-cursor-name',
                inlineClassNameAffectsLetterSpacing: true
              }
            }
          })
        }

        // Add selection decoration
        if (presence.selection && presence.isActive) {
          newDecorations.push({
            range: new monaco.Range(
              presence.selection.startLineNumber,
              presence.selection.startColumn,
              presence.selection.endLineNumber,
              presence.selection.endColumn
            ),
            options: {
              className: 'collaborator-selection',
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
            }
          })
        }
      })
    }

    // Add vulnerability highlights
    if (enableVulnerabilityHighlighting && auditResults?.vulnerabilities) {
      auditResults.vulnerabilities.forEach((vuln) => {
        if (vuln.affectedLines) {
          const lines = vuln.affectedLines.split('-').map(Number)
          const startLine = lines[0] || 1
          const endLine = lines[1] || startLine

          newDecorations.push({
            range: new monaco.Range(startLine, 1, endLine, 1),
            options: {
              isWholeLine: true,
              className: `vulnerability-highlight vulnerability-${vuln.severity}`,
              glyphMarginClassName: `vulnerability-glyph vulnerability-${vuln.severity}`,
              hoverMessage: {
                value: `**${vuln.name}** (${vuln.severity})\n\n${vuln.description}`
              }
            }
          })
        }
      })
    }

    // Add annotation decorations
    if (annotations) {
      Object.entries(annotations).forEach(([lineNumber, lineAnnotations]) => {
        lineAnnotations.forEach((annotation) => {
          newDecorations.push({
            range: new monaco.Range(parseInt(lineNumber), 1, parseInt(lineNumber), 1),
            options: {
              isWholeLine: false,
              glyphMarginClassName: `annotation-glyph annotation-${annotation.type}`,
              hoverMessage: {
                value: `**${annotation.type.toUpperCase()}**\n\n${annotation.content}`
              }
            }
          })
        })
      })
    }

    // Apply decorations
    const newDecorationIds = editor.deltaDecorations(decorationsRef.current, newDecorations)
    decorationsRef.current = newDecorationIds

  }, [editor, monaco, others, showPresence, annotations, auditResults, enableVulnerabilityHighlighting])

  // Auto-save functionality
  useEffect(() => {
    if (!editor) return

    const autoSaveInterval = setInterval(() => {
      if (!isTyping) {
        setLastSaved(new Date())
        // Here you would typically save to your backend
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [editor, isTyping])

  // Collaboration metrics
  const collaborationMetrics = CollaborationUtils.getCollaborationMetrics(others)

  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* Collaboration Header */}
      {showCollaborators && (
        <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {collaborationMetrics.activeUsers + 1} active
                </span>
              </div>

              {/* Collaborator Avatars */}
              <div className="flex -space-x-2">
                {others.slice(0, 5).map((other) => {
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
                        <div className="text-center">
                          <p className="font-medium">{presence.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {presence.isTyping ? 'Typing...' : 'Active'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}

                {others.length > 5 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                    +{others.length - 5}
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Indicators */}
            {auditResults && (
              <Badge variant="outline" className="text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {auditResults.vulnerabilities?.length || 0} issues
              </Badge>
            )}

            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}

            {/* Collaboration Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPresence(!showPresence)}
            >
              {showPresence ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="h-full">
        <Editor
          height="100%"
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          value={storedCode || initialValue}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: showMinimap },
            fontSize: 14,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            contextmenu: true,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            renderWhitespace: 'selection',
            renderControlCharacters: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on'
          }}
        />
      </div>

      {/* Collaboration Styles */}
      <style jsx global>{`
        .collaborator-cursor {
          border-left: 2px solid var(--user-color, #3b82f6);
          position: relative;
        }

        .collaborator-cursor-name {
          background: var(--user-color, #3b82f6);
          color: white;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 11px;
          position: absolute;
          top: -20px;
          left: -2px;
          white-space: nowrap;
          z-index: 1000;
        }

        .collaborator-selection {
          background: var(--user-color, #3b82f6);
          opacity: 0.2;
        }

        .vulnerability-highlight.vulnerability-critical {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
        }

        .vulnerability-highlight.vulnerability-high {
          background: rgba(245, 158, 11, 0.1);
          border-left: 3px solid #f59e0b;
        }

        .vulnerability-highlight.vulnerability-medium {
          background: rgba(59, 130, 246, 0.1);
          border-left: 3px solid #3b82f6;
        }

        .vulnerability-highlight.vulnerability-low {
          background: rgba(34, 197, 94, 0.1);
          border-left: 3px solid #22c55e;
        }

        .vulnerability-glyph.vulnerability-critical::before {
          content: "⚠";
          color: #ef4444;
        }

        .vulnerability-glyph.vulnerability-high::before {
          content: "⚠";
          color: #f59e0b;
        }

        .vulnerability-glyph.vulnerability-medium::before {
          content: "⚠";
          color: #3b82f6;
        }

        .vulnerability-glyph.vulnerability-low::before {
          content: "ⓘ";
          color: #22c55e;
        }

        .annotation-glyph.annotation-comment::before {
          content: "💬";
        }

        .annotation-glyph.annotation-suggestion::before {
          content: "💡";
        }

        .annotation-glyph.annotation-vulnerability::before {
          content: "🔒";
        }

        .annotation-glyph.annotation-optimization::before {
          content: "⚡";
        }
      `}</style>
    </div>
  )
}

export default CollaborativeMonacoEditor
