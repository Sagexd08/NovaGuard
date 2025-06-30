// =============================================
// NOVAGUARD GLOBAL TEST SETUP
// Global setup for Jest testing environment
// =============================================

const { createClient } = require('@supabase/supabase-js')
const { spawn } = require('child_process')
const { promisify } = require('util')
const sleep = promisify(setTimeout)

// Test environment configuration
const TEST_CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
  },
  api: {
    url: process.env.TEST_API_URL || 'http://localhost:3000',
    timeout: 30000
  },
  database: {
    resetBetweenTests: true,
    seedData: true
  }
}

let supabaseProcess = null
let nextProcess = null

module.exports = async () => {
  console.log('🚀 Starting global test setup...')

  try {
    // 1. Start Supabase local instance
    await startSupabase()

    // 2. Setup test database
    await setupTestDatabase()

    // 3. Start Next.js development server
    await startNextServer()

    // 4. Wait for services to be ready
    await waitForServices()

    // 5. Seed test data
    await seedTestData()

    console.log('✅ Global test setup completed successfully')

  } catch (error) {
    console.error('❌ Global test setup failed:', error)
    await cleanup()
    process.exit(1)
  }
}

async function startSupabase() {
  console.log('📦 Starting Supabase local instance...')

  return new Promise((resolve, reject) => {
    supabaseProcess = spawn('supabase', ['start'], {
      stdio: 'pipe',
      env: { ...process.env, SUPABASE_DB_PASSWORD: 'test-password' }
    })

    let output = ''
    supabaseProcess.stdout.on('data', (data) => {
      output += data.toString()
      if (output.includes('Started supabase local development setup')) {
        resolve()
      }
    })

    supabaseProcess.stderr.on('data', (data) => {
      console.error('Supabase error:', data.toString())
    })

    supabaseProcess.on('error', (error) => {
      reject(new Error(`Failed to start Supabase: ${error.message}`))
    })

    // Timeout after 2 minutes
    setTimeout(() => {
      reject(new Error('Supabase startup timeout'))
    }, 120000)
  })
}

async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...')

  const supabase = createClient(
    TEST_CONFIG.supabase.url,
    TEST_CONFIG.supabase.serviceKey
  )

  try {
    // Run database migrations
    const { spawn } = require('child_process')
    
    await new Promise((resolve, reject) => {
      const migrationProcess = spawn('supabase', ['db', 'push'], {
        stdio: 'pipe'
      })

      migrationProcess.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Migration failed with code ${code}`))
        }
      })

      migrationProcess.on('error', reject)
    })

    // Verify database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error && !error.message.includes('relation "users" does not exist')) {
      throw error
    }

    console.log('✅ Test database setup completed')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  }
}

async function startNextServer() {
  console.log('⚡ Starting Next.js development server...')

  return new Promise((resolve, reject) => {
    nextProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '3000'
      }
    })

    let output = ''
    nextProcess.stdout.on('data', (data) => {
      output += data.toString()
      if (output.includes('Ready - started server on')) {
        resolve()
      }
    })

    nextProcess.stderr.on('data', (data) => {
      const message = data.toString()
      // Ignore common development warnings
      if (!message.includes('Warning:') && !message.includes('Note:')) {
        console.error('Next.js error:', message)
      }
    })

    nextProcess.on('error', (error) => {
      reject(new Error(`Failed to start Next.js: ${error.message}`))
    })

    // Timeout after 2 minutes
    setTimeout(() => {
      reject(new Error('Next.js startup timeout'))
    }, 120000)
  })
}

async function waitForServices() {
  console.log('⏳ Waiting for services to be ready...')

  // Wait for API to be responsive
  const maxRetries = 30
  let retries = 0

  while (retries < maxRetries) {
    try {
      const response = await fetch(`${TEST_CONFIG.api.url}/api/health`)
      if (response.ok) {
        console.log('✅ API is ready')
        break
      }
    } catch (error) {
      // Service not ready yet
    }

    retries++
    await sleep(1000)

    if (retries === maxRetries) {
      throw new Error('API failed to become ready within timeout')
    }
  }

  // Wait for Supabase to be responsive
  retries = 0
  const supabase = createClient(
    TEST_CONFIG.supabase.url,
    TEST_CONFIG.supabase.serviceKey
  )

  while (retries < maxRetries) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (!error || error.message.includes('relation "users" does not exist')) {
        console.log('✅ Supabase is ready')
        break
      }
    } catch (error) {
      // Service not ready yet
    }

    retries++
    await sleep(1000)

    if (retries === maxRetries) {
      throw new Error('Supabase failed to become ready within timeout')
    }
  }
}

async function seedTestData() {
  if (!TEST_CONFIG.database.seedData) {
    return
  }

  console.log('🌱 Seeding test data...')

  const supabase = createClient(
    TEST_CONFIG.supabase.url,
    TEST_CONFIG.supabase.serviceKey
  )

  try {
    // Create test users
    const testUsers = [
      {
        clerk_user_id: 'test-user-1',
        email: 'test1@novaguard.app',
        full_name: 'Test User 1',
        credits: 100
      },
      {
        clerk_user_id: 'test-user-2',
        email: 'test2@novaguard.app',
        full_name: 'Test User 2',
        credits: 50
      }
    ]

    const { error: usersError } = await supabase
      .from('users')
      .upsert(testUsers, { onConflict: 'clerk_user_id' })

    if (usersError) {
      console.warn('Warning: Could not seed users:', usersError.message)
    }

    // Create test API keys
    const testApiKeys = [
      {
        key: 'test-api-key-1',
        user_id: 'test-user-1',
        name: 'Test API Key 1',
        is_active: true,
        rate_limit: 1000
      },
      {
        key: 'test-api-key-2',
        user_id: 'test-user-2',
        name: 'Test API Key 2',
        is_active: true,
        rate_limit: 500
      }
    ]

    const { error: apiKeysError } = await supabase
      .from('api_keys')
      .upsert(testApiKeys, { onConflict: 'key' })

    if (apiKeysError) {
      console.warn('Warning: Could not seed API keys:', apiKeysError.message)
    }

    // Create test knowledge documents
    const testDocuments = [
      {
        id: 'test-doc-1',
        title: 'Reentrancy Attacks',
        content: 'Reentrancy attacks occur when external contract calls...',
        type: 'vulnerability',
        source: 'test',
        embedding: new Array(1536).fill(0.1) // Mock embedding
      },
      {
        id: 'test-doc-2',
        title: 'Gas Optimization Techniques',
        content: 'Gas optimization is crucial for efficient smart contracts...',
        type: 'optimization',
        source: 'test',
        embedding: new Array(1536).fill(0.2) // Mock embedding
      }
    ]

    const { error: docsError } = await supabase
      .from('knowledge_documents')
      .upsert(testDocuments, { onConflict: 'id' })

    if (docsError) {
      console.warn('Warning: Could not seed knowledge documents:', docsError.message)
    }

    console.log('✅ Test data seeded successfully')

  } catch (error) {
    console.warn('Warning: Test data seeding failed:', error.message)
    // Don't fail the setup if seeding fails
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test environment...')

  if (nextProcess) {
    nextProcess.kill('SIGTERM')
    nextProcess = null
  }

  if (supabaseProcess) {
    supabaseProcess.kill('SIGTERM')
    supabaseProcess = null
  }

  // Stop Supabase services
  try {
    spawn('supabase', ['stop'], { stdio: 'ignore' })
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Handle process termination
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('exit', cleanup)
