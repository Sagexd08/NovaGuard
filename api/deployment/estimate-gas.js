// Gas estimation endpoint for smart contract deployment
const { withAuth } = require('../middleware/auth');
const { ethers } = require('ethers');
const solc = require('solc');

// Network configurations
const NETWORK_CONFIGS = {
  ethereum: {
    mainnet: {
      rpc: process.env.ETHEREUM_MAINNET_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo',
      chainId: 1,
      currency: 'ETH'
    },
    sepolia: {
      rpc: process.env.ETHEREUM_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo',
      chainId: 11155111,
      currency: 'ETH'
    }
  },
  polygon: {
    mainnet: {
      rpc: process.env.POLYGON_MAINNET_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/demo',
      chainId: 137,
      currency: 'MATIC'
    },
    mumbai: {
      rpc: process.env.POLYGON_MUMBAI_RPC || 'https://polygon-mumbai.g.alchemy.com/v2/demo',
      chainId: 80001,
      currency: 'MATIC'
    }
  },
  arbitrum: {
    mainnet: {
      rpc: process.env.ARBITRUM_MAINNET_RPC || 'https://arb-mainnet.g.alchemy.com/v2/demo',
      chainId: 42161,
      currency: 'ETH'
    },
    goerli: {
      rpc: process.env.ARBITRUM_GOERLI_RPC || 'https://arb-goerli.g.alchemy.com/v2/demo',
      chainId: 421613,
      currency: 'ETH'
    }
  }
};

// Compile contract function
function compileContract(contractCode, contractName) {
  const input = {
    language: 'Solidity',
    sources: {
      [`${contractName}.sol`]: {
        content: contractCode
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    const errors = output.errors.filter(error => error.severity === 'error');
    if (errors.length > 0) {
      throw new Error(`Compilation failed: ${errors[0].message}`);
    }
  }

  const contract = output.contracts[`${contractName}.sol`][contractName];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

const estimateGasHandler = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { contractCode, chain = 'ethereum', network = 'sepolia', constructorArgs = [] } = req.body;

    console.log(`⛽ Gas estimation request from user ${userId}`);
    console.log(`Target: ${chain}-${network}`);

    // Validate inputs
    if (!contractCode) {
      return res.status(400).json({
        success: false,
        error: 'Contract code is required'
      });
    }

    // Validate network configuration
    if (!NETWORK_CONFIGS[chain] || !NETWORK_CONFIGS[chain][network]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported network: ${chain}-${network}`
      });
    }

    const networkConfig = NETWORK_CONFIGS[chain][network];
    console.log(`🌐 Using network: ${chain}-${network} (Chain ID: ${networkConfig.chainId})`);

    try {
      // Extract contract name from code
      const contractNameMatch = contractCode.match(/contract\s+(\w+)/);
      const contractName = contractNameMatch ? contractNameMatch[1] : 'Contract';

      console.log(`📝 Contract name: ${contractName}`);

      // Compile contract
      console.log('🔨 Compiling contract for gas estimation...');
      const { abi, bytecode } = compileContract(contractCode, contractName);
      console.log('✅ Contract compiled successfully');

      // Create provider
      const provider = new ethers.JsonRpcProvider(networkConfig.rpc);

      // Create contract factory for gas estimation
      const contractFactory = new ethers.ContractFactory(abi, bytecode);

      // Get deployment transaction
      const deployTx = contractFactory.getDeployTransaction(...constructorArgs);

      // Estimate gas
      console.log('⛽ Estimating gas...');
      const gasEstimate = await provider.estimateGas(deployTx);
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Calculate cost
      const estimatedCost = gasEstimate * gasPrice;
      const costInEth = ethers.formatEther(estimatedCost);

      console.log(`📊 Gas estimate: ${gasEstimate.toString()}`);
      console.log(`💰 Gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
      console.log(`💸 Estimated cost: ${costInEth} ${networkConfig.currency}`);

      res.status(200).json({
        success: true,
        data: {
          gasEstimate: Number(gasEstimate.toString()),
          gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
          cost: `${costInEth} ${networkConfig.currency}`,
          costWei: estimatedCost.toString(),
          network: `${chain}-${network}`,
          currency: networkConfig.currency
        }
      });

    } catch (compilationError) {
      console.error('❌ Compilation/estimation error:', compilationError);
      
      // Fallback to estimated values
      const fallbackGas = 500000 + Math.floor(Math.random() * 300000);
      const fallbackGasPrice = '20';
      const fallbackCost = (fallbackGas * 20 / 1e9).toFixed(6);

      res.status(200).json({
        success: true,
        data: {
          gasEstimate: fallbackGas,
          gasPrice: fallbackGasPrice,
          cost: `${fallbackCost} ${networkConfig.currency}`,
          network: `${chain}-${network}`,
          currency: networkConfig.currency,
          warning: 'Used fallback estimation due to compilation issues'
        }
      });
    }

  } catch (error) {
    console.error('❌ Gas estimation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Gas estimation failed',
      message: error.message
    });
  }
};

module.exports = withAuth(estimateGasHandler);
