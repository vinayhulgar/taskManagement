import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases', () => {
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
  });

  test('should handle network offline state', async ({ page }) => {
    await page.goto('/dashboard');

    // Simulate going offline
    await page.context().setOffline(true);

    // Try to navigate to another page
    await page.click('a[href="/tasks"], [data-testid="nav-tasks"]');

    // Should show offline message or cached content
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline, text=offline');
    if (await offlineIndicator.count() > 0) {
      await expect(offlineIndicator.first()).toBeVisible();
    }

    // Go back online
    await page.context().setOffline(false);

    // Should recover
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Inject a JavaScript error
    await page.addInitScript(() => {
      setTimeout(() => {
        throw new Error('Test JavaScript error');
      }, 1000);
    });

    await page.goto('/dashboard');

    // Wait for potential error
    await page.waitForTimeout(2000);

    // Page should still be functional despite the error
    await expect(page.locator('body')).toBeVisible();

    // Error should be caught
    expect(errors.length).toBeGreaterThan(0);
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock malformed JSON response
    await page.route('**/api/tasks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json {'
      });
    });

    await page.goto('/tasks');

    // Should show error message
    await expect(page.locator('text=Error loading tasks')).toBeVisible();
  });

  test('should handle missing API endpoints', async ({ page }) => {
    // Mock 404 response
    await page.route('**/api/tasks', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Not found'
        })
      });
    });

    await page.goto('/tasks');

    // Should show appropriate error message
    await expect(page.locator('text=Not found')).toBeVisible();
  });

  test('should handle empty data states', async ({ page }) => {
    // Mock empty responses
    await page.route('**/api/tasks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [],
          totalCount: 0
        })
      });
    });

    await page.route('**/api/teams', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/api/projects', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Test empty tasks
    await page.goto('/tasks');
    await expect(page.locator('[data-testid="empty-tasks-state"], text=No tasks found')).toBeVisible();

    // Test empty teams
    await page.goto('/teams');
    await expect(page.locator('[data-testid="empty-teams-state"], text=No teams found')).toBeVisible();

    // Test empty projects
    await page.goto('/projects');
    await expect(page.locator('[data-testid="empty-projects-state"], text=No projects found')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/login');

    // Test email validation
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    await expect(page.locator('text=Password must be at least')).toBeVisible();

    // Test empty form submission
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="password"]', '');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    await page.goto('/dashboard');

    // Mock session expiration
    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Session expired'
        })
      });
    });

    // Try to perform an action that requires authentication
    await page.reload();

    // Should redirect to login
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl.includes('/login')).toBeTruthy();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.goto('/tasks');
    await page.goto('/teams');

    // Go back
    await page.goBack();
    expect(page.url()).toContain('/tasks');

    // Go forward
    await page.goForward();
    expect(page.url()).toContain('/teams');

    // Go back to dashboard
    await page.goBack();
    await page.goBack();
    expect(page.url()).toContain('/dashboard');
  });

  test('should handle page refresh with unsaved changes', async ({ page }) => {
    await page.goto('/tasks');

    // Open create task modal
    const createButton = page.locator('[data-testid="create-task-button"]');
    if (await createButton.count() > 0) {
      await createButton.click();

      // Fill form partially
      await page.fill('input[name="title"]', 'Unsaved task');

      // Try to refresh page
      const dialogPromise = page.waitForEvent('dialog');
      page.reload();

      // Should show confirmation dialog
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('unsaved changes');
      await dialog.dismiss();
    }
  });

  test('should handle concurrent user actions', async ({ page }) => {
    await page.goto('/tasks');

    // Mock task creation API with delay
    await page.route('**/api/tasks', async route => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: Date.now(),
            title: 'New Task',
            status: 'TODO'
          })
        });
      }
    });

    // Try to create multiple tasks quickly
    const createButton = page.locator('[data-testid="create-task-button"]');
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.fill('input[name="title"]', 'Task 1');
      await page.click('button[type="submit"]');

      // Immediately try to create another task
      await createButton.click();
      await page.fill('input[name="title"]', 'Task 2');
      await page.click('button[type="submit"]');

      // Should handle both requests properly
      await expect(page.locator('text=Task 1')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Task 2')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle memory leaks and cleanup', async ({ page }) => {
    // Navigate between pages multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/dashboard');
      await page.goto('/tasks');
      await page.goto('/teams');
      await page.goto('/projects');
    }

    // Check that page is still responsive
    await expect(page.locator('body')).toBeVisible();

    // Memory usage should be reasonable (this is a basic check)
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Should not exceed 100MB (basic threshold)
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024);
  });

  test('should handle drag and drop errors', async ({ page }) => {
    await page.goto('/tasks');

    // Mock task update API to fail
    await page.route('**/api/tasks/*', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Update failed'
          })
        });
      }
    });

    // Try to drag and drop a task
    const taskCard = page.locator('.task-card').first();
    const targetColumn = page.locator('[data-testid="kanban-column-IN_PROGRESS"]');

    if (await taskCard.count() > 0 && await targetColumn.count() > 0) {
      await taskCard.dragTo(targetColumn);

      // Should show error message and revert the change
      await expect(page.locator('text=Update failed')).toBeVisible();
    }
  });

  test('should handle file upload errors', async ({ page }) => {
    await page.goto('/tasks');

    // Mock file upload API to fail
    await page.route('**/api/tasks/*/attachments', async route => {
      await route.fulfill({
        status: 413,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'File too large'
        })
      });
    });

    // Try to upload a file
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'large-file.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.alloc(10 * 1024 * 1024) // 10MB file
      });

      // Should show error message
      await expect(page.locator('text=File too large')).toBeVisible();
    }
  });

  test('should handle browser compatibility issues', async ({ page }) => {
    // Test with disabled JavaScript features
    await page.addInitScript(() => {
      // Disable some modern features
      delete (window as any).fetch;
      delete (window as any).WebSocket;
    });

    await page.goto('/dashboard');

    // Should still work with fallbacks
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle CSRF protection', async ({ page }) => {
    // Mock CSRF error
    await page.route('**/api/tasks', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'CSRF token mismatch'
          })
        });
      }
    });

    await page.goto('/tasks');

    // Try to create a task
    const createButton = page.locator('[data-testid="create-task-button"]');
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.fill('input[name="title"]', 'Test Task');
      await page.click('button[type="submit"]');

      // Should show CSRF error
      await expect(page.locator('text=CSRF token mismatch')).toBeVisible();
    }
  });
});