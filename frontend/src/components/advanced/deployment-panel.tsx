'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Rocket, 
  Settings, 
  Zap, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw,
  Network,
  Wallet,
  Gas
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Network {
  id: string
  name: string
  chainId: number
  rpcUrl: string
  explorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  gasPrice: string
  estimatedCost: string
  deploymentTime: string
  icon: string
}

const networks: Network[] = [
  // Ethereum Ecosystem
  {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '25 gwei',
    estimatedCost: '$45.20',
    deploymentTime: '~2 min',
    icon: '🔷',
    isTestnet: false,
  },
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
    gasPrice: '20 gwei',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~1 min',
    icon: '🔷',
    isTestnet: true,
  },

  // Layer 2 Solutions
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    gasPrice: '30 gwei',
    estimatedCost: '$0.05',
    deploymentTime: '~30 sec',
    icon: '🟣',
    isTestnet: false,
  },
  {
    id: 'polygon-mumbai',
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    gasPrice: '20 gwei',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~30 sec',
    icon: '🟣',
    isTestnet: true,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.1 gwei',
    estimatedCost: '$2.10',
    deploymentTime: '~1 min',
    icon: '🔵',
    isTestnet: false,
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.1 gwei',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~1 min',
    icon: '🔵',
    isTestnet: true,
  },
  {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.001 gwei',
    estimatedCost: '$1.80',
    deploymentTime: '~1 min',
    icon: '🔴',
    isTestnet: false,
  },
  {
    id: 'optimism-sepolia',
    name: 'Optimism Sepolia',
    chainId: 11155420,
    rpcUrl: 'https://sepolia.optimism.io',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.001 gwei',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~1 min',
    icon: '🔴',
    isTestnet: true,
  },

  // Alternative Layer 1s
  {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.001 gwei',
    estimatedCost: '$1.50',
    deploymentTime: '~1 min',
    icon: '🔵',
    isTestnet: false,
  },
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.001 gwei',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~1 min',
    icon: '🔵',
    isTestnet: true,
  },
  {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    gasPrice: '25 nAVAX',
    estimatedCost: '$0.50',
    deploymentTime: '~30 sec',
    icon: '🔺',
    isTestnet: false,
  },
  {
    id: 'avalanche-fuji',
    name: 'Avalanche Fuji',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    gasPrice: '25 nAVAX',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~30 sec',
    icon: '🔺',
    isTestnet: true,
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    gasPrice: '5 gwei',
    estimatedCost: '$0.20',
    deploymentTime: '~30 sec',
    icon: '🟡',
    isTestnet: false,
  },
  {
    id: 'bsc-testnet',
    name: 'BNB Smart Chain Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
    gasPrice: '10 gwei',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~30 sec',
    icon: '🟡',
    isTestnet: true,
  },
  {
    id: 'fantom',
    name: 'Fantom Opera',
    chainId: 250,
    rpcUrl: 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    gasPrice: '20 gwei',
    estimatedCost: '$0.10',
    deploymentTime: '~30 sec',
    icon: '👻',
    isTestnet: false,
  },
  {
    id: 'fantom-testnet',
    name: 'Fantom Testnet',
    chainId: 4002,
    rpcUrl: 'https://rpc.testnet.fantom.network',
    explorerUrl: 'https://testnet.ftmscan.com',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    gasPrice: '20 gwei',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~30 sec',
    icon: '👻',
    isTestnet: true,
  },

  // Emerging Networks
  {
    id: 'linea',
    name: 'Linea',
    chainId: 59144,
    rpcUrl: 'https://rpc.linea.build',
    explorerUrl: 'https://lineascan.build',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.5 gwei',
    estimatedCost: '$3.00',
    deploymentTime: '~1 min',
    icon: '📏',
    isTestnet: false,
  },
  {
    id: 'scroll',
    name: 'Scroll',
    chainId: 534352,
    rpcUrl: 'https://rpc.scroll.io',
    explorerUrl: 'https://scrollscan.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.1 gwei',
    estimatedCost: '$2.50',
    deploymentTime: '~1 min',
    icon: '📜',
    isTestnet: false,
  },
  {
    id: 'zksync',
    name: 'zkSync Era',
    chainId: 324,
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://explorer.zksync.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.05 gwei',
    estimatedCost: '$1.20',
    deploymentTime: '~2 min',
    icon: '⚡',
    isTestnet: false,
  },
  {
    id: 'zksync-sepolia',
    name: 'zkSync Era Sepolia',
    chainId: 300,
    rpcUrl: 'https://sepolia.era.zksync.dev',
    explorerUrl: 'https://sepolia.explorer.zksync.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    gasPrice: '0.05 gwei',
    estimatedCost: 'Free (Testnet)',
    deploymentTime: '~2 min',
    icon: '⚡',
    isTestnet: true,
  },
]

