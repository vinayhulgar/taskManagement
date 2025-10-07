import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
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
    await page.route('**/api/dashboard/summary', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          taskCounts: {
            todo: 5,
            inProgress: 3,
            inReview: 2,
            done: 10
          },
          recentActivities: [
            {
              id: 1,
              type: 'task_created',
              message: 'Task "Implement login" was created',
              timestamp: new Date().toISOString(),
              user: { firstName: 'John', lastName: 'Doe' }
            }
          ],
          myTasks: [
            {
              id: 1,
              title: 'Implement authentication',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              dueDate: new Date(Date.now() + 86400000).toISOString()
            }
          ]
        })
      });
    });

    await page.goto('/dashboard');
  });

  test('should display dashboard with summary cards', async ({ page }) => {
    // Check for task summary cards
    await expect(page.locator('[data-testid="task-summary-todo"]')).toContainText('5');
    await expect(page.locator('[data-testid="task-summary-in-progress"]')).toContainText('3');
    await expect(page.locator('[data-testid="task-summary-in-review"]')).toContainText('2');
    await expect(page.locator('[data-testid="task-summary-done"]')).toContainText('10');
  });

  test('should display recent activities', async ({ page }) => {
    // Check for recent activities section
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
    await expect(page.locator('text=Task "Implement login" was created')).toBeVisible();
  });

  test('should display my tasks widget', async ({ page }) => {
    // Check for my tasks widget
    await expect(page.locator('[data-testid="my-tasks-widget"]')).toBeVisible();
    await expect(page.locator('text=Implement authentication')).toBeVisible();
  });

  test('should navigate to tasks page from my tasks widget', async ({ page }) => {
    // Click on a task in my tasks widget
    await page.click('text=Implement authentication');
    
    // Should navigate to tasks page or open task detail
    await expect(page).toHaveURL(/.*\/(tasks|dashboard)/);
  });

  test('should handle loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/dashboard/summary', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          taskCounts: { todo: 0, inProgress: 0, inReview: 0, done: 0 },
          recentActivities: [],
          myTasks: []
        })
      });
    });

    await page.goto('/dashboard');
    
    // Should show loading skeletons
    await expect(page.locator('[data-testid="dashboard-skeleton"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/dashboard/summary', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' })
      });
    });

    await page.goto('/dashboard');
    
    // Should show error state
    await expect(page.locator('[data-testid="dashboard-error"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should adapt to mobile layout
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    
    // Cards should stack vertically
    const cards = page.locator('[data-testid^="task-summary-"]');
    const firstCard = cards.first();
    const secondCard = cards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // Second card should be below first card (not side by side)
    expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0);
  });
});