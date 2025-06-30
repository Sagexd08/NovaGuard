'use client'

import * as React from 'react'
import { DialogProps } from '@radix-ui/react-dialog'
import { Command as CommandPrimitive } from 'cmdk'
import { Search, FileText, Settings, Zap, Code, Terminal, Palette, Package } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface CommandPaletteProps extends DialogProps {
  onCommand?: (command: string) => void
}

interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  category: string
  keywords?: string[]
  action: () => void
  shortcut?: string
}

const commandCategories = {
  files: { label: 'Files', icon: <FileText className="w-4 h-4" /> },
  editor: { label: 'Editor', icon: <Code className="w-4 h-4" /> },
  blockchain: { label: 'Blockchain', icon: <Zap className="w-4 h-4" /> },
  terminal: { label: 'Terminal', icon: <Terminal className="w-4 h-4" /> },
  settings: { label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  themes: { label: 'Themes', icon: <Palette className="w-4 h-4" /> },
  plugins: { label: 'Plugins', icon: <Package className="w-4 h-4" /> },
}

export function CommandPalette({ onCommand, ...props }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [pages, setPages] = React.useState<string[]>(['home'])
  const page = pages[pages.length - 1]

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const commands: CommandItem[] = [
    // File commands
    {
      id: 'new-file',
      title: 'New File',
      description: 'Create a new file',
      icon: <FileText className="w-4 h-4" />,
      category: 'files',
      keywords: ['create', 'new', 'file'],
      action: () => console.log('New file'),
      shortcut: '⌘N'
    },
    {
      id: 'open-file',
      title: 'Open File',
      description: 'Open an existing file',
      icon: <FileText className="w-4 h-4" />,
      category: 'files',
      keywords: ['open', 'file'],
      action: () => console.log('Open file'),
      shortcut: '⌘O'
    },
    {
      id: 'save-file',
      title: 'Save File',
      description: 'Save the current file',
      icon: <FileText className="w-4 h-4" />,
      category: 'files',
      keywords: ['save', 'file'],
      action: () => console.log('Save file'),
      shortcut: '⌘S'
    },

    // Editor commands
    {
      id: 'format-code',
      title: 'Format Code',
      description: 'Format the current document',
      icon: <Code className="w-4 h-4" />,
      category: 'editor',
      keywords: ['format', 'prettier', 'code'],
      action: () => console.log('Format code'),
      shortcut: '⇧⌥F'
    },
    {
      id: 'toggle-comment',
      title: 'Toggle Comment',
      description: 'Comment/uncomment selected lines',
      icon: <Code className="w-4 h-4" />,
      category: 'editor',
      keywords: ['comment', 'toggle'],
      action: () => console.log('Toggle comment'),
      shortcut: '⌘/'
    },
    {
      id: 'find-replace',
      title: 'Find and Replace',
      description: 'Find and replace text',
      icon: <Search className="w-4 h-4" />,
      category: 'editor',
      keywords: ['find', 'replace', 'search'],
      action: () => console.log('Find and replace'),
      shortcut: '⌘F'
    },

    // Blockchain commands
    {
      id: 'compile-contract',
      title: 'Compile Contract',
      description: 'Compile the current smart contract',
      icon: <Zap className="w-4 h-4" />,
      category: 'blockchain',
      keywords: ['compile', 'build', 'contract'],
      action: () => console.log('Compile contract'),
      shortcut: '⌘B'
    },
    {
      id: 'deploy-contract',
      title: 'Deploy Contract',
      description: 'Deploy contract to blockchain',
      icon: <Zap className="w-4 h-4" />,
      category: 'blockchain',
      keywords: ['deploy', 'contract', 'blockchain'],
      action: () => console.log('Deploy contract'),
      shortcut: '⌘D'
    },
    {
      id: 'analyze-security',
      title: 'Analyze Security',
      description: 'Run security analysis on contract',
      icon: <Zap className="w-4 h-4" />,
      category: 'blockchain',
      keywords: ['security', 'analyze', 'audit'],
      action: () => console.log('Analyze security'),
      shortcut: '⌘A'
    },
    {
      id: 'switch-network',
      title: 'Switch Network',
      description: 'Change blockchain network',
      icon: <Zap className="w-4 h-4" />,
      category: 'blockchain',
      keywords: ['network', 'switch', 'blockchain'],
      action: () => setPages([...pages, 'networks']),
    },

    // Terminal commands
    {
      id: 'new-terminal',
      title: 'New Terminal',
      description: 'Open a new terminal',
      icon: <Terminal className="w-4 h-4" />,
      category: 'terminal',
      keywords: ['terminal', 'console', 'shell'],
      action: () => console.log('New terminal'),
      shortcut: '⌃`'
    },
    {
      id: 'clear-terminal',
      title: 'Clear Terminal',
      description: 'Clear the terminal output',
      icon: <Terminal className="w-4 h-4" />,
      category: 'terminal',
      keywords: ['clear', 'terminal'],
      action: () => console.log('Clear terminal'),
    },

    // Settings commands
    {
      id: 'open-settings',
      title: 'Open Settings',
      description: 'Open application settings',
      icon: <Settings className="w-4 h-4" />,
      category: 'settings',
      keywords: ['settings', 'preferences', 'config'],
      action: () => console.log('Open settings'),
      shortcut: '⌘,'
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark theme',
      icon: <Palette className="w-4 h-4" />,
      category: 'themes',
      keywords: ['theme', 'dark', 'light'],
      action: () => console.log('Toggle theme'),
      shortcut: '⌘T'
    },

    // Plugin commands
    {
      id: 'install-plugin',
      title: 'Install Plugin',
      description: 'Browse and install plugins',
      icon: <Package className="w-4 h-4" />,
      category: 'plugins',
      keywords: ['plugin', 'install', 'extension'],
      action: () => console.log('Install plugin'),
    },
    {
      id: 'manage-plugins',
      title: 'Manage Plugins',
      description: 'Manage installed plugins',
      icon: <Package className="w-4 h-4" />,
      category: 'plugins',
      keywords: ['plugin', 'manage', 'extension'],
      action: () => console.log('Manage plugins'),
    },
  ]

  const networkCommands: CommandItem[] = [
    {
      id: 'ethereum-mainnet',
      title: 'Ethereum Mainnet',
      description: 'Switch to Ethereum mainnet',
      icon: <span className="text-lg">⟠</span>,
      category: 'networks',
      action: () => console.log('Switch to Ethereum mainnet'),
    },
    {
      id: 'polygon-mainnet',
      title: 'Polygon Mainnet',
      description: 'Switch to Polygon mainnet',
      icon: <span className="text-lg">🟣</span>,
      category: 'networks',
      action: () => console.log('Switch to Polygon mainnet'),
    },
    {
      id: 'arbitrum-one',
      title: 'Arbitrum One',
      description: 'Switch to Arbitrum One',
      icon: <span className="text-lg">🔵</span>,
      category: 'networks',
      action: () => console.log('Switch to Arbitrum One'),
    },
    {
      id: 'optimism-mainnet',
      title: 'Optimism Mainnet',
      description: 'Switch to Optimism mainnet',
      icon: <span className="text-lg">🔴</span>,
      category: 'networks',
      action: () => console.log('Switch to Optimism mainnet'),
    },
  ]

  const filteredCommands = React.useMemo(() => {
    const currentCommands = page === 'networks' ? networkCommands : commands
    
    if (!search) return currentCommands

    return currentCommands.filter((command) => {
      const searchLower = search.toLowerCase()
      return (
        command.title.toLowerCase().includes(searchLower) ||
        command.description?.toLowerCase().includes(searchLower) ||
        command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
      )
    })
  }, [search, page, commands, networkCommands])

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    
    filteredCommands.forEach((command) => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })
    
    return groups
  }, [filteredCommands])

  const runCommand = React.useCallback((command: CommandItem) => {
    setOpen(false)
    setSearch('')
    setPages(['home'])
    command.action()
    onCommand?.(command.id)
  }, [onCommand])

  return (
    <Dialog open={open} onOpenChange={setOpen} {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <CommandPrimitive className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder={page === 'networks' ? 'Search networks...' : 'Type a command or search...'}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {pages.length > 1 && (
              <button
                onClick={() => setPages(pages.slice(0, -1))}
                className="ml-2 rounded-sm px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                Back
              </button>
            )}
          </div>
          <CommandPrimitive.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandPrimitive.Empty className="py-6 text-center text-sm">
              No results found.
            </CommandPrimitive.Empty>
            
            {Object.entries(groupedCommands).map(([category, items]) => (
              <CommandPrimitive.Group key={category} heading={commandCategories[category as keyof typeof commandCategories]?.label || category}>
                {items.map((command) => (
                  <CommandPrimitive.Item
                    key={command.id}
                    value={command.title}
                    onSelect={() => runCommand(command)}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {command.icon}
                      <div className="flex flex-col">
                        <span className="font-medium">{command.title}</span>
                        {command.description && (
                          <span className="text-xs text-muted-foreground">
                            {command.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {command.shortcut && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {command.shortcut}
                      </Badge>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ))}
          </CommandPrimitive.List>
          
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Press <Badge variant="outline" className="px-1 py-0 text-xs">⌘K</Badge> to open</span>
              <span>Press <Badge variant="outline" className="px-1 py-0 text-xs">↵</Badge> to select</span>
            </div>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  )
}

// Hook to use command palette
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false)

  const toggle = React.useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const close = React.useCallback(() => {
    setOpen(false)
  }, [])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle])

  return { open, setOpen, toggle, close }
}
