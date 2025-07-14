import { test, expect } from '@playwright/test'

test.describe('Bulk Actions System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            role: 'admin'
          }
        })
      })
    })

    // Navigate to bulk actions demo page
    await page.goto('/configuracoes/bulk-actions')
    await page.waitForLoadState('networkidle')
  })

  test('should display bulk actions demo page', async ({ page }) => {
    await expect(page.getByText('Sistema de Bulk Actions')).toBeVisible()
    await expect(page.getByText('Demonstração de seleção múltipla')).toBeVisible()
  })

  test('should select individual items', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    // Select first item
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Verify selection
    await expect(firstCheckbox).toBeChecked()
    await expect(page.getByText('1 selecionado')).toBeVisible()
  })

  test('should select all items', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    // Click select all checkbox
    const selectAllCheckbox = page.getByRole('checkbox').first()
    await selectAllCheckbox.check()
    
    // Verify all items are selected
    await expect(page.getByText(/\d+ selecionados/)).toBeVisible()
    
    // Verify toolbar appears
    await expect(page.getByText('Excluir')).toBeVisible()
    await expect(page.getByText('Ativar')).toBeVisible()
  })

  test('should show bulk actions toolbar when items are selected', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    // Select an item
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Verify toolbar is visible
    await expect(page.getByText('Excluir')).toBeVisible()
    await expect(page.getByText('Ativar')).toBeVisible()
    await expect(page.getByText('Duplicar')).toBeVisible()
  })

  test('should execute bulk delete action', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    const itemCount = await page.locator('[data-testid="demo-item"]').count()
    
    // Select first item
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept())
    
    // Click delete button
    await page.getByText('Excluir').click()
    
    // Verify item was removed
    await page.waitForTimeout(1000) // Wait for action to complete
    const newItemCount = await page.locator('[data-testid="demo-item"]').count()
    expect(newItemCount).toBe(itemCount - 1)
  })

  test('should execute bulk activate action', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    // Select first item
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Click activate button
    await page.getByText('Ativar').click()
    
    // Verify status changed (if visible in UI)
    await page.waitForTimeout(1000)
    await expect(page.getByText('ativo')).toBeVisible()
  })

  test('should export selected items', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    // Select items
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click export/download button
    await page.getByText('Baixar').click()
    
    // Wait for download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/bulk_export_.*\.csv/)
  })

  test('should clear selection', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    // Select items
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Verify toolbar is visible
    await expect(page.getByText('1 selecionado')).toBeVisible()
    
    // Click clear button (X)
    await page.locator('button svg[data-lucide="x"]').click()
    
    // Verify selection is cleared
    await expect(firstCheckbox).not.toBeChecked()
    await expect(page.getByText('selecionado')).not.toBeVisible()
  })

  test('should handle range selection with Shift+Click', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    // Select first item
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Shift+click on third item to select range
    const thirdCheckbox = page.locator('[data-testid="demo-item"]:nth-child(3) input[type="checkbox"]')
    await thirdCheckbox.click({ modifiers: ['Shift'] })
    
    // Verify range is selected
    const selectedCount = await page.locator('input[type="checkbox"]:checked').count()
    expect(selectedCount).toBeGreaterThan(1)
  })

  test('should show percentage of selected items', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    const totalItems = await page.locator('[data-testid="demo-item"]').count()
    
    // Select first item
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Calculate expected percentage
    const expectedPercentage = Math.round((1 / totalItems) * 100)
    
    // Verify percentage is shown
    await expect(page.getByText(`${expectedPercentage}% do total`)).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to page
    await page.goto('/configuracoes/bulk-actions')
    await page.waitForLoadState('networkidle')
    
    // Verify page loads correctly on mobile
    await expect(page.getByText('Sistema de Bulk Actions')).toBeVisible()
    
    // Select an item
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Verify toolbar adapts to mobile
    await expect(page.getByText('Excluir')).toBeVisible()
  })

  test('should handle confirmation dialogs correctly', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="demo-item"]', { state: 'visible' })
    
    // Select item
    const firstCheckbox = page.locator('[data-testid="demo-item"]:first-child input[type="checkbox"]')
    await firstCheckbox.check()
    
    // Test cancelling confirmation
    page.on('dialog', dialog => dialog.dismiss())
    await page.getByText('Excluir').click()
    
    // Verify item is still there (action was cancelled)
    await expect(firstCheckbox).toBeChecked()
    
    // Test accepting confirmation
    page.removeAllListeners('dialog')
    page.on('dialog', dialog => dialog.accept())
    await page.getByText('Excluir').click()
    
    // Verify action was executed
    await page.waitForTimeout(1000)
    await expect(page.getByText('selecionado')).not.toBeVisible()
  })
}) 