const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mock LLM service for testing
const mockLLMAnalysis = (contractCode, contractAddress) => {
  return {
    vulnerabilities: [
      {
        name: "Reentrancy",
        affectedLines: "42-47",
        description: "Potential reentrancy vulnerability in withdraw function.",
        severity: "high",
        fixSuggestion: "Apply reentrancy guard or checks-effects-interactions pattern."
      },
      {
        name: "Integer Overflow",
        affectedLines: "23-25",
        description: "Potential integer overflow in calculation.",
        severity: "medium",
        fixSuggestion: "Use SafeMath library or Solidity 0.8+ built-in overflow protection."
      }
    ],
    securityScore: 75,
    riskCategory: {
      label: "medium",
      justification: "Some security issues found but manageable with proper fixes."
    },
    codeInsights: {
      gasOptimizationTips: [
        "Combine multiple state writes into single transaction",
        "Use events instead of storage for data that doesn't need to be queried",
        "Pack struct variables to save storage slots"
      ],
      antiPatternNotices: [
        "Usage of tx.origin instead of msg.sender",
        "Unbounded loop in function processArray"
      ],
      dangerousUsage: [
        "Direct use of delegatecall without proper validation"
      ]
    }
  };
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('Received audit request:', req.body);
    
    const { contractAddress, chain, contractCode, name, description } = req.body;
    
    // Validate request
    if (!contractAddress && !contractCode) {
      return res.status(400).json({
        error: 'Either contractAddress or contractCode is required'
      });
    }

    // Get user ID from Authorization header (Clerk JWT)
    const authHeader = req.headers.authorization;
    let userId = 'anonymous';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real implementation, you'd verify the JWT token here
      // For now, we'll extract a mock user ID
      userId = 'user_' + Math.random().toString(36).substring(2, 15);
    }

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock analysis results
    const analysisResults = mockLLMAnalysis(contractCode, contractAddress);

    // Store audit result in Supabase
    const auditData = {
      user_id: userId,
      contract_address: contractAddress,
      chain: chain || 'ethereum',
      contract_code: contractCode,
      project_name: name,
      project_description: description,
      analysis_results: analysisResults,
      status: 'completed',
      created_at: new Date().toISOString()
    };

    const { data: auditRecord, error: auditError } = await supabase
      .from('audits')
      .insert(auditData)
      .select()
      .single();

    if (auditError) {
      console.error('Error storing audit:', auditError);
      // Continue anyway, return results even if storage fails
    }

    // Return analysis results
    res.json({
      success: true,
      auditId: auditRecord?.id || `audit_${Date.now()}`,
      ...analysisResults
    });

  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
