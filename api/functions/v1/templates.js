module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const templates = [
      {
        id: 'hello-world',
        name: 'Hello World',
        description: 'A simple smart contract to get started',
        category: 'Basic',
        network: 'Ethereum',
        version: '1.0.0'
      },
      {
        id: 'erc20-token',
        name: 'ERC-20 Token',
        description: 'Standard fungible token implementation',
        category: 'Token',
        network: 'Ethereum',
        version: '1.0.0'
      },
      {
        id: 'nft-collection',
        name: 'NFT Collection',
        description: 'ERC-721 NFT collection with minting',
        category: 'NFT',
        network: 'Ethereum',
        version: '1.0.0'
      }
    ];

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
};
