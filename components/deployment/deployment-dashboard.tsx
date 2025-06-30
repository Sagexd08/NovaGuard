'use client'

// =============================================
// NOVAGUARD DEPLOYMENT DASHBOARD
// Multi-chain contract deployment interface
// =============================================

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Rocket, 
  Settings, 
  History, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Zap,
  Shield,
  Eye,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { SUPPORTED_CHAINS, type ChainName, MultiChainDeployer } from '@/lib/deployment/multi-chain-deployer'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface DeploymentDashboardProps {
  contractCode: string
  contractId: string
  onDeploymentComplete?: (result: any) => void
}

export function DeploymentDashboard({
  contractCode,
  contractId,
  onDeploymentComplete
}: DeploymentDashboardProps) {
  
  const { user } = useUser()
  const [deployer] = useState(() => new MultiChainDeployer())
  
  // Deployment configuration state
  const [selectedChain, setSelectedChain] = useState<ChainName>('sepolia')
  const [constructorArgs, setConstructorArgs] = useState<string>('')
  const [compilerVersion, setCompilerVersion] = useState('0.8.19')
  const [optimizationEnabled, setOptimizationEnabled] = useState(true)
  const [optimizationRuns, setOptimizationRuns] = useState(200)
  const [verifyContract, setVerifyContract] = useState(true)
  const [deploymentNotes, setDeploymentNotes] = useState('')
  
  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentProgress, setDeploymentProgress] = useState(0)
  const [deploymentStatus, setDeploymentStatus] = useState<string>('')
  const [gasEstimate, setGasEstimate] = useState<any>(null)
  const [deploymentHistory, setDeploymentHistory] = useState<any[]>([])
  const [userCredits, setUserCredits] = useState(0)
  
  // Load user credits and deployment history
  useEffect(() => {
    if (user) {
      loadUserData()
      loadDeploymentHistory()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/user/credits')
      const data = await response.json()
      setUserCredits(data.credits || 0)
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const loadDeploymentHistory = async () => {
    try {
      const response = await fetch('/api/deployments/history')
      const data = await response.json()
      setDeploymentHistory(data.deployments || [])
    } catch (error) {
      console.error('Failed to load deployment history:', error)
    }
  }

  // Estimate gas costs
  const estimateGas = async () => {
    if (!contractCode || !user) return

    try {
      const args = constructorArgs ? JSON.parse(`[${constructorArgs}]`) : []
      
      const response = await fetch('/api/deployments/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractCode,
          chain: selectedChain,
          constructorArgs: args,
          compilerVersion,
          optimizationEnabled,
          optimizationRuns
        })
      })

      const estimate = await response.json()
      setGasEstimate(estimate)
    } catch (error) {
      console.error('Gas estimation failed:', error)
      toast.error('Failed to estimate gas costs')
    }
  }

  // Deploy contract
  const deployContract = async () => {
    if (!contractCode || !user) {
      toast.error('Contract code and authentication required')
      return
    }

    setIsDeploying(true)
    setDeploymentProgress(0)
    setDeploymentStatus('Preparing deployment...')

    try {
      const args = constructorArgs ? JSON.parse(`[${constructorArgs}]`) : []
      
      setDeploymentProgress(20)
      setDeploymentStatus('Compiling contract...')

      const response = await fetch('/api/deployments/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractCode,
          chain: selectedChain,
          constructorArgs: args,
          compilerVersion,
          optimizationEnabled,
          optimizationRuns,
          verifyContract,
          deploymentNotes
        })
      })

      if (!response.ok) {
        throw new Error('Deployment failed')
      }

      setDeploymentProgress(60)
      setDeploymentStatus('Deploying to blockchain...')

      const result = await response.json()

      setDeploymentProgress(80)
      setDeploymentStatus('Confirming transaction...')

      // Poll for deployment completion
      await pollDeploymentStatus(result.deploymentId)

      setDeploymentProgress(100)
      setDeploymentStatus('Deployment completed!')

      toast.success('Contract deployed successfully!')
      onDeploymentComplete?.(result)
      
      // Refresh data
      loadUserData()
      loadDeploymentHistory()

    } catch (error) {
      console.error('Deployment failed:', error)
      toast.error('Deployment failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setDeploymentStatus('Deployment failed')
    } finally {
      setIsDeploying(false)
      setTimeout(() => {
        setDeploymentProgress(0)
        setDeploymentStatus('')
      }, 3000)
    }
  }

  // Poll deployment status
  const pollDeploymentStatus = async (deploymentId: string) => {
    const maxAttempts = 30
    const delay = 2000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/deployments/status/${deploymentId}`)
        const status = await response.json()

        if (status.status === 'deployed') {
          return status
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Deployment failed')
        }

        await new Promise(resolve => setTimeout(resolve, delay))
      } catch (error) {
        if (attempt === maxAttempts - 1) throw error
      }
    }

    throw new Error('Deployment timeout')
  }

  // Parse constructor arguments
  const parseConstructorArgs = (argsString: string) => {
    try {
      return JSON.parse(`[${argsString}]`)
    } catch {
      return []
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'text-green-600 bg-green-50'
      case 'deploying': return 'text-blue-600 bg-blue-50'
      case 'failed': return 'text-red-600 bg-red-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contract Deployment</h2>
          <p className="text-muted-foreground">
            Deploy your smart contract across multiple blockchain networks
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Available Credits</p>
            <p className="text-lg font-semibold">{userCredits}</p>
          </div>
          <Button variant="outline" onClick={loadUserData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deploy">Deploy Contract</TabsTrigger>
          <TabsTrigger value="history">Deployment History</TabsTrigger>
          <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Deployment Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Deployment Configuration
                </CardTitle>
                <CardDescription>
                  Configure your contract deployment settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chain Selection */}
                <div className="space-y-2">
                  <Label htmlFor="chain">Target Blockchain</Label>
                  <Select value={selectedChain} onValueChange={(value: ChainName) => setSelectedChain(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blockchain" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{getChainIcon(key as ChainName)}</span>
                            <span>{chain.name}</span>
                            <Badge variant="outline" className="ml-auto">
                              {chain.currency}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Constructor Arguments */}
                <div className="space-y-2">
                  <Label htmlFor="constructor-args">Constructor Arguments</Label>
                  <Textarea
                    id="constructor-args"
                    placeholder='e.g., "MyToken", "MTK", 18, 1000000'
                    value={constructorArgs}
                    onChange={(e) => setConstructorArgs(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated values. Use quotes for strings.
                  </p>
                </div>

                {/* Compiler Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="compiler-version">Compiler Version</Label>
                    <Select value={compilerVersion} onValueChange={setCompilerVersion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.8.19">0.8.19</SelectItem>
                        <SelectItem value="0.8.18">0.8.18</SelectItem>
                        <SelectItem value="0.8.17">0.8.17</SelectItem>
                        <SelectItem value="0.8.16">0.8.16</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="optimization-runs">Optimization Runs</Label>
                    <Input
                      id="optimization-runs"
                      type="number"
                      value={optimizationRuns}
                      onChange={(e) => setOptimizationRuns(parseInt(e.target.value) || 200)}
                      min={1}
                      max={10000}
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Optimization</Label>
                      <p className="text-xs text-muted-foreground">
                        Optimize contract for lower gas costs
                      </p>
                    </div>
                    <Switch
                      checked={optimizationEnabled}
                      onCheckedChange={setOptimizationEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Verify Contract</Label>
                      <p className="text-xs text-muted-foreground">
                        Verify source code on block explorer
                      </p>
                    </div>
                    <Switch
                      checked={verifyContract}
                      onCheckedChange={setVerifyContract}
                    />
                  </div>
                </div>

                {/* Deployment Notes */}
                <div className="space-y-2">
                  <Label htmlFor="deployment-notes">Deployment Notes (Optional)</Label>
                  <Textarea
                    id="deployment-notes"
                    placeholder="Add notes about this deployment..."
                    value={deploymentNotes}
                    onChange={(e) => setDeploymentNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={estimateGas}
                    variant="outline"
                    disabled={!contractCode || isDeploying}
                    className="flex-1"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Estimate Gas
                  </Button>
                  
                  <Button
                    onClick={deployContract}
                    disabled={!contractCode || isDeploying || userCredits < 1}
                    className="flex-1"
                  >
                    {isDeploying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4 mr-2" />
                        Deploy Contract
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Deployment Status & Gas Estimate */}
            <div className="space-y-4">
              {/* Gas Estimate */}
              {gasEstimate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Gas Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Gas Limit</p>
                        <p className="text-lg font-semibold">{gasEstimate.gasLimit?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gas Price</p>
                        <p className="text-lg font-semibold">{gasEstimate.gasPrice} gwei</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Cost</p>
                        <p className="text-lg font-semibold">
                          {gasEstimate.deploymentCost} {SUPPORTED_CHAINS[selectedChain].currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Required Credits</p>
                        <p className="text-lg font-semibold">{gasEstimate.requiredCredits}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deployment Progress */}
              {isDeploying && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Deployment Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{deploymentStatus}</span>
                        <span>{deploymentProgress}%</span>
                      </div>
                      <Progress value={deploymentProgress} className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chain Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{getChainIcon(selectedChain)}</span>
                    {SUPPORTED_CHAINS[selectedChain].name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Chain ID</span>
                    <span>{SUPPORTED_CHAINS[selectedChain].chainId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Currency</span>
                    <span>{SUPPORTED_CHAINS[selectedChain].currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Confirmations</span>
                    <span>{SUPPORTED_CHAINS[selectedChain].confirmations}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(SUPPORTED_CHAINS[selectedChain].explorerUrl, '_blank')}
                    className="w-full mt-2"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Explorer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Deployment History
              </CardTitle>
              <CardDescription>
                Your recent contract deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {deploymentHistory.map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span>{getChainIcon(deployment.chain)}</span>
                          <span className="font-medium">{SUPPORTED_CHAINS[deployment.chain as ChainName]?.name}</span>
                          <Badge className={getStatusColor(deployment.status)}>
                            {deployment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(deployment.created_at).toLocaleString()}
                        </p>
                        {deployment.contract_address && (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {deployment.contract_address}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(deployment.contract_address)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {deployment.contract_address && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(
                              `${SUPPORTED_CHAINS[deployment.chain as ChainName]?.explorerUrl}/address/${deployment.contract_address}`,
                              '_blank'
                            )}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {deploymentHistory.length === 0 && (
                    <div className="text-center py-8">
                      <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No deployments yet</h3>
                      <p className="text-muted-foreground">
                        Deploy your first contract to see it here
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Advanced deployment configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custom Gas Limit</Label>
                  <Input placeholder="Auto-estimated" />
                </div>
                <div className="space-y-2">
                  <Label>Custom Gas Price (gwei)</Label>
                  <Input placeholder="Auto-estimated" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Contract Value (ETH)</Label>
                <Input placeholder="0" />
                <p className="text-xs text-muted-foreground">
                  Amount of ETH to send with deployment (for payable constructors)
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">CREATE2 Deployment</h4>
                <div className="space-y-2">
                  <Label>Salt (for deterministic addresses)</Label>
                  <Input placeholder="Optional salt value" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use CREATE2</Label>
                    <p className="text-xs text-muted-foreground">
                      Deploy with deterministic address
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DeploymentDashboard
