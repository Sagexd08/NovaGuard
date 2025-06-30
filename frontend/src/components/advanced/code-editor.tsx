'use client'

import React, { useRef, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Maximize2, 
  Minimize2,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  value?: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  height?: string | number
  className?: string
  showMinimap?: boolean
  showLineNumbers?: boolean
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  fontSize?: number
  onSave?: (value: string) => void
  onAnalyze?: (value: string) => void
  onDeploy?: (value: string) => void
  errors?: Array<{
    line: number
    column: number
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  isAnalyzing?: boolean
  analysisResults?: {
    vulnerabilities: number
    gasOptimizations: number
    score: number
  }
}

export function CodeEditor({
  value = '',
  onChange,
  language = 'solidity',
  readOnly = false,
  height = '600px',
  className,
  showMinimap = true,
  showLineNumbers = true,
  wordWrap = 'on',
  fontSize = 14,
  onSave,
  onAnalyze,
  onDeploy,
  errors = [],
  isAnalyzing = false,
  analysisResults,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)
  const { theme } = useTheme()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editorTheme, setEditorTheme] = useState('vs-dark')

  useEffect(() => {
    setEditorTheme(theme === 'dark' ? 'vs-dark' : 'vs-light')
  }, [theme])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Register Solidity language if not already registered
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'solidity')) {
      monaco.languages.register({ id: 'solidity' })
      
      // Define Solidity syntax highlighting
      monaco.languages.setMonarchTokensProvider('solidity', {
        tokenizer: {
          root: [
            [/pragma\s+solidity/, 'keyword'],
            [/contract|library|interface/, 'keyword'],
            [/function|modifier|constructor|fallback|receive/, 'keyword'],
            [/public|private|internal|external/, 'keyword'],
            [/view|pure|payable|nonpayable/, 'keyword'],
            [/uint256|uint|int|bool|address|string|bytes/, 'type'],
            [/mapping|struct|enum|event/, 'keyword'],
            [/if|else|for|while|do|break|continue|return/, 'keyword'],
            [/require|assert|revert/, 'keyword'],
            [/msg\.sender|msg\.value|block\.timestamp/, 'variable.predefined'],
            [/".*?"/, 'string'],
            [/'.*?'/, 'string'],
            [/\/\/.*$/, 'comment'],
            [/\/\*[\s\S]*?\*\//, 'comment'],
            [/\d+/, 'number'],
          ]
        }
      })
    }

    // Set error markers
    if (errors.length > 0) {
      const markers = errors.map(error => ({
        startLineNumber: error.line,
        startColumn: error.column,
        endLineNumber: error.line,
        endColumn: error.column + 10,
        message: error.message,
        severity: monaco.MarkerSeverity[error.severity.toUpperCase()],
      }))
      monaco.editor.setModelMarkers(editor.getModel(), 'solidity', markers)
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editor.getValue())
      }
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onAnalyze) {
        onAnalyze(editor.getValue())
      }
    })
  }

  const handleSave = () => {
    if (onSave && editorRef.current) {
      onSave(editorRef.current.getValue())
    }
  }

  const handleAnalyze = () => {
    if (onAnalyze && editorRef.current) {
      onAnalyze(editorRef.current.getValue())
    }
  }

  const handleDeploy = () => {
    if (onDeploy && editorRef.current) {
      onDeploy(editorRef.current.getValue())
    }
  }

  const handleDownload = () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue()
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'contract.sol'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <Card 
      className={cn(
        'relative overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
      variant="elevated"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Smart Contract Editor</span>
          {language && (
            <Badge variant="outline" size="sm">
              {language.toUpperCase()}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Analysis Results */}
          {analysisResults && (
            <div className="flex items-center space-x-2">
              <Badge variant="info" size="sm">
                Score: {analysisResults.score}
              </Badge>
              {analysisResults.vulnerabilities > 0 && (
                <Badge variant="high" size="sm">
                  {analysisResults.vulnerabilities} Issues
                </Badge>
              )}
              {analysisResults.gasOptimizations > 0 && (
                <Badge variant="warning" size="sm">
                  {analysisResults.gasOptimizations} Gas Tips
                </Badge>
              )}
            </div>
          )}

          {/* Error Count */}
          {errors.length > 0 && (
            <Badge variant="destructive" size="sm">
              <XCircle className="h-3 w-3 mr-1" />
              {errors.length} Error{errors.length > 1 ? 's' : ''}
            </Badge>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                title="Save (Ctrl+S)"
              >
                <Save className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>

            {onAnalyze && (
              <Button
                variant="default"
                size="sm"
                onClick={handleAnalyze}
                loading={isAnalyzing}
                title="Analyze (Ctrl+Enter)"
              >
                <Play className="h-4 w-4" />
                Analyze
              </Button>
            )}

            {onDeploy && (
              <Button
                variant="gradient"
                size="sm"
                onClick={handleDeploy}
                title="Deploy Contract"
              >
                Deploy
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <Editor
          height={isFullscreen ? 'calc(100vh - 60px)' : height}
          defaultLanguage={language}
          value={value}
          onChange={(value) => onChange?.(value || '')}
          onMount={handleEditorDidMount}
          theme={editorTheme}
          options={{
            readOnly,
            minimap: { enabled: showMinimap },
            lineNumbers: showLineNumbers ? 'on' : 'off',
            wordWrap,
            fontSize,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            parameterHints: {
              enabled: true,
            },
            hover: {
              enabled: true,
            },
            contextmenu: true,
            mouseWheelZoom: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
          }}
        />

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm font-medium">Analyzing contract...</span>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-1 text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Lines: {value.split('\n').length}</span>
          <span>Characters: {value.length}</span>
          {language && <span>Language: {language}</span>}
        </div>
        
        <div className="flex items-center space-x-2">
          {errors.length === 0 ? (
            <div className="flex items-center space-x-1 text-nova-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>No errors</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-nova-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{errors.length} error{errors.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
