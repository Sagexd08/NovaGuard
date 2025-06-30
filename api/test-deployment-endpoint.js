// Test deployment endpoint
const axios = require('axios');

const testDeployment = async () => {
  console.log('🧪 Testing deployment endpoint...');

  const contractCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BlankContract {
    string public message;
    
    constructor() {
        message = "Hello from BlankContract!";
    }
    
    function setMessage(string memory _message) public {
        message = _message;
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
}`;

  const deploymentData = {
    contractCode: contractCode,
    contractName: 'BlankContract',
    chain: 'ethereum',
    network: 'sepolia',
    constructorArgs: [],
    gasLimit: 'auto',
    gasPrice: 'auto'
  };

  try {
    console.log('📡 Sending deployment request...');
    const response = await axios.post('http://localhost:3002/api/deployment/deploy', deploymentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock token for testing
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('✅ Deployment result:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Run the test
testDeployment();