interface DeploymentPanelProps {
  contractCode: string
  onDeploy?: (network: string, config: any) => void
  className?: string
}

export function DeploymentPanel({ contractCode, onDeploy, className }: DeploymentPanelProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[2]) // Default to Polygon
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentProgress, setDeploymentProgress] = useState(0)
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')
  const [deploymentAddress, setDeploymentAddress] = useState('')
  const [constructorArgs, setConstructorArgs] = useState('')
  const [gasLimit, setGasLimit] = useState('3000000')
  const [gasPrice, setGasPrice] = useState('')
  const [showTestnets, setShowTestnets] = useState(false)
  const [networkFilter, setNetworkFilter] = useState('')

  // Filter networks based on testnet preference and search
  const filteredNetworks = networks.filter(network => {
    const matchesTestnet = showTestnets ? network.isTestnet : !network.isTestnet
    const matchesFilter = network.name.toLowerCase().includes(networkFilter.toLowerCase()) ||
                         network.nativeCurrency.symbol.toLowerCase().includes(networkFilter.toLowerCase())
    return matchesTestnet && matchesFilter
  })

  // Group networks by category
  const groupedNetworks = {
    ethereum: filteredNetworks.filter(n => n.id.includes('ethereum') || n.id.includes('sepolia')),
    layer2: filteredNetworks.filter(n => ['polygon', 'arbitrum', 'optimism', 'base'].some(prefix => n.id.includes(prefix))),
    alternative: filteredNetworks.filter(n => ['avalanche', 'bsc', 'fantom'].some(prefix => n.id.includes(prefix))),
    emerging: filteredNetworks.filter(n => ['linea', 'scroll', 'zksync'].some(prefix => n.id.includes(prefix)))
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeploymentStatus('deploying')
    setDeploymentProgress(0)

    // Simulate deployment process
    const steps = [
      { name: 'Compiling contract...', progress: 20 },
      { name: 'Estimating gas...', progress: 40 },
      { name: 'Sending transaction...', progress: 60 },
      { name: 'Waiting for confirmation...', progress: 80 },
      { name: 'Verifying contract...', progress: 100 },
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDeploymentProgress(step.progress)
    }

    // Simulate successful deployment
    setDeploymentStatus('success')
    setDeploymentAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
    setIsDeploying(false)

    if (onDeploy) {
      onDeploy(selectedNetwork.id, {
        gasLimit,
        gasPrice: gasPrice || selectedNetwork.gasPrice,
        constructorArgs,
      })
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(deploymentAddress)
  }

  const openInExplorer = () => {
    window.open(`${selectedNetwork.explorerUrl}/address/${deploymentAddress}`, '_blank')
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deploy Contract</h2>
          <p className="text-muted-foreground">
            Deploy your smart contract to multiple blockchain networks
          </p>
        </div>
        <Badge variant="gradient">
          <Rocket className="h-3 w-3 mr-1" />
          Multi-Chain
        </Badge>
      </div>

      <Tabs defaultValue="networks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="networks">
            <Network className="h-4 w-4 mr-2" />
            Networks
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="deployment">
            <Rocket className="h-4 w-4 mr-2" />
            Deploy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="networks" className="space-y-4">
          {/* Network Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-testnets"
                  checked={showTestnets}
                  onChange={(e) => setShowTestnets(e.target.checked)}
                  className="rounded border-input"
                />
                <label htmlFor="show-testnets" className="text-sm font-medium">
                  Show Testnets
                </label>
              </div>
              <Badge variant="outline" size="sm">
                {filteredNetworks.length} networks
              </Badge>
            </div>
            <Input
              placeholder="Search networks..."
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Network Groups */}
          <div className="space-y-6">
            {groupedNetworks.ethereum.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <span className="text-2xl mr-2">🔷</span>
                  Ethereum Ecosystem
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {groupedNetworks.ethereum.map((network) => (
                    <NetworkCard
                      key={network.id}
                      network={network}
                      isSelected={selectedNetwork.id === network.id}
                      onSelect={setSelectedNetwork}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNetworks.layer2.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <span className="text-2xl mr-2">⚡</span>
                  Layer 2 Solutions
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {groupedNetworks.layer2.map((network) => (
                    <NetworkCard
                      key={network.id}
                      network={network}
                      isSelected={selectedNetwork.id === network.id}
                      onSelect={setSelectedNetwork}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNetworks.alternative.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <span className="text-2xl mr-2">🌐</span>
                  Alternative Layer 1s
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {groupedNetworks.alternative.map((network) => (
                    <NetworkCard
                      key={network.id}
                      network={network}
                      isSelected={selectedNetwork.id === network.id}
                      onSelect={setSelectedNetwork}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNetworks.emerging.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <span className="text-2xl mr-2">🚀</span>
                  Emerging Networks
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {groupedNetworks.emerging.map((network) => (
                    <NetworkCard
                      key={network.id}
                      network={network}
                      isSelected={selectedNetwork.id === network.id}
                      onSelect={setSelectedNetwork}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Configuration</CardTitle>
              <CardDescription>
                Configure gas settings and constructor parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gas Limit</label>
                  <Input
                    value={gasLimit}
                    onChange={(e) => setGasLimit(e.target.value)}
                    placeholder="3000000"
                    leftIcon={<Gas className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gas Price (optional)</label>
                  <Input
                    value={gasPrice}
                    onChange={(e) => setGasPrice(e.target.value)}
                    placeholder={selectedNetwork.gasPrice}
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Constructor Arguments</label>
                <Input
                  value={constructorArgs}
                  onChange={(e) => setConstructorArgs(e.target.value)}
                  placeholder="Enter constructor arguments (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Example: "MyToken", "MTK", 18, 1000000
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="text-sm font-medium mb-2">Deployment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span>{selectedNetwork.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Cost:</span>
                    <span className="font-medium">{selectedNetwork.estimatedCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deployment Time:</span>
                    <span>{selectedNetwork.deploymentTime}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deploy to {selectedNetwork.name}</CardTitle>
              <CardDescription>
                Review and deploy your smart contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {deploymentStatus === 'idle' && (
                <div className="text-center py-8">
                  <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Deploy</h3>
                  <p className="text-muted-foreground mb-6">
                    Your contract is ready to be deployed to {selectedNetwork.name}
                  </p>
                  <Button
                    onClick={handleDeploy}
                    variant="gradient"
                    size="lg"
                    disabled={!contractCode.trim()}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy Contract
                  </Button>
                </div>
              )}

              {deploymentStatus === 'deploying' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Deploying Contract</h3>
                    <p className="text-muted-foreground">
                      Please wait while your contract is being deployed...
                    </p>
                  </div>
                  <Progress value={deploymentProgress} className="w-full" />
                  <p className="text-center text-sm text-muted-foreground">
                    {deploymentProgress}% complete
                  </p>
                </div>
              )}

              {deploymentStatus === 'success' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-nova-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Deployment Successful!</h3>
                    <p className="text-muted-foreground">
                      Your contract has been successfully deployed to {selectedNetwork.name}
                    </p>
                  </div>

                  <Card variant="elevated">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Contract Address:</span>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {deploymentAddress}
                            </code>
                            <Button variant="ghost" size="sm" onClick={copyAddress}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Network:</span>
                          <span className="text-sm">{selectedNetwork.name}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Transaction:</span>
                          <Button variant="ghost" size="sm" onClick={openInExplorer}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View on Explorer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" onClick={() => setDeploymentStatus('idle')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Deploy Again
                    </Button>
                    <Button variant="default" onClick={openInExplorer}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Contract
                    </Button>
                  </div>
                </div>
              )}

              {deploymentStatus === 'error' && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-nova-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Deployment Failed</h3>
                  <p className="text-muted-foreground mb-6">
                    There was an error deploying your contract. Please try again.
                  </p>
                  <Button
                    onClick={() => setDeploymentStatus('idle')}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// NetworkCard component for better organization
interface NetworkCardProps {
  network: Network
  isSelected: boolean
  onSelect: (network: Network) => void
}

function NetworkCard({ network, isSelected, onSelect }: NetworkCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg',
        isSelected && 'ring-2 ring-primary',
        network.isTestnet && 'border-dashed'
      )}
      onClick={() => onSelect(network)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{network.icon}</span>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">{network.name}</CardTitle>
                {network.isTestnet && (
                  <Badge variant="outline" size="sm">
                    Testnet
                  </Badge>
                )}
              </div>
              <CardDescription>Chain ID: {network.chainId}</CardDescription>
            </div>
          </div>
          {isSelected && (
            <CheckCircle className="h-5 w-5 text-primary" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gas Price:</span>
            <span>{network.gasPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Cost:</span>
            <span className={cn(
              "font-medium",
              network.isTestnet ? "text-nova-green-600" : ""
            )}>
              {network.estimatedCost}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deploy Time:</span>
            <span>{network.deploymentTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Currency:</span>
            <span>{network.nativeCurrency.symbol}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
