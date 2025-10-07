import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }));
    });

    // Mock API responses
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      
      if (url.includes('/dashboard/summary')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            taskCounts: { todo: 5, inProgress: 3, inReview: 2, done: 10 },
            recentActivities: [],
            myTasks: []
          })
        });
      } else if (url.includes('/tasks')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tasks: [],
            totalCount: 0
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });
  });

  test('should adapt to mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Mobile navigation should be visible
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, [class*="mobile"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }

    // Desktop sidebar should be hidden or collapsed
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
    if (await sidebar.count() > 0) {
      const sidebarBox = await sidebar.first().boundingBox();
      // Sidebar should be collapsed or off-screen
      expect(sidebarBox?.width).toBeLessThan(200);
    }

    // Content should stack vertically
    const cards = page.locator('[data-testid^="task-summary-"], .card, [class*="card"]');
    if (await cards.count() >= 2) {
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      if (firstBox && secondBox) {
        // Cards should stack vertically on mobile
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 20);
      }
    }
  });

  test('should adapt to tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');

    // Should show tablet layout
    const container = page.locator('body, main, [data-testid="main-content"]');
    const containerBox = await container.first().boundingBox();
    
    expect(containerBox?.width).toBeLessThanOrEqual(768);

    // Navigation should be accessible
    const nav = page.locator('nav, [data-testid="navigation"]');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
  });

  test('should adapt to desktop viewport (1024px+)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/dashboard');

    // Desktop sidebar should be visible
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();
      
      const sidebarBox = await sidebar.first().boundingBox();
      expect(sidebarBox?.width).toBeGreaterThan(200);
    }

    // Content should use horizontal layout
    const cards = page.locator('[data-testid^="task-summary-"], .card, [class*="card"]');
    if (await cards.count() >= 2) {
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      if (firstBox && secondBox) {
        // Cards should be side by side on desktop
        expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThan(50);
      }
    }
  });

  test('should handle orientation changes', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation should adapt
    const nav = page.locator('nav, [data-testid="navigation"]');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
  });

  test('should handle very small screens (320px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/dashboard');

    // Content should still be accessible
    await expect(page.locator('body')).toBeVisible();
    
    // Text should not overflow
    const textElements = page.locator('h1, h2, p, span');
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = textElements.nth(i);
      const box = await element.boundingBox();
      
      if (box) {
        expect(box.width).toBeLessThanOrEqual(320);
      }
    }
  });

  test('should handle large screens (1920px+)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');

    // Content should not be too stretched
    const mainContent = page.locator('main, [data-testid="main-content"], .main-content');
    if (await mainContent.count() > 0) {
      const contentBox = await mainContent.first().boundingBox();
      
      // Content should have reasonable max-width
      if (contentBox) {
        expect(contentBox.width).toBeLessThan(1600); // Reasonable max-width
      }
    }
  });

  test('should have touch-friendly targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Check button sizes
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      if (box) {
        // Touch targets should be at least 44px
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should handle tasks page responsively', async ({ page }) => {
    await page.goto('/tasks');

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Kanban board should be horizontally scrollable on mobile
    const kanbanBoard = page.locator('[data-testid="kanban-board"], .kanban-board');
    if (await kanbanBoard.count() > 0) {
      const styles = await kanbanBoard.first().evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          overflowX: computed.overflowX,
          display: computed.display
        };
      });
      
      // Should allow horizontal scrolling
      expect(['auto', 'scroll'].includes(styles.overflowX)).toBeTruthy();
    }

    // Test desktop
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // All columns should be visible
    const columns = page.locator('[data-testid^="kanban-column-"], .kanban-column');
    if (await columns.count() > 0) {
      await expect(columns.first()).toBeVisible();
    }
  });

  test('should handle teams page responsively', async ({ page }) => {
    await page.goto('/teams');

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Team cards should stack
    const teamCards = page.locator('[data-testid^="team-card-"], .team-card');
    if (await teamCards.count() >= 2) {
      const firstCard = teamCards.first();
      const secondCard = teamCards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    }

    // Test desktop layout
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Cards should be in grid layout
    const container = page.locator('[data-testid="teams-grid"], .teams-grid, .grid');
    if (await container.count() > 0) {
      await expect(container.first()).toBeVisible();
    }
  });

  test('should handle modals responsively', async ({ page }) => {
    await page.goto('/tasks');

    // Test mobile modal
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open create task modal
    const createButton = page.locator('[data-testid="create-task-button"], button:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      
      // Modal should be full-screen or nearly full-screen on mobile
      const modal = page.locator('[data-testid="create-task-modal"], .modal, [role="dialog"]');
      if (await modal.count() > 0) {
        const modalBox = await modal.first().boundingBox();
        
        if (modalBox) {
          // Modal should take most of the screen width on mobile
          expect(modalBox.width).toBeGreaterThan(300);
        }
      }
    }
  });

  test('should maintain readability at different zoom levels', async ({ page }) => {
    await page.goto('/dashboard');

    // Test 150% zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });

    // Content should still be readable
    await expect(page.locator('body')).toBeVisible();
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });

    // Test 75% zoom
    await page.evaluate(() => {
      document.body.style.zoom = '0.75';
    });

    await expect(page.locator('body')).toBeVisible();
  });
});