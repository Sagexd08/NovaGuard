// =============================================
// NOVAGUARD JEST CONFIGURATION
// Testing configuration for unit and integration tests
// =============================================

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapping
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/functions/(.*)$': '<rootDir>/functions/$1',
    
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle image imports
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
    
    // Handle font imports
    '^.+\\.(woff|woff2|eot|ttf|otf)$/i': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/e2e/',
    '<rootDir>/out/',
    '<rootDir>/build/'
  ],
  
  // Transform patterns
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'functions/src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/*.config.{js,ts}',
    '!**/types/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './lib/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './functions/src/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/__tests__/setup/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/setup/globalTeardown.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: 'coverage/html-report',
        filename: 'report.html',
        expand: true,
      },
    ],
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Snapshot serializers
  snapshotSerializers: ['enzyme-to-json/serializer'],
  
  // Max workers
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Notify mode
  notify: false,
  
  // Bail on first test failure
  bail: false,
  
  // Force exit after tests complete
  forceExit: false,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Detect leaked timers
  detectLeakedTimers: true,
  
  // Projects for multi-project setup
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup/integration.setup.js'],
    },
    {
      displayName: 'functions',
      testMatch: ['<rootDir>/functions/__tests__/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup/functions.setup.js'],
    },
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
