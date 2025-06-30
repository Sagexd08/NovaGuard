// =============================================
// NOVAGUARD E2E TESTS - AUDIT FLOW
// End-to-end testing for complete audit workflow
// =============================================

import { test, expect, Page } from '@playwright/test'

// Test configuration
const TEST_CONTRACT_CODE = `
pragma solidity ^0.8.0;

contract TestContract {
    uint256 public value;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function setValue(uint256 _value) public onlyOwner {
        value = _value;
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
    
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
`

test.describe('Audit Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should complete full audit workflow', async ({ page }) => {
    // Step 1: Navigate to audit page
    await page.click('[data-testid="audit-nav-link"]')
    await expect(page).toHaveURL(/.*\/audit/)

    // Step 2: Enter contract code
    await page.fill('[data-testid="code-editor"]', TEST_CONTRACT_CODE)
    
    // Step 3: Select analysis type
    await page.click('[data-testid="analysis-type-select"]')
    await page.click('[data-testid="analysis-type-comprehensive"]')

    // Step 4: Configure options
    await page.check('[data-testid="include-gas-analysis"]')
    await page.check('[data-testid="include-mev-analysis"]')

    // Step 5: Start analysis
    await page.click('[data-testid="start-analysis-button"]')

    // Step 6: Wait for analysis to complete
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('Processing...', { timeout: 5000 })
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('Completed', { timeout: 30000 })

    // Step 7: Verify results are displayed
    await expect(page.locator('[data-testid="security-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="gas-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible()

    // Step 8: Check vulnerabilities section
    const vulnerabilitiesSection = page.locator('[data-testid="vulnerabilities-section"]')
    await expect(vulnerabilitiesSection).toBeVisible()

    // Step 9: Check gas optimizations section
    const gasOptimizationsSection = page.locator('[data-testid="gas-optimizations-section"]')
    await expect(gasOptimizationsSection).toBeVisible()

    // Step 10: Check recommendations section
    const recommendationsSection = page.locator('[data-testid="recommendations-section"]')
    await expect(recommendationsSection).toBeVisible()

    // Step 11: Export report
    await page.click('[data-testid="export-report-button"]')
    await page.click('[data-testid="export-pdf"]')
    
    // Wait for download to start
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/audit-report.*\.pdf/)
  })

  test('should handle file upload', async ({ page }) => {
    await page.goto('/audit')

    // Create a test file
    const fileContent = TEST_CONTRACT_CODE
    const fileName = 'TestContract.sol'

    // Upload file
    const fileInput = page.locator('[data-testid="file-upload-input"]')
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    })

    // Verify file is uploaded and processed
    await expect(page.locator('[data-testid="uploaded-file"]')).toContainText(fileName)
    await expect(page.locator('[data-testid="file-status"]')).toHaveText('Processed')

    // Verify code is loaded in editor
    const editorContent = await page.locator('[data-testid="code-editor"]').inputValue()
    expect(editorContent).toContain('TestContract')
  })

  test('should validate contract code', async ({ page }) => {
    await page.goto('/audit')

    // Test empty code validation
    await page.click('[data-testid="start-analysis-button"]')
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Contract code is required')

    // Test invalid code validation
    await page.fill('[data-testid="code-editor"]', 'invalid solidity code')
    await page.click('[data-testid="start-analysis-button"]')
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid Solidity code')

    // Test valid code
    await page.fill('[data-testid="code-editor"]', TEST_CONTRACT_CODE)
    await page.click('[data-testid="start-analysis-button"]')
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()
  })

  test('should display real-time analysis progress', async ({ page }) => {
    await page.goto('/audit')
    await page.fill('[data-testid="code-editor"]', TEST_CONTRACT_CODE)
    await page.click('[data-testid="start-analysis-button"]')

    // Check progress indicators
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
    await expect(page.locator('[data-testid="progress-percentage"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible()

    // Wait for completion
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('Completed', { timeout: 30000 })
    await expect(page.locator('[data-testid="progress-bar"]')).not.toBeVisible()
  })

  test('should handle analysis errors gracefully', async ({ page }) => {
    await page.goto('/audit')

    // Simulate network error by intercepting API calls
    await page.route('/api/audit/analyze', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    await page.fill('[data-testid="code-editor"]', TEST_CONTRACT_CODE)
    await page.click('[data-testid="start-analysis-button"]')

    // Check error handling
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Analysis failed')
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()

    // Test retry functionality
    await page.unroute('/api/audit/analyze')
    await page.click('[data-testid="retry-button"]')
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('Processing...')
  })

  test('should save and load audit history', async ({ page }) => {
    // Complete an audit first
    await page.goto('/audit')
    await page.fill('[data-testid="code-editor"]', TEST_CONTRACT_CODE)
    await page.click('[data-testid="start-analysis-button"]')
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('Completed', { timeout: 30000 })

    // Navigate to history
    await page.click('[data-testid="history-nav-link"]')
    await expect(page).toHaveURL(/.*\/history/)

    // Verify audit appears in history
    await expect(page.locator('[data-testid="audit-history-item"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="audit-history-item"]').first()).toContainText('TestContract')

    // Load audit from history
    await page.click('[data-testid="load-audit-button"]')
    await expect(page).toHaveURL(/.*\/audit/)
    
    // Verify code is loaded
    const editorContent = await page.locator('[data-testid="code-editor"]').inputValue()
    expect(editorContent).toContain('TestContract')
  })

  test('should filter and search audit results', async ({ page }) => {
    await page.goto('/audit')
    await page.fill('[data-testid="code-editor"]', TEST_CONTRACT_CODE)
    await page.click('[data-testid="start-analysis-button"]')
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('Completed', { timeout: 30000 })

    // Test severity filter
    await page.click('[data-testid="severity-filter"]')
    await page.click('[data-testid="severity-high"]')
    
    // Verify only high severity issues are shown
    const visibleIssues = page.locator('[data-testid="vulnerability-item"]:visible')
    const count = await visibleIssues.count()
    for (let i = 0; i < count; i++) {
      await expect(visibleIssues.nth(i).locator('[data-testid="severity-badge"]')).toHaveText('High')
    }

    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'owner')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Verify search results
    const searchResults = page.locator('[data-testid="search-result"]')
    await expect(searchResults.first()).toBeVisible()
  })

  test('should handle collaborative features', async ({ page, context }) => {
    // Create a second page for collaboration testing
    const page2 = await context.newPage()
    
    await page.goto('/audit')
    await page2.goto('/audit')

    // Start collaboration session
    await page.click('[data-testid="start-collaboration-button"]')
    await page.fill('[data-testid="session-name"]', 'Test Collaboration')
    await page.click('[data-testid="create-session-button"]')

    // Get session URL
    const sessionUrl = await page.locator('[data-testid="session-url"]').textContent()
    
    // Join session from second page
    await page2.goto(sessionUrl!)
    await expect(page2.locator('[data-testid="collaboration-status"]')).toHaveText('Connected')

    // Test real-time code sharing
    await page.fill('[data-testid="code-editor"]', 'pragma solidity ^0.8.0;')
    
    // Verify code appears on second page
    await expect(page2.locator('[data-testid="code-editor"]')).toHaveValue('pragma solidity ^0.8.0;')

    // Test comments
    await page.click('[data-testid="add-comment-button"]')
    await page.fill('[data-testid="comment-input"]', 'This is a test comment')
    await page.click('[data-testid="submit-comment-button"]')

    // Verify comment appears on both pages
    await expect(page.locator('[data-testid="comment"]')).toContainText('This is a test comment')
    await expect(page2.locator('[data-testid="comment"]')).toContainText('This is a test comment')
  })

  test('should handle mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/audit')

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible()

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Test mobile code editor
    await page.fill('[data-testid="code-editor"]', TEST_CONTRACT_CODE)
    await page.click('[data-testid="start-analysis-button"]')
    
    // Verify mobile results layout
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('Completed', { timeout: 30000 })
    await expect(page.locator('[data-testid="mobile-results-tabs"]')).toBeVisible()
  })

  test('should handle accessibility requirements', async ({ page }) => {
    await page.goto('/audit')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'code-editor')

    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'analysis-type-select')

    // Test screen reader support
    await expect(page.locator('[data-testid="code-editor"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="start-analysis-button"]')).toHaveAttribute('aria-describedby')

    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('body')).toHaveClass(/dark/)
  })

  test('should handle performance requirements', async ({ page }) => {
    await page.goto('/audit')

    // Measure page load time
    const startTime = Date.now()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000) // Page should load within 3 seconds

    // Test large contract handling
    const largeContract = TEST_CONTRACT_CODE.repeat(100)
    await page.fill('[data-testid="code-editor"]', largeContract)

    // Verify editor remains responsive
    const editorResponseTime = await page.evaluate(() => {
      const start = performance.now()
      // Simulate typing
      const editor = document.querySelector('[data-testid="code-editor"]') as HTMLTextAreaElement
      editor.value += ' // test'
      return performance.now() - start
    })

    expect(editorResponseTime).toBeLessThan(100) // Editor should respond within 100ms
  })
})
