'use client'

// =============================================
// NOVAGUARD ADVANCED CODE EDITOR
// Monaco-based Solidity editor with advanced features
// =============================================

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Editor, Monaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  Copy, 
  Maximize2, 
  Minimize2,
  Settings,
  FileText,
  Search,
  Replace,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Bug,
  Lightbulb
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

// Monaco editor types
import type { editor } from 'monaco-editor'

interface CodeIssue {
  id: string
  type: 'error' | 'warning' | 'info' | 'suggestion'
  severity: 'low' | 'medium' | 'high' | 'critical'
  line: number
  column: number
  endLine?: number
  endColumn?: number
  message: string
  source: string
  quickFix?: {
    title: string
    edits: Array<{
      range: { startLine: number; startColumn: number; endLine: number; endColumn: number }
      text: string
    }>
  }
}

interface EditorSettings {
  fontSize: number
  tabSize: number
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  minimap: boolean
  lineNumbers: 'on' | 'off' | 'relative' | 'interval'
  folding: boolean
  autoSave: boolean
  formatOnSave: boolean
  theme: 'vs-dark' | 'vs-light' | 'hc-black'
}

interface AdvancedCodeEditorProps {
  value: string
  onChange: (value: string) => void
  onAnalyze?: (code: string) => void
  onSave?: (code: string) => void
  issues?: CodeIssue[]
  readOnly?: boolean
  className?: string
}

