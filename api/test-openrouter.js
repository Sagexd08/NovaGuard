// Test OpenRouter API connection
const axios = require('axios');
require('dotenv').config();

const testOpenRouterAPI = async () => {
  console.log('🧪 Testing OpenRouter API connection...');
  console.log('🔑 API Key:', process.env.OPENROUTER_API_KEY ? 'Present' : 'Missing');
  console.log('🌐 Base URL:', process.env.OPENROUTER_BASE_URL);

  const testPrompt = `
    Analyze this simple Solidity contract for vulnerabilities:
    
    contract Test {
        uint256 public value;
        function setValue(uint256 _value) public {
            value = _value;
        }
    }
    
    Return a JSON object with vulnerabilities found.
  `;

  try {
    console.log('📡 Testing Kimi model...');
    const kimiResponse = await axios.post(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
      model: 'moonshotai/kimi-dev-72b:free',
      messages: [{ role: 'user', content: testPrompt }],
      temperature: 0.1,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5173',
        'X-Title': 'Flash Audit - Vulnerability Scanner'
      }
    });

    console.log('✅ Kimi model response status:', kimiResponse.status);
    console.log('📝 Kimi response:', kimiResponse.data.choices[0].message.content.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Kimi model test failed:', error.response?.status, error.response?.data || error.message);
  }

  try {
    console.log('\n📡 Testing Gemma model...');
    const gemmaResponse = await axios.post(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
      model: 'google/gemma-3n-e4b-it:free',
      messages: [{ role: 'user', content: testPrompt }],
      temperature: 0.1,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5173',
        'X-Title': 'Flash Audit - Vulnerability Scanner'
      }
    });

    console.log('✅ Gemma model response status:', gemmaResponse.status);
    console.log('📝 Gemma response:', gemmaResponse.data.choices[0].message.content.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Gemma model test failed:', error.response?.status, error.response?.data || error.message);
  }
};

testOpenRouterAPI();
