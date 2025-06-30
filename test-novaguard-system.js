// =============================================
// NOVAGUARD COMPREHENSIVE SYSTEM TEST
// Test the complete NovaGuard AI agent system
// =============================================

const MultiAgentOrchestrator = require('./api/agents/multi-agent-orchestrator');
const VectorKnowledgeSystem = require('./api/rag/vector-knowledge-system');

// Test contract with multiple vulnerability types
const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VulnerableDefiProtocol is ERC20, Ownable {
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewards;
    uint256 public totalStaked;
    uint256 public rewardRate = 100;
    
    address public oracle;
    bool public emergencyStop = false;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("VulnToken", "VULN") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    // Vulnerable function - reentrancy risk
    function unstake(uint256 amount) external {
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        require(!emergencyStop, "Emergency stop active");
        
        // External call before state change - VULNERABILITY
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        stakes[msg.sender] -= amount;
        totalStaked -= amount;
        
        emit Unstaked(msg.sender, amount);
    }
    
    // Access control vulnerability
    function setRewardRate(uint256 newRate) external {
        // Missing onlyOwner modifier - VULNERABILITY
        rewardRate = newRate;
    }
    
    // Oracle manipulation vulnerability
    function getTokenPrice() public view returns (uint256) {
        // Direct oracle call without validation - VULNERABILITY
        (bool success, bytes memory data) = oracle.staticcall(
            abi.encodeWithSignature("getPrice()")
        );
        require(success, "Oracle call failed");
        return abi.decode(data, (uint256));
    }
    
    // Flash loan vulnerable function
    function flashLoan(uint256 amount) external {
        uint256 balanceBefore = address(this).balance;
        
        // Send tokens
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        // Callback to borrower
        (bool callSuccess, ) = msg.sender.call(
            abi.encodeWithSignature("onFlashLoan(uint256)", amount)
        );
        require(callSuccess, "Callback failed");
        
        // Check repayment - VULNERABILITY: price manipulation possible
        uint256 fee = (amount * getTokenPrice()) / 10000;
        require(address(this).balance >= balanceBefore + fee, "Insufficient repayment");
    }
    
    // Gas inefficient function
    function distributeRewards(address[] memory users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            // Inefficient: reading from storage in loop - GAS ISSUE
            if (stakes[users[i]] > 0) {
                rewards[users[i]] += stakes[users[i]] * rewardRate / 10000;
            }
        }
    }
    
    // Governance function with timing issues
    function executeProposal(bytes memory data) external {
        // No timelock - GOVERNANCE VULNERABILITY
        require(msg.sender == owner(), "Only owner");
        
        (bool success, ) = address(this).call(data);
        require(success, "Execution failed");
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        emergencyStop = true;
        payable(owner()).transfer(address(this).balance);
    }
    
    function setOracle(address newOracle) external onlyOwner {
        oracle = newOracle;
    }
    
    receive() external payable {}
}
`;

async function testNovaGuardSystem() {
  console.log('🚀 Starting NovaGuard Comprehensive System Test');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Initialize RAG Knowledge System
    console.log('\n📚 Test 1: RAG Knowledge System');
    const ragSystem = new VectorKnowledgeSystem();
    
    // Initialize knowledge base
    await ragSystem.initializeKnowledgeBase();
    
    // Test semantic search
    const searchResults = await ragSystem.semanticSearch(
      'reentrancy attacks external calls security',
      { limit: 3 }
    );
    console.log(`✅ Found ${searchResults.length} relevant knowledge items`);
    
    // Test contextual knowledge retrieval
    const contextualKnowledge = await ragSystem.getContextualKnowledge(testContract, 'security');
    console.log(`✅ Retrieved contextual knowledge: ${contextualKnowledge.totalSources} sources`);
    console.log(`   Knowledge quality: ${contextualKnowledge.summary.knowledgeQuality}`);
    
    // Test 2: Multi-Agent Orchestrator
    console.log('\n🤖 Test 2: Multi-Agent Analysis');
    const orchestrator = new MultiAgentOrchestrator();
    
    // Test comprehensive analysis
    const analysisOptions = {
      auditId: 'test_audit_001',
      userId: 'test_user',
      analysisMode: 'comprehensive',
      agents: ['security', 'gasOptimizer', 'tokenomics'],
      strategy: 'adaptive'
    };
    
    console.log('🔍 Running comprehensive multi-agent analysis...');
    const results = await orchestrator.analyzeContract(testContract, analysisOptions);
    
    // Validate results
    console.log('\n📊 Analysis Results:');
    console.log(`   Audit ID: ${results.auditId}`);
    console.log(`   Agents Used: ${results.agentsUsed.join(', ')}`);
    console.log(`   Strategy: ${results.strategy}`);
    console.log(`   Execution Time: ${results.executionTime}ms`);
    console.log(`   Overall Score: ${results.overallScore}/100`);
    console.log(`   Risk Category: ${results.riskCategory}`);
    
    // Vulnerability Analysis
    console.log('\n🔒 Security Analysis:');
    console.log(`   Vulnerabilities Found: ${results.vulnerabilities.length}`);
    
    const criticalVulns = results.vulnerabilities.filter(v => v.severity === 'critical');
    const highVulns = results.vulnerabilities.filter(v => v.severity === 'high');
    
    console.log(`   Critical: ${criticalVulns.length}`);
    console.log(`   High: ${highVulns.length}`);
    
    if (criticalVulns.length > 0) {
      console.log('   Critical Vulnerabilities:');
      criticalVulns.forEach(vuln => {
        console.log(`     - ${vuln.name}: ${vuln.description}`);
      });
    }
    
    // Gas Optimization Analysis
    if (results.gasOptimizations && results.gasOptimizations.length > 0) {
      console.log('\n⛽ Gas Optimization:');
      console.log(`   Optimizations Found: ${results.gasOptimizations.length}`);
      
      const totalSavings = results.gasOptimizations.reduce(
        (sum, opt) => sum + (opt.gasSavings || 0), 0
      );
      console.log(`   Total Potential Savings: ${totalSavings} gas`);
      
      console.log('   Top Optimizations:');
      results.gasOptimizations.slice(0, 3).forEach(opt => {
        console.log(`     - ${opt.title}: ${opt.gasSavings || 0} gas saved`);
      });
    }
    
    // Tokenomics Analysis
    if (results.tokenomicsFindings && results.tokenomicsFindings.length > 0) {
      console.log('\n💰 Tokenomics Analysis:');
      console.log(`   Findings: ${results.tokenomicsFindings.length}`);
      
      const economicRisks = results.tokenomicsFindings.filter(
        f => f.severity === 'critical' || f.severity === 'high'
      );
      
      if (economicRisks.length > 0) {
        console.log('   Economic Risks:');
        economicRisks.forEach(risk => {
          console.log(`     - ${risk.title} (${risk.severity})`);
        });
      }
    }
    
    // Cross-Validation Results
    if (results.crossValidation) {
      console.log('\n🔄 Cross-Validation:');
      console.log(`   Consensus Findings: ${results.crossValidation.consensusFindings?.length || 0}`);
      console.log(`   Confidence Score: ${(results.crossValidation.confidenceScore * 100).toFixed(1)}%`);
    }
    
    // Test 3: Specific Vulnerability Detection
    console.log('\n🎯 Test 3: Specific Vulnerability Detection');
    
    const expectedVulnerabilities = [
      'reentrancy',
      'access_control',
      'oracle_manipulation',
      'flash_loan_attack',
      'governance_attack'
    ];
    
    const detectedTypes = results.vulnerabilities.map(v => v.type?.toLowerCase() || v.name?.toLowerCase());
    
    expectedVulnerabilities.forEach(expectedType => {
      const detected = detectedTypes.some(type => 
        type?.includes(expectedType.replace('_', '')) || 
        type?.includes(expectedType)
      );
      
      console.log(`   ${expectedType}: ${detected ? '✅ Detected' : '❌ Missed'}`);
    });
    
    // Test 4: Performance Metrics
    console.log('\n⚡ Test 4: Performance Metrics');
    console.log(`   Total Analysis Time: ${results.executionTime}ms`);
    
    if (results.agentResults) {
      results.agentResults.forEach(agentResult => {
        console.log(`   ${agentResult.agent} Agent: ${agentResult.result.executionTime}ms`);
      });
    }
    
    // Test 5: Knowledge Integration
    console.log('\n🧠 Test 5: Knowledge Integration');
    
    const hasContextualRecommendations = results.recommendations && 
      results.recommendations.some(rec => rec.includes('OpenZeppelin') || rec.includes('best practice'));
    
    console.log(`   Contextual Recommendations: ${hasContextualRecommendations ? '✅ Present' : '❌ Missing'}`);
    
    const hasKnowledgeBasedInsights = results.codeInsights && 
      Object.keys(results.codeInsights).length > 0;
    
    console.log(`   Knowledge-based Insights: ${hasKnowledgeBasedInsights ? '✅ Present' : '❌ Missing'}`);
    
    // Test Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const testResults = {
      ragSystemInitialized: true,
      multiAgentAnalysisCompleted: true,
      vulnerabilitiesDetected: results.vulnerabilities.length > 0,
      gasOptimizationsFound: (results.gasOptimizations?.length || 0) > 0,
      tokenomicsAnalyzed: (results.tokenomicsFindings?.length || 0) > 0,
      crossValidationPerformed: !!results.crossValidation,
      performanceAcceptable: results.executionTime < 300000, // 5 minutes
      knowledgeIntegrated: hasContextualRecommendations
    };
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`📊 Success Rate: ${(passedTests/totalTests*100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED - NovaGuard system is fully operational!');
    } else {
      console.log('⚠️  Some tests failed - review system configuration');
      
      Object.entries(testResults).forEach(([test, passed]) => {
        if (!passed) {
          console.log(`   ❌ ${test}`);
        }
      });
    }
    
    // Output detailed results for review
    console.log('\n📄 Detailed Results:');
    console.log(JSON.stringify({
      summary: {
        auditId: results.auditId,
        overallScore: results.overallScore,
        riskCategory: results.riskCategory,
        executionTime: results.executionTime,
        agentsUsed: results.agentsUsed
      },
      vulnerabilities: results.vulnerabilities.map(v => ({
        name: v.name,
        severity: v.severity,
        type: v.type,
        description: v.description?.substring(0, 100) + '...'
      })),
      testResults
    }, null, 2));
    
  } catch (error) {
    console.error('❌ NovaGuard System Test Failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testNovaGuardSystem()
    .then(() => {
      console.log('\n🏁 NovaGuard system test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testNovaGuardSystem, testContract };
