'use client'

import React, { useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  Home, 
  Code, 
  Shield, 
  Zap, 
  Settings, 
  User, 
  Bell, 
  Search,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  CreditCard,
  HelpCircle,
  FileText,
  BarChart3,
  Users,
  Rocket,
  Github,
  Twitter,
  Discord
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Audit', href: '/audit', icon: Code },
  { name: 'Deploy', href: '/deploy', icon: Rocket },
  { name: 'Monitor', href: '/monitor', icon: Shield },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { 
    name: 'Collaborate', 
    href: '/collaborate', 
    icon: Users,
    children: [
      { name: 'Active Sessions', href: '/collaborate/sessions', icon: Users },
      { name: 'Team Management', href: '/collaborate/teams', icon: Settings },
    ]
  },
  { name: 'Documentation', href: '/docs', icon: FileText },
]

export function MainLayout({ children, className }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen)
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-nova-blue-600 to-nova-green-600" />
              <span className="text-xl font-bold gradient-text">NovaGuard</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <div key={item.name}>
                <a
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="secondary" size="sm" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </a>
                {item.children && (
                  <div className="ml-6 space-y-1">
                    {item.children.map((child) => (
                      <a
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        {child.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-center space-x-4">
              <a
                href="https://github.com/novaguard"
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/novaguard"
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://discord.gg/novaguard"
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Discord className="h-5 w-5" />
              </a>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              v1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search contracts, vulnerabilities..."
                  className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-nova-red-600 text-xs" />
              </Button>

              {/* User menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-nova-blue-600 to-nova-green-600 flex items-center justify-center text-white text-sm font-medium">
                    JD
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {userMenuOpen && (
                  <Card className="absolute right-0 mt-2 w-56 origin-top-right">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">john@example.com</p>
                        <Badge variant="gradient" size="sm" className="mt-1">
                          Pro Plan
                        </Badge>
                      </div>
                      
                      <div className="py-1">
                        <a
                          href="/profile"
                          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </a>
                        <a
                          href="/billing"
                          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <CreditCard className="mr-3 h-4 w-4" />
                          Billing
                        </a>
                        <a
                          href="/settings"
                          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <Settings className="mr-3 h-4 w-4" />
                          Settings
                        </a>
                        <a
                          href="/help"
                          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <HelpCircle className="mr-3 h-4 w-4" />
                          Help & Support
                        </a>
                      </div>
                      
                      <div className="border-t pt-1">
                        <button
                          className="flex w-full items-center px-3 py-2 text-sm rounded-md hover:bg-accent text-nova-red-600"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={cn("flex-1", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}
