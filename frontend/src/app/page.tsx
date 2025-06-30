'use client'

import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { CodeEditor } from '@/components/advanced/code-editor'
import { AnalysisDashboard } from '@/components/advanced/analysis-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Zap, 
  Code, 
  Rocket, 
  BarChart3, 
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  FileText,
  Play,
  Star,
  GitBranch,
  Activity
} from 'lucide-react'

// Mock data for demonstration
const mockAnalysisResult = {
  id: '1',
  contractName: 'MyToken.sol',
  securityScore: 85,
  gasScore: 78,
  overallScore: 82,
  vulnerabilities: [
    {
      id: '1',
      type: 'reentrancy',
      severity: 'high' as const,
      title: 'Potential Reentrancy Attack',
      description: 'The withdraw function is vulnerable to reentrancy attacks due to external calls before state changes.',
      line: 45,
      function: 'withdraw',
      recommendation: 'Use the checks-effects-interactions pattern or implement a reentrancy guard.',
      confidence: 0.9,
    },
    {
      id: '2',
      type: 'access-control',
      severity: 'medium' as const,
      title: 'Missing Access Control',
      description: 'The mint function lacks proper access control mechanisms.',
      line: 32,
      function: 'mint',
      recommendation: 'Add onlyOwner modifier or implement role-based access control.',
      confidence: 0.85,
    },
  ],
  gasOptimizations: [
    {
      id: '1',
      type: 'storage',
      title: 'Optimize Storage Layout',
      description: 'Pack struct variables to reduce storage slots.',
      line: 15,
      estimatedSavings: 2000,
      difficulty: 'medium' as const,
    },
  ],
  recommendations: [
    {
      id: '1',
      category: 'Security',
      priority: 'high' as const,
      title: 'Implement Circuit Breaker Pattern',
      description: 'Add emergency stop functionality to pause contract operations in case of detected anomalies.',
    },
  ],
  summary: 'Your smart contract shows good overall security practices but has some areas for improvement. The main concerns are around reentrancy protection and access control.',
  metadata: {
    analysisTime: 2500,
    linesOfCode: 150,
    complexity: 7,
    timestamp: new Date().toISOString(),
  },
}

const defaultContractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MyToken
 * @dev Advanced ERC20 token with security features
 */
contract MyToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18;
    uint256 public constant MINT_RATE = 100 * 10**18; // 100 tokens per mint
    
    mapping(address => uint256) public lastMintTime;
    uint256 public constant MINT_COOLDOWN = 1 days;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 100000 * 10**18); // Initial supply
    }
    
    /**
     * @dev Mint tokens with rate limiting
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(
            block.timestamp >= lastMintTime[to] + MINT_COOLDOWN,
            "Mint cooldown not met"
        );
        
        lastMintTime[to] = block.timestamp;
        _mint(to, amount);
        
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Public mint function with rate limiting
     */
    function publicMint() external nonReentrant {
        require(
            block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN,
            "Mint cooldown not met"
        );
        require(totalSupply() + MINT_RATE <= MAX_SUPPLY, "Exceeds max supply");
        
        lastMintTime[msg.sender] = block.timestamp;
        _mint(msg.sender, MINT_RATE);
        
        emit TokensMinted(msg.sender, MINT_RATE);
    }
    
    /**
     * @dev Burn tokens from caller's balance
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Emergency withdrawal function (VULNERABLE - for demo purposes)
     */
    function emergencyWithdraw() external nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        // This is secure due to ReentrancyGuard
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}`;

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('editor')
  const [contractCode, setContractCode] = useState(defaultContractCode)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<typeof mockAnalysisResult | null>(null)

  const handleAnalyze = async (code: string) => {
    setIsAnalyzing(true)
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setAnalysisResult(mockAnalysisResult)
    setIsAnalyzing(false)
    setActiveTab('results')
  }

  const handleSave = (code: string) => {
    setContractCode(code)
    console.log('Contract saved:', code.length, 'characters')
  }

  const handleDeploy = (code: string) => {
    console.log('Deploying contract:', code)
    // Implement deployment logic
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">
              Smart Contract Auditor
            </h1>
            <p className="text-muted-foreground">
              AI-powered security analysis and deployment platform for Web3 developers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="gradient" className="px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              Pro Plan
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              v1.0.0
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card variant="elevated" hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contracts Analyzed</CardTitle>
              <Shield className="h-4 w-4 text-nova-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1 text-nova-green-600" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vulnerabilities Found</CardTitle>
              <AlertTriangle className="h-4 w-4 text-nova-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1 text-nova-green-600" />
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gas Saved</CardTitle>
              <Zap className="h-4 w-4 text-nova-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4M</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1 text-nova-green-600" />
                +18% from last month
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deployments</CardTitle>
              <Rocket className="h-4 w-4 text-nova-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">456</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1 text-nova-green-600" />
                +8% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Code Editor</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analysis Results</span>
              {analysisResult && (
                <Badge variant="secondary" size="sm" className="ml-2">
                  {analysisResult.vulnerabilities.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="collaborate" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Collaborate</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <CodeEditor
              value={contractCode}
              onChange={setContractCode}
              onSave={handleSave}
              onAnalyze={handleAnalyze}
              onDeploy={handleDeploy}
              isAnalyzing={isAnalyzing}
              height="70vh"
              analysisResults={analysisResult ? {
                vulnerabilities: analysisResult.vulnerabilities.length,
                gasOptimizations: analysisResult.gasOptimizations.length,
                score: analysisResult.overallScore,
              } : undefined}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {analysisResult ? (
              <AnalysisDashboard
                result={analysisResult}
                onExportReport={() => console.log('Exporting report...')}
                onShareResults={() => console.log('Sharing results...')}
                onViewDetails={(id) => console.log('Viewing details for:', id)}
              />
            ) : (
              <Card variant="elevated">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-nova-blue-100 to-nova-green-100 dark:from-nova-blue-900/20 dark:to-nova-green-900/20 rounded-full flex items-center justify-center mb-6">
                    <FileText className="h-12 w-12 text-nova-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Analysis Results</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Run an analysis on your smart contract to see detailed security and gas optimization results with AI-powered insights.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('editor')}
                    variant="gradient"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collaborate" className="space-y-4">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Real-time Collaboration</span>
                </CardTitle>
                <CardDescription>
                  Work together with your team on smart contract audits in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-nova-blue-100 to-nova-green-100 dark:from-nova-blue-900/20 dark:to-nova-green-900/20 rounded-full flex items-center justify-center mb-6">
                    <GitBranch className="h-12 w-12 text-nova-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Advanced Collaboration Features</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Real-time editing, live comments, shared analysis results, and team management features are coming soon.
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <Button variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Coming Soon
                    </Button>
                    <Button variant="ghost">
                      <Activity className="h-4 w-4 mr-2" />
                      Join Beta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
