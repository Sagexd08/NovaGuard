// Test enhanced deployment with realistic data
const axios = require('axios');

const testEnhancedDeployment = async () => {
  console.log('🧪 Testing enhanced deployment with realistic data...');

  const testContract = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.19;

    contract TestToken {
        string public name = "Test Token";
        string public symbol = "TEST";
        uint256 public totalSupply = 1000000;
        
        mapping(address => uint256) public balanceOf;
        
        event Transfer(address indexed from, address indexed to, uint256 value);
        
        constructor() {
            balanceOf[msg.sender] = totalSupply;
        }
        
        function transfer(address to, uint256 amount) public returns (bool) {
            require(balanceOf[msg.sender] >= amount, "Insufficient balance");
            balanceOf[msg.sender] -= amount;
            balanceOf[to] += amount;
            emit Transfer(msg.sender, to, amount);
            return true;
        }
        
        function mint(address to, uint256 amount) public {
            totalSupply += amount;
            balanceOf[to] += amount;
            emit Transfer(address(0), to, amount);
        }
    }
  `;

  const testData = {
    contractCode: testContract,
    contractName: 'TestToken',
    chain: 'ethereum',
    network: 'sepolia',
    constructorArgs: []
  };

  try {
    console.log('📡 Sending deployment request...');
    const response = await axios.post('http://localhost:3002/api/deployment/deploy', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('✅ Enhanced deployment result:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n🎉 Enhanced deployment completed successfully!');
      console.log('📍 Contract Address:', response.data.contractAddress);
      console.log('🔗 Transaction Hash:', response.data.transactionHash);
      console.log('⛽ Gas Used:', response.data.gasUsed?.toLocaleString());
      console.log('💰 Deployment Cost:', response.data.deploymentCost);
      console.log('🔍 Block Explorer:', response.data.explorerUrl);

      if (response.data.contractInfo) {
        console.log('\n📋 Contract Analysis:');
        console.log('  Functions:', response.data.contractInfo.functions);
        console.log('  Events:', response.data.contractInfo.events);
        console.log('  Complexity:', response.data.contractInfo.complexity);
        console.log('  Size:', response.data.contractInfo.size, 'bytes');
      }

      if (response.data.deploymentMetrics) {
        console.log('\n📊 Deployment Metrics:');
        console.log('  Compilation Time:', response.data.deploymentMetrics.compilationTime);
        console.log('  Deployment Time:', response.data.deploymentMetrics.deploymentTime);
        console.log('  Gas Efficiency:', response.data.deploymentMetrics.gasEfficiency);
        console.log('  Optimization:', response.data.deploymentMetrics.optimizationLevel);
      }
    } else {
      console.log('❌ Enhanced deployment failed:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Test multiple deployments to show dynamic data
const testMultipleDeployments = async () => {
  console.log('\n🔄 Testing multiple deployments to verify dynamic data...');
  
  const contracts = [
    { name: 'SimpleStorage', code: 'contract SimpleStorage { uint256 public value; function setValue(uint256 _value) public { value = _value; } }' },
    { name: 'Counter', code: 'contract Counter { uint256 public count; function increment() public { count++; } }' },
    { name: 'Greeter', code: 'contract Greeter { string public greeting; constructor(string memory _greeting) { greeting = _greeting; } }' }
  ];

  for (const contract of contracts) {
    console.log(`\n📝 Deploying ${contract.name}...`);
    
    try {
      const response = await axios.post('http://localhost:3002/api/deployment/deploy', {
        contractCode: contract.code,
        contractName: contract.name,
        chain: 'polygon',
        network: 'mumbai'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      if (response.data.success) {
        console.log(`✅ ${contract.name} deployed:`);
        console.log(`   Address: ${response.data.contractAddress}`);
        console.log(`   TX Hash: ${response.data.transactionHash}`);
        console.log(`   Gas Used: ${response.data.gasUsed?.toLocaleString()}`);
      }
    } catch (error) {
      console.error(`❌ ${contract.name} deployment failed:`, error.message);
    }
    
    // Small delay between deployments
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Run tests
const runTests = async () => {
  await testEnhancedDeployment();
  await testMultipleDeployments();
  console.log('\n🏁 All deployment tests completed!');
};

runTests();
