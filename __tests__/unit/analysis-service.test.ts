// =============================================
// NOVAGUARD ANALYSIS SERVICE UNIT TESTS
// Comprehensive testing for analysis service
// =============================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import AnalysisService from '@/functions/src/services/analysis-service'

// Mock dependencies
jest.mock('@supabase/supabase-js')
jest.mock('openai')
jest.mock('ethers')

describe('AnalysisService', () => {
  let analysisService: AnalysisService
  
  beforeEach(() => {
    analysisService = new AnalysisService()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('analyzeContract', () => {
    const mockRequest = {
      code: `
        pragma solidity ^0.8.0;
        
        contract TestContract {
          uint256 public value;
          
          function setValue(uint256 _value) public {
            value = _value;
          }
          
          function getValue() public view returns (uint256) {
            return value;
          }
        }
      `,
      type: 'comprehensive' as const,
      userId: 'test-user-123',
      options: {}
    }

    it('should analyze contract successfully', async () => {
      const result = await analysisService.analyzeContract(mockRequest)
      
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.status).toBe('completed')
      expect(result.securityScore).toBeGreaterThanOrEqual(0)
      expect(result.securityScore).toBeLessThanOrEqual(100)
      expect(result.gasScore).toBeGreaterThanOrEqual(0)
      expect(result.gasScore).toBeLessThanOrEqual(100)
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(result.vulnerabilities)).toBe(true)
      expect(Array.isArray(result.gasOptimizations)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.metadata.linesOfCode).toBeGreaterThan(0)
    })

    it('should handle security analysis type', async () => {
      const securityRequest = { ...mockRequest, type: 'security' as const }
      const result = await analysisService.analyzeContract(securityRequest)
      
      expect(result.status).toBe('completed')
      expect(result.securityScore).toBeGreaterThanOrEqual(0)
      expect(result.gasScore).toBe(0) // Gas score should be 0 for security-only analysis
    })

    it('should handle gas analysis type', async () => {
      const gasRequest = { ...mockRequest, type: 'gas' as const }
      const result = await analysisService.analyzeContract(gasRequest)
      
      expect(result.status).toBe('completed')
      expect(result.gasScore).toBeGreaterThanOrEqual(0)
      expect(result.securityScore).toBe(0) // Security score should be 0 for gas-only analysis
    })

    it('should handle quick analysis type', async () => {
      const quickRequest = { ...mockRequest, type: 'quick' as const }
      const result = await analysisService.analyzeContract(quickRequest)
      
      expect(result.status).toBe('completed')
      expect(result.metadata.analysisTime).toBeLessThan(5000) // Quick analysis should be fast
    })

    it('should handle empty contract code', async () => {
      const emptyRequest = { ...mockRequest, code: '' }
      
      await expect(analysisService.analyzeContract(emptyRequest))
        .rejects.toThrow()
    })

    it('should handle invalid Solidity code', async () => {
      const invalidRequest = { 
        ...mockRequest, 
        code: 'invalid solidity code that will not compile' 
      }
      
      const result = await analysisService.analyzeContract(invalidRequest)
      expect(result.vulnerabilities.length).toBeGreaterThan(0)
    })
  })

  describe('vulnerability detection', () => {
    it('should detect reentrancy vulnerabilities', async () => {
      const reentrancyCode = `
        pragma solidity ^0.8.0;
        
        contract VulnerableContract {
          mapping(address => uint256) public balances;
          
          function withdraw() public {
            uint256 amount = balances[msg.sender];
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "Transfer failed");
            balances[msg.sender] = 0;
          }
        }
      `
      
      const request = {
        code: reentrancyCode,
        type: 'security' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      const reentrancyVulns = result.vulnerabilities.filter(v => 
        v.type.toLowerCase().includes('reentrancy')
      )
      
      expect(reentrancyVulns.length).toBeGreaterThan(0)
      expect(reentrancyVulns[0].severity).toBe('high')
    })

    it('should detect tx.origin usage', async () => {
      const txOriginCode = `
        pragma solidity ^0.8.0;
        
        contract TxOriginContract {
          address public owner;
          
          modifier onlyOwner() {
            require(tx.origin == owner, "Not owner");
            _;
          }
          
          function sensitiveFunction() public onlyOwner {
            // sensitive logic
          }
        }
      `
      
      const request = {
        code: txOriginCode,
        type: 'security' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      const txOriginVulns = result.vulnerabilities.filter(v => 
        v.type.toLowerCase().includes('tx_origin')
      )
      
      expect(txOriginVulns.length).toBeGreaterThan(0)
    })

    it('should detect selfdestruct usage', async () => {
      const selfdestructCode = `
        pragma solidity ^0.8.0;
        
        contract SelfdestructContract {
          address public owner;
          
          function destroy() public {
            require(msg.sender == owner, "Not owner");
            selfdestruct(payable(owner));
          }
        }
      `
      
      const request = {
        code: selfdestructCode,
        type: 'security' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      const selfdestructVulns = result.vulnerabilities.filter(v => 
        v.type.toLowerCase().includes('selfdestruct')
      )
      
      expect(selfdestructVulns.length).toBeGreaterThan(0)
      expect(selfdestructVulns[0].severity).toBe('critical')
    })
  })

  describe('gas optimization detection', () => {
    it('should detect storage packing opportunities', async () => {
      const unpackedCode = `
        pragma solidity ^0.8.0;
        
        contract UnpackedContract {
          uint256 public largeValue;
          uint8 public smallValue1;
          uint256 public anotherLargeValue;
          uint8 public smallValue2;
        }
      `
      
      const request = {
        code: unpackedCode,
        type: 'gas' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      const packingOptimizations = result.gasOptimizations.filter(opt => 
        opt.type.toLowerCase().includes('storage_packing')
      )
      
      expect(packingOptimizations.length).toBeGreaterThan(0)
    })

    it('should detect loop optimization opportunities', async () => {
      const inefficientLoopCode = `
        pragma solidity ^0.8.0;
        
        contract LoopContract {
          uint256[] public items;
          
          function processItems() public {
            for (uint256 i = 0; i < items.length; i++) {
              // Process item
            }
          }
        }
      `
      
      const request = {
        code: inefficientLoopCode,
        type: 'gas' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      const loopOptimizations = result.gasOptimizations.filter(opt => 
        opt.type.toLowerCase().includes('loop_optimization')
      )
      
      expect(loopOptimizations.length).toBeGreaterThan(0)
    })
  })

  describe('scoring system', () => {
    it('should calculate security score correctly', async () => {
      const secureCode = `
        pragma solidity ^0.8.0;
        
        contract SecureContract {
          uint256 private value;
          address private owner;
          
          modifier onlyOwner() {
            require(msg.sender == owner, "Not owner");
            _;
          }
          
          constructor() {
            owner = msg.sender;
          }
          
          function setValue(uint256 _value) public onlyOwner {
            value = _value;
          }
          
          function getValue() public view returns (uint256) {
            return value;
          }
        }
      `
      
      const request = {
        code: secureCode,
        type: 'security' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      expect(result.securityScore).toBeGreaterThan(80) // Should be high for secure code
    })

    it('should penalize security score for vulnerabilities', async () => {
      const vulnerableCode = `
        pragma solidity ^0.8.0;
        
        contract VulnerableContract {
          mapping(address => uint256) public balances;
          
          function withdraw() public {
            (bool success, ) = msg.sender.call{value: balances[msg.sender]}("");
            require(success);
            balances[msg.sender] = 0;
          }
          
          function authorize() public view returns (bool) {
            return tx.origin == msg.sender;
          }
        }
      `
      
      const request = {
        code: vulnerableCode,
        type: 'security' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      expect(result.securityScore).toBeLessThan(60) // Should be low for vulnerable code
    })
  })

  describe('error handling', () => {
    it('should handle analysis timeout gracefully', async () => {
      // Mock a timeout scenario
      jest.setTimeout(1000)
      
      const largeCode = 'pragma solidity ^0.8.0;\n' + 'contract Large {\n'.repeat(1000) + '}'.repeat(1000)
      
      const request = {
        code: largeCode,
        type: 'comprehensive' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      expect(result).toBeDefined()
      // Should complete even with large code
    })

    it('should handle malformed contract code', async () => {
      const malformedCode = `
        pragma solidity ^0.8.0;
        
        contract Malformed {
          function incomplete(
          // Missing closing parenthesis and body
      `
      
      const request = {
        code: malformedCode,
        type: 'comprehensive' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      expect(result).toBeDefined()
      expect(result.vulnerabilities.length).toBeGreaterThan(0)
    })
  })

  describe('metadata extraction', () => {
    it('should extract correct metadata', async () => {
      const complexCode = `
        pragma solidity ^0.8.0;
        
        contract ComplexContract {
          uint256 public value1;
          uint256 public value2;
          
          function func1() public {}
          function func2() public {}
          function func3() public {
            if (value1 > 0) {
              for (uint i = 0; i < 10; i++) {
                value2++;
              }
            }
          }
        }
      `
      
      const request = {
        code: complexCode,
        type: 'comprehensive' as const,
        userId: 'test-user',
        options: {}
      }
      
      const result = await analysisService.analyzeContract(request)
      
      expect(result.metadata.linesOfCode).toBeGreaterThan(10)
      expect(result.metadata.complexity).toBeGreaterThan(0)
      expect(result.metadata.timestamp).toBeDefined()
      expect(result.metadata.analysisTime).toBeGreaterThan(0)
    })
  })
})