export function AdvancedCodeEditor({
  value,
  onChange,
  onAnalyze,
  onSave,
  issues = [],
  readOnly = false,
  className
}: AdvancedCodeEditorProps) {
  const { theme } = useTheme()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  
  // State
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    fontSize: 14,
    tabSize: 4,
    wordWrap: 'on',
    minimap: true,
    lineNumbers: 'on',
    folding: true,
    autoSave: true,
    formatOnSave: true,
    theme: theme === 'dark' ? 'vs-dark' : 'vs-light'
  })
  const [decorations, setDecorations] = useState<string[]>([])

  // Initialize Monaco editor
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure Solidity language
    configureSolidityLanguage(monaco)

    // Set up editor features
    setupEditorFeatures(editor, monaco)

    // Apply initial settings
    applyEditorSettings(editor, editorSettings)

    console.log('✅ Monaco editor initialized')
  }, [editorSettings])

  // Configure Solidity language support
  const configureSolidityLanguage = (monaco: Monaco) => {
    // Register Solidity language if not already registered
    if (!monaco.languages.getLanguages().some(lang => lang.id === 'solidity')) {
      monaco.languages.register({ id: 'solidity' })

      // Define Solidity syntax highlighting
      monaco.languages.setMonarchTokensProvider('solidity', {
        tokenizer: {
          root: [
            // Keywords
            [/\b(contract|library|interface|function|modifier|event|struct|enum|mapping|using|for|if|else|while|do|break|continue|return|throw|emit|require|assert|revert|try|catch|pragma|import|as|from)\b/, 'keyword'],
            
            // Types
            [/\b(address|bool|string|bytes|uint|int|fixed|ufixed|byte)\d*\b/, 'type'],
            [/\b(public|private|internal|external|pure|view|payable|constant|immutable|override|virtual|abstract)\b/, 'keyword.modifier'],
            
            // Storage keywords
            [/\b(storage|memory|calldata)\b/, 'keyword.storage'],
            
            // Numbers
            [/\b\d+(\.\d+)?(e[+-]?\d+)?\b/, 'number'],
            [/\b0x[a-fA-F0-9]+\b/, 'number.hex'],
            
            // Strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string'],
            [/'([^'\\]|\\.)*$/, 'string.invalid'],
            [/'/, 'string', '@string_single'],
            
            // Comments
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
            
            // Operators
            [/[{}()\[\]]/, '@brackets'],
            [/[<>](?!@symbols)/, '@brackets'],
            [/@symbols/, 'operator'],
            
            // Identifiers
            [/[a-zA-Z_$][\w$]*/, 'identifier'],
          ],
          
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop']
          ],
          
          string_single: [
            [/[^\\']+/, 'string'],
            [/\\./, 'string.escape'],
            [/'/, 'string', '@pop']
          ],
          
          comment: [
            [/[^\/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment']
          ]
        },
        
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        brackets: [
          { open: '{', close: '}', token: 'delimiter.curly' },
          { open: '[', close: ']', token: 'delimiter.square' },
          { open: '(', close: ')', token: 'delimiter.parenthesis' }
        ]
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
        ],
        folding: {
          markers: {
            start: new RegExp('^\\s*//\\s*#?region\\b'),
            end: new RegExp('^\\s*//\\s*#?endregion\\b')
          }
        }
      })
    }
  }

  // Set up advanced editor features
  const setupEditorFeatures = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // Add custom actions
    editor.addAction({
      id: 'analyze-contract',
      label: 'Analyze Contract',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
      run: () => {
        if (onAnalyze) {
          onAnalyze(editor.getValue())
        }
      }
    })

    editor.addAction({
      id: 'save-contract',
      label: 'Save Contract',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        if (onSave) {
          onSave(editor.getValue())
        }
      }
    })

    editor.addAction({
      id: 'format-document',
      label: 'Format Document',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: () => {
        editor.getAction('editor.action.formatDocument')?.run()
      }
    })

    // Set up auto-completion
    monaco.languages.registerCompletionItemProvider('solidity', {
      provideCompletionItems: (model, position) => {
        const suggestions = getSolidityCompletions(monaco)
        return { suggestions }
      }
    })

    // Set up hover provider
    monaco.languages.registerHoverProvider('solidity', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position)
        if (word) {
          const hoverInfo = getSolidityHoverInfo(word.word)
          if (hoverInfo) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [{ value: hoverInfo }]
            }
          }
        }
        return null
      }
    })
  }

  // Apply editor settings
  const applyEditorSettings = (editor: editor.IStandaloneCodeEditor, settings: EditorSettings) => {
    editor.updateOptions({
      fontSize: settings.fontSize,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap,
      minimap: { enabled: settings.minimap },
      lineNumbers: settings.lineNumbers,
      folding: settings.folding,
      readOnly
    })
  }

  // Update decorations for issues
  useEffect(() => {
    if (editorRef.current && monacoRef.current && issues.length > 0) {
      const newDecorations = issues.map(issue => ({
        range: new monacoRef.current!.Range(
          issue.line,
          issue.column,
          issue.endLine || issue.line,
          issue.endColumn || issue.column + 1
        ),
        options: {
          className: `editor-decoration-${issue.type}`,
          hoverMessage: { value: `**${issue.source}**: ${issue.message}` },
          glyphMarginClassName: `editor-glyph-${issue.type}`,
          minimap: {
            color: getIssueColor(issue.type),
            position: monacoRef.current!.editor.MinimapPosition.Inline
          }
        }
      }))

      const decorationIds = editorRef.current.deltaDecorations(decorations, newDecorations)
      setDecorations(decorationIds)
    }
  }, [issues, decorations])

  // Handle theme changes
  useEffect(() => {
    if (monacoRef.current) {
      const newTheme = theme === 'dark' ? 'vs-dark' : 'vs-light'
      monacoRef.current.editor.setTheme(newTheme)
      setEditorSettings(prev => ({ ...prev, theme: newTheme }))
    }
  }, [theme])

  // Get Solidity completions
  const getSolidityCompletions = (monaco: Monaco) => {
    const keywords = [
      'contract', 'library', 'interface', 'function', 'modifier', 'event', 'struct', 'enum',
      'mapping', 'using', 'for', 'if', 'else', 'while', 'do', 'break', 'continue', 'return',
      'throw', 'emit', 'require', 'assert', 'revert', 'try', 'catch', 'pragma', 'import'
    ]

    const types = [
      'address', 'bool', 'string', 'bytes', 'uint', 'int', 'fixed', 'ufixed',
      'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
      'int8', 'int16', 'int32', 'int64', 'int128', 'int256',
      'bytes1', 'bytes2', 'bytes4', 'bytes8', 'bytes16', 'bytes32'
    ]

    const modifiers = [
      'public', 'private', 'internal', 'external', 'pure', 'view', 'payable',
      'constant', 'immutable', 'override', 'virtual', 'abstract'
    ]

    const suggestions: any[] = []

    // Add keywords
    keywords.forEach(keyword => {
      suggestions.push({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword
      })
    })

    // Add types
    types.forEach(type => {
      suggestions.push({
        label: type,
        kind: monaco.languages.CompletionItemKind.TypeParameter,
        insertText: type
      })
    })

    // Add modifiers
    modifiers.forEach(modifier => {
      suggestions.push({
        label: modifier,
        kind: monaco.languages.CompletionItemKind.Modifier,
        insertText: modifier
      })
    })

    // Add snippets
    suggestions.push({
      label: 'contract',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'contract ${1:ContractName} {\n\t$0\n}',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Create a new contract'
    })

    suggestions.push({
      label: 'function',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'function ${1:functionName}(${2:parameters}) ${3:public} ${4:returns (${5:returnType})} {\n\t$0\n}',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Create a new function'
    })

    return suggestions
  }

  // Get hover information for Solidity keywords
  const getSolidityHoverInfo = (word: string): string | null => {
    const hoverData: Record<string, string> = {
      'contract': 'A contract is a collection of code and data that resides at a specific address on the Ethereum blockchain.',
      'function': 'Functions are the executable units of code within a contract.',
      'modifier': 'Modifiers can be used to change the behavior of functions in a declarative way.',
      'event': 'Events allow logging to the Ethereum blockchain.',
      'mapping': 'Mapping types use the syntax mapping(KeyType => ValueType).',
      'address': 'The address type comes in two flavors: address and address payable.',
      'uint256': 'Unsigned integer of 256 bits.',
      'bool': 'Boolean type with values true and false.',
      'string': 'String literals are written with either double or single-quotes.',
      'require': 'Used to validate inputs and conditions before execution.',
      'assert': 'Used to check for internal errors and invariants.',
      'revert': 'Used to flag an error and revert the current call.'
    }

    return hoverData[word] || null
  }

  // Get color for issue type
  const getIssueColor = (type: string): string => {
    switch (type) {
      case 'error': return '#ff0000'
      case 'warning': return '#ff8800'
      case 'info': return '#0088ff'
      case 'suggestion': return '#00ff88'
      default: return '#888888'
    }
  }

  // Handle file operations
  const handleSave = () => {
    if (onSave && editorRef.current) {
      onSave(editorRef.current.getValue())
      toast.success('Contract saved successfully')
    }
  }

  const handleDownload = () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue()
      const blob = new Blob([code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'contract.sol'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Contract downloaded')
    }
  }

  const handleCopy = () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue()
      navigator.clipboard.writeText(code)
      toast.success('Contract copied to clipboard')
    }
  }

  const handleAnalyze = () => {
    if (onAnalyze && editorRef.current) {
      onAnalyze(editorRef.current.getValue())
    }
  }

  // Render issue summary
  const renderIssueSummary = () => {
    const errorCount = issues.filter(i => i.type === 'error').length
    const warningCount = issues.filter(i => i.type === 'warning').length
    const infoCount = issues.filter(i => i.type === 'info').length
    const suggestionCount = issues.filter(i => i.type === 'suggestion').length

    return (
      <div className="flex items-center gap-4 text-sm">
        {errorCount > 0 && (
          <div className="flex items-center gap-1 text-red-600">
            <Bug className="h-4 w-4" />
            <span>{errorCount}</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{warningCount}</span>
          </div>
        )}
        {infoCount > 0 && (
          <div className="flex items-center gap-1 text-blue-600">
            <Info className="h-4 w-4" />
            <span>{infoCount}</span>
          </div>
        )}
        {suggestionCount > 0 && (
          <div className="flex items-center gap-1 text-green-600">
            <Lightbulb className="h-4 w-4" />
            <span>{suggestionCount}</span>
          </div>
        )}
        {issues.length === 0 && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>No issues</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="font-medium">Smart Contract Editor</span>
          </div>
          
          {renderIssueSummary()}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAnalyze}>
            <Shield className="h-4 w-4 mr-1" />
            Analyze
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <Card className={cn(isFullscreen && 'fixed inset-0 z-50')}>
        <CardContent className="p-0">
          <Editor
            height={isFullscreen ? '100vh' : '600px'}
            language="solidity"
            value={value}
            onChange={(newValue) => onChange(newValue || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: editorSettings.fontSize,
              tabSize: editorSettings.tabSize,
              wordWrap: editorSettings.wordWrap,
              minimap: { enabled: editorSettings.minimap },
              lineNumbers: editorSettings.lineNumbers,
              folding: editorSettings.folding,
              readOnly,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              renderControlCharacters: true,
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              wordBasedSuggestions: 'matchingDocuments',
              parameterHints: { enabled: true },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoSurround: 'languageDefined',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              },
              lightbulb: { enabled: true },
              codeActionsOnSave: {
                'source.fixAll': true
              }
            }}
            theme={editorSettings.theme}
          />
        </CardContent>
      </Card>

      {/* Issues Panel */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Issues ({issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      'p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50',
                      issue.type === 'error' && 'border-l-red-500 bg-red-50',
                      issue.type === 'warning' && 'border-l-yellow-500 bg-yellow-50',
                      issue.type === 'info' && 'border-l-blue-500 bg-blue-50',
                      issue.type === 'suggestion' && 'border-l-green-500 bg-green-50'
                    )}
                    onClick={() => {
                      if (editorRef.current) {
                        editorRef.current.setPosition({ lineNumber: issue.line, column: issue.column })
                        editorRef.current.focus()
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Line {issue.line}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {issue.source}
                          </Badge>
                          <Badge 
                            variant={issue.severity === 'critical' ? 'destructive' : 'outline'} 
                            className="text-xs"
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{issue.message}</p>
                      </div>
                      
                      {issue.quickFix && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Apply quick fix
                            if (editorRef.current && issue.quickFix) {
                              const model = editorRef.current.getModel()
                              if (model) {
                                const edits = issue.quickFix.edits.map(edit => ({
                                  range: edit.range,
                                  text: edit.text
                                }))
                                model.pushEditOperations([], edits, () => null)
                              }
                            }
                          }}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Fix
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdvancedCodeEditor
