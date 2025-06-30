// Simple test endpoint to check authentication
const { withAuth } = require('./middleware/auth');

const testAuthHandler = async (req, res) => {
  try {
    console.log('🔍 Test auth request received');
    console.log('🔧 Development mode:', process.env.DEVELOPMENT_MODE);
    console.log('🔧 Node env:', process.env.NODE_ENV);
    console.log('🔐 Auth object:', req.auth);
    
    const { userId, email } = req.auth;

    res.status(200).json({
      success: true,
      message: 'Authentication working',
      user: {
        userId,
        email
      },
      environment: {
        developmentMode: process.env.DEVELOPMENT_MODE,
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = withAuth(testAuthHandler);
