'use client'

// =============================================
// NOVAGUARD MONITORING DASHBOARD
// Real-time contract monitoring interface
// =============================================

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Plus, 
  Settings, 
  Bell, 
  BellOff,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  DollarSign,
  Users,
  Pause,
  Play
} from 'lucide-react'
import { SUPPORTED_CHAINS, type ChainName } from '@/lib/deployment/multi-chain-deployer'
import ContractMonitor, { type AlertType, type ContractAlert } from '@/lib/monitoring/contract-monitor'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface MonitoringDashboardProps {
  className?: string
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const { user } = useUser()
  const [monitor] = useState(() => new ContractMonitor())
  
  // State
  const [monitoredContracts, setMonitoredContracts] = useState<any[]>([])
  const [alerts, setAlerts] = useState<ContractAlert[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<string | null>(null)
  
  // Add contract form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContract, setNewContract] = useState({
    address: '',
    chain: 'ethereum' as ChainName,
    name: ''
  })

  // Load data
  useEffect(() => {
    if (user) {
      loadData()
      
      // Set up real-time updates
      const interval = setInterval(loadAlerts, 30000) // Refresh alerts every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadContracts(),
        loadAlerts(),
        loadStats()
      ])
    } catch (error) {
      console.error('Failed to load monitoring data:', error)
      toast.error('Failed to load monitoring data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadContracts = async () => {
    try {
      const response = await fetch('/api/monitoring/contracts')
      const data = await response.json()
      setMonitoredContracts(data.contracts || [])
    } catch (error) {
      console.error('Failed to load contracts:', error)
    }
  }

  const loadAlerts = async () => {
    try {
      const contractId = selectedContract || 'all'
      const response = await fetch(`/api/monitoring/alerts?contract=${contractId}`)
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/monitoring/stats')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  // Add new contract
  const addContract = async () => {
    if (!newContract.address || !newContract.name || !user) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/monitoring/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: newContract.address,
          chain: newContract.chain,
          name: newContract.name,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add contract')
      }

      toast.success('Contract added successfully')
      setShowAddForm(false)
      setNewContract({ address: '', chain: 'ethereum', name: '' })
      loadContracts()
    } catch (error) {
      toast.error('Failed to add contract')
    }
  }

  // Toggle contract monitoring
  const toggleMonitoring = async (contractId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/monitoring/contracts/${contractId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle monitoring')
      }

      toast.success(`Monitoring ${isActive ? 'started' : 'stopped'}`)
      loadContracts()
    } catch (error) {
      toast.error('Failed to toggle monitoring')
    }
  }

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert')
      }

      toast.success('Alert acknowledged')
      loadAlerts()
    } catch (error) {
      toast.error('Failed to acknowledge alert')
    }
  }

  // Get alert severity color
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Get alert type icon
  const getAlertTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'large_transaction': return <DollarSign className="h-4 w-4" />
      case 'unusual_activity': return <Activity className="h-4 w-4" />
      case 'security_breach': return <Shield className="h-4 w-4" />
      case 'gas_spike': return <Zap className="h-4 w-4" />
      case 'ownership_change': return <Users className="h-4 w-4" />
      case 'upgrade_detected': return <TrendingUp className="h-4 w-4" />
      case 'pause_unpause': return <Pause className="h-4 w-4" />
      case 'emergency_stop': return <AlertTriangle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  // Get chain icon
  const getChainIcon = (chain: ChainName) => {
    const icons: Record<ChainName, string> = {
      ethereum: '⟠',
      sepolia: '⟠',
      polygon: '⬟',
      arbitrum: '🔵',
      optimism: '🔴',
      base: '🔷',
      bsc: '🟡',
      zksync: '⚡'
    }
    return icons[chain] || '🔗'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contract Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and alerts for your smart contracts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeContracts} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.unacknowledgedAlerts} unacknowledged
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.alertsByType?.security_breach || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeContracts > 0 ? 'Active' : 'Inactive'}
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time monitoring
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contracts">Monitored Contracts</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts ({alerts.filter(a => !a.acknowledged).length})
          </TabsTrigger>
          <TabsTrigger value="rules">Monitoring Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {/* Add Contract Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Contract</CardTitle>
                <CardDescription>
                  Add a smart contract to monitor for security events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contract-address">Contract Address</Label>
                    <Input
                      id="contract-address"
                      placeholder="0x..."
                      value={newContract.address}
                      onChange={(e) => setNewContract(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contract-chain">Blockchain</Label>
                    <Select 
                      value={newContract.chain} 
                      onValueChange={(value: ChainName) => setNewContract(prev => ({ ...prev, chain: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{getChainIcon(key as ChainName)}</span>
                              <span>{chain.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contract-name">Contract Name</Label>
                  <Input
                    id="contract-name"
                    placeholder="My Contract"
                    value={newContract.name}
                    onChange={(e) => setNewContract(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={addContract}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contract
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contracts List */}
          <div className="space-y-4">
            {monitoredContracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>{getChainIcon(contract.chain)}</span>
                        <CardTitle className="text-lg">{contract.name}</CardTitle>
                        <Badge variant={contract.isActive ? 'default' : 'secondary'}>
                          {contract.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>
                        {contract.contractAddress} • {SUPPORTED_CHAINS[contract.chain as ChainName]?.name}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMonitoring(contract.id, !contract.isActive)}
                      >
                        {contract.isActive ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(
                          `${SUPPORTED_CHAINS[contract.chain as ChainName]?.explorerUrl}/address/${contract.contractAddress}`,
                          '_blank'
                        )}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Last Checked</p>
                      <p>{new Date(contract.lastChecked).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monitoring Rules</p>
                      <p>{contract.monitoringRules?.length || 0} active</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recent Alerts</p>
                      <p>{alerts.filter(a => a.contractId === contract.id).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {monitoredContracts.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No contracts monitored</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first smart contract to start monitoring
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contract
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedContract || 'all'} onValueChange={setSelectedContract}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by contract" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                {monitoredContracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className={cn(
                  'transition-colors',
                  !alert.acknowledged && 'border-l-4 border-l-orange-500'
                )}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getAlertTypeIcon(alert.alertType)}
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge className={getAlertSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {!alert.acknowledged && (
                            <Badge variant="outline">Unacknowledged</Badge>
                          )}
                        </div>
                        <CardDescription>
                          {alert.description}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        
                        {alert.transactionHash && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const contract = monitoredContracts.find(c => c.id === alert.contractId)
                              if (contract) {
                                window.open(
                                  `${SUPPORTED_CHAINS[contract.chain as ChainName]?.explorerUrl}/tx/${alert.transactionHash}`,
                                  '_blank'
                                )
                              }
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {alert.timestamp.toLocaleString()}
                      </span>
                      {alert.transactionHash && (
                        <span>
                          Tx: {alert.transactionHash.slice(0, 10)}...
                        </span>
                      )}
                      {alert.blockNumber && (
                        <span>Block: {alert.blockNumber}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {alerts.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No alerts</h3>
                    <p className="text-muted-foreground">
                      Your contracts are running smoothly
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Monitoring Rules</h3>
              <p className="text-muted-foreground">
                Configure custom monitoring rules and alerts
              </p>
              <Button className="mt-4" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MonitoringDashboard
