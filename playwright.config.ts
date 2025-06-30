// =============================================
// NOVAGUARD PLAYWRIGHT CONFIGURATION
// End-to-end testing configuration
// =============================================

import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['line'],
    ...(process.env.CI ? [['github']] : [])
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Accept downloads */
    acceptDownloads: true,
    
    /* Locale */
    locale: 'en-US',
    
    /* Timezone */
    timezoneId: 'America/New_York',
    
    /* Geolocation */
    geolocation: { longitude: -74.006, latitude: 40.7128 }, // New York
    
    /* Permissions */
    permissions: ['clipboard-read', 'clipboard-write'],
    
    /* Color scheme */
    colorScheme: 'light',
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional Chrome-specific settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false
          }
        }
      },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },

    /* Accessibility testing */
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable accessibility tree
        launchOptions: {
          args: ['--force-renderer-accessibility']
        }
      },
      testMatch: '**/*accessibility*.spec.ts'
    },

    /* Performance testing */
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Performance-specific settings
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      testMatch: '**/*performance*.spec.ts'
    },

    /* API testing */
    {
      name: 'api',
      use: {
        // API testing doesn't need a browser
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
      },
      testMatch: '**/*api*.spec.ts'
    }
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./__tests__/setup/global-setup.ts'),
  globalTeardown: require.resolve('./__tests__/setup/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    env: {
      NODE_ENV: 'test',
    }
  },

  /* Test timeout */
  timeout: 60 * 1000, // 1 minute per test

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
    toHaveScreenshot: {
      mode: 'strict',
      threshold: 0.2,
      maxDiffPixels: 1000
    },
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 1000
    }
  },

  /* Output directory */
  outputDir: 'test-results/',

  /* Metadata */
  metadata: {
    'test-suite': 'NovaGuard E2E Tests',
    'version': '1.0.0',
    'environment': process.env.NODE_ENV || 'test'
  }
})
