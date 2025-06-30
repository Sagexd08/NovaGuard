'use client'

import * as React from 'react'
import { Editor, Monaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { 
  Play, 
  Square, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Maximize2, 
  Minimize2,
  Copy,
  Search,
  Replace,
  RotateCcw,
  RotateCw,
  Zap,
  Shield,
  Bug,
  FileText,
  Palette
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  value?: string
  onChange?: (value: string | undefined) => void
  language?: string
  theme?: string
  options?: any
  className?: string
  height?: string | number
  width?: string | number
  onMount?: (editor: any, monaco: Monaco) => void
  onCompile?: () => void
  onDeploy?: () => void
  onAnalyze?: () => void
  onFormat?: () => void
  onSave?: () => void
  readOnly?: boolean
  showMinimap?: boolean
  showLineNumbers?: boolean
  wordWrap?: boolean
  fontSize?: number
  tabSize?: number
  insertSpaces?: boolean
  autoClosingBrackets?: boolean
  autoClosingQuotes?: boolean
  autoIndent?: boolean
  folding?: boolean
  renderWhitespace?: boolean
  rulers?: number[]
  cursorBlinking?: string
  cursorStyle?: string
  lineHeight?: number
  letterSpacing?: number
  scrollBeyondLastLine?: boolean
  smoothScrolling?: boolean
  mouseWheelZoom?: boolean
  contextmenu?: boolean
  quickSuggestions?: boolean
  parameterHints?: boolean
  autoComplete?: boolean
  bracketMatching?: boolean
  colorDecorators?: boolean
  codeLens?: boolean
  links?: boolean
  hover?: boolean
  find?: boolean
  gotoLine?: boolean
  multiCursorModifier?: string
  accessibilitySupport?: string
}

interface EditorAction {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  shortcut?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export function CodeEditor({
  value = '',
  onChange,
  language = 'solidity',
  theme,
  options = {},
  className,
  height = '100%',
  width = '100%',
  onMount,
  onCompile,
  onDeploy,
  onAnalyze,
  onFormat,
  onSave,
  readOnly = false,
  showMinimap = true,
  showLineNumbers = true,
  wordWrap = true,
  fontSize = 14,
  tabSize = 2,
  insertSpaces = true,
  autoClosingBrackets = true,
  autoClosingQuotes = true,
  autoIndent = true,
  folding = true,
  renderWhitespace = false,
  rulers = [],
  cursorBlinking = 'blink',
  cursorStyle = 'line',
  lineHeight = 1.5,
  letterSpacing = 0,
  scrollBeyondLastLine = true,
  smoothScrolling = true,
  mouseWheelZoom = true,
  contextmenu = true,
  quickSuggestions = true,
  parameterHints = true,
  autoComplete = true,
  bracketMatching = true,
  colorDecorators = true,
  codeLens = true,
  links = true,
  hover = true,
  find = true,
  gotoLine = true,
  multiCursorModifier = 'alt',
  accessibilitySupport = 'auto',
}: CodeEditorProps) {
  const { theme: systemTheme } = useTheme()
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [editorInstance, setEditorInstance] = React.useState<any>(null)
  const [monacoInstance, setMonacoInstance] = React.useState<Monaco | null>(null)
  const [activeTab, setActiveTab] = React.useState('editor')

  const editorTheme = theme || (systemTheme === 'dark' ? 'vs-dark' : 'light')

  const editorOptions = React.useMemo(() => ({
    readOnly,
    minimap: { enabled: showMinimap },
    lineNumbers: showLineNumbers ? 'on' : 'off',
    wordWrap: wordWrap ? 'on' : 'off',
    fontSize,
    tabSize,
    insertSpaces,
    autoClosingBrackets: autoClosingBrackets ? 'always' : 'never',
    autoClosingQuotes: autoClosingQuotes ? 'always' : 'never',
    autoIndent: autoIndent ? 'advanced' : 'none',
    folding,
    renderWhitespace: renderWhitespace ? 'all' : 'none',
    rulers,
    cursorBlinking,
    cursorStyle,
    lineHeight,
    letterSpacing,
    scrollBeyondLastLine,
    smoothScrolling,
    mouseWheelZoom,
    contextmenu,
    quickSuggestions,
    parameterHints: { enabled: parameterHints },
    suggestOnTriggerCharacters: autoComplete,
    matchBrackets: bracketMatching ? 'always' : 'never',
    colorDecorators,
    codeLens,
    links,
    hover: { enabled: hover },
    find: { addExtraSpaceOnTop: find },
    gotoLine: { enabled: gotoLine },
    multiCursorModifier,
    accessibilitySupport,
    automaticLayout: true,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: true,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    ...options,
  }), [
    readOnly, showMinimap, showLineNumbers, wordWrap, fontSize, tabSize,
    insertSpaces, autoClosingBrackets, autoClosingQuotes, autoIndent,
    folding, renderWhitespace, rulers, cursorBlinking, cursorStyle,
    lineHeight, letterSpacing, scrollBeyondLastLine, smoothScrolling,
    mouseWheelZoom, contextmenu, quickSuggestions, parameterHints,
    autoComplete, bracketMatching, colorDecorators, codeLens, links,
    hover, find, gotoLine, multiCursorModifier, accessibilitySupport, options
  ])

  const handleEditorDidMount = React.useCallback((editor: any, monaco: Monaco) => {
    setEditorInstance(editor)
    setMonacoInstance(monaco)
    
    // Register custom themes
    monaco.editor.defineTheme('novaguard-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#0D1117',
        'editor.foreground': '#C9D1D9',
        'editorLineNumber.foreground': '#484F58',
        'editorLineNumber.activeForeground': '#C9D1D9',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      }
    })

    // Register Solidity language if not already registered
    if (!monaco.languages.getLanguages().some(lang => lang.id === 'solidity')) {
      monaco.languages.register({ id: 'solidity' })
      monaco.languages.setMonarchTokensProvider('solidity', {
        tokenizer: {
          root: [
            [/pragma\s+solidity/, 'keyword'],
            [/contract\s+\w+/, 'type'],
            [/function\s+\w+/, 'function'],
            [/\b(uint|int|bool|string|address|bytes)\d*\b/, 'type'],
            [/\b(public|private|internal|external|pure|view|payable|constant)\b/, 'keyword'],
            [/\b(if|else|for|while|do|break|continue|return|throw|emit)\b/, 'keyword'],
            [/\b(true|false|null|undefined)\b/, 'keyword'],
            [/\b\d+\b/, 'number'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string'],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape.invalid'],
            [/"/, 'string', '@pop']
          ],
          comment: [
            [/[^\/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment']
          ]
        }
      })
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      onCompile?.()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      onDeploy?.()
    })

    onMount?.(editor, monaco)
  }, [onMount, onSave, onCompile, onDeploy])

  const actions: EditorAction[] = [
    {
      id: 'compile',
      label: 'Compile',
      icon: <Zap className="w-4 h-4" />,
      action: () => onCompile?.(),
      shortcut: '⌘B',
    },
    {
      id: 'deploy',
      label: 'Deploy',
      icon: <Play className="w-4 h-4" />,
      action: () => onDeploy?.(),
      shortcut: '⌘D',
    },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: <Shield className="w-4 h-4" />,
      action: () => onAnalyze?.(),
      shortcut: '⌘A',
    },
    {
      id: 'format',
      label: 'Format',
      icon: <Palette className="w-4 h-4" />,
      action: () => {
        editorInstance?.getAction('editor.action.formatDocument')?.run()
        onFormat?.()
      },
      shortcut: '⇧⌥F',
    },
    {
      id: 'save',
      label: 'Save',
      icon: <Save className="w-4 h-4" />,
      action: () => onSave?.(),
      shortcut: '⌘S',
    },
  ]

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value)
  }

  const findAndReplace = () => {
    editorInstance?.getAction('editor.action.startFindReplaceAction')?.run()
  }

  const gotoLineAction = () => {
    editorInstance?.getAction('editor.action.gotoLine')?.run()
  }

  return (
    <div className={cn(
      'flex flex-col border rounded-lg overflow-hidden bg-background',
      isFullscreen && 'fixed inset-0 z-50',
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center space-x-2">
          {/* Language badge */}
          <Badge variant="secondary" className="text-xs">
            {language.toUpperCase()}
          </Badge>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                onClick={action.action}
                className="h-8 px-2"
                title={`${action.label} ${action.shortcut ? `(${action.shortcut})` : ''}`}
              >
                {action.icon}
                <span className="ml-1 hidden sm:inline">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Editor controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={findAndReplace}
            className="h-8 px-2"
            title="Find and Replace (⌘F)"
          >
            <Search className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={gotoLineAction}
            className="h-8 px-2"
            title="Go to Line (⌃G)"
          >
            <FileText className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 px-2"
            title="Copy to Clipboard"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Editor Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log('Toggle minimap')}>
                Toggle Minimap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Toggle line numbers')}>
                Toggle Line Numbers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Toggle word wrap')}>
                Toggle Word Wrap
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log('Editor preferences')}>
                Preferences
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 px-2"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="diff">Diff</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="h-full mt-0">
            <Editor
              height={height}
              width={width}
              language={language}
              value={value}
              theme={editorTheme}
              onChange={onChange}
              onMount={handleEditorDidMount}
              options={editorOptions}
              className="h-full"
            />
          </TabsContent>

          <TabsContent value="preview" className="h-full mt-0 p-4">
            <div className="h-full border rounded bg-muted/20 flex items-center justify-center">
              <p className="text-muted-foreground">Preview not available for {language}</p>
            </div>
          </TabsContent>

          <TabsContent value="diff" className="h-full mt-0 p-4">
            <div className="h-full border rounded bg-muted/20 flex items-center justify-center">
              <p className="text-muted-foreground">Diff view</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs bg-muted/30 border-t">
        <div className="flex items-center space-x-4">
          <span>Line 1, Column 1</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{language}</span>
          <span>{value.length} characters</span>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
