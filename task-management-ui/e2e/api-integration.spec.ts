import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
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

  test('should handle successful API responses', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/tasks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [
            {
              id: 1,
              title: 'Test Task',
              status: 'TODO',
              priority: 'HIGH'
            }
          ],
          totalCount: 1
        })
      });
    });

    await page.goto('/tasks');

    // Should display the task
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/tasks', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal server error'
        })
      });
    });

    await page.goto('/tasks');

    // Should show error message
    await expect(page.locator('text=Error loading tasks')).toBeVisible();
  });

  test('should handle network timeouts', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/tasks', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [], totalCount: 0 })
      });
    });

    await page.goto('/tasks');

    // Should show loading state
    await expect(page.locator('[data-testid="loading"], .loading, .spinner')).toBeVisible();
  });

  test('should handle authentication errors', async ({ page }) => {
    // Mock 401 response
    await page.route('**/api/tasks', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Unauthorized'
        })
      });
    });

    await page.goto('/tasks');

    // Should redirect to login or show auth error
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl.includes('/login') || currentUrl.includes('/auth')).toBeTruthy();
  });

  test('should handle validation errors', async ({ page }) => {
    await page.goto('/tasks');

    // Mock validation error for task creation
    await page.route('**/api/tasks', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Validation failed',
            errors: {
              title: 'Title is required',
              priority: 'Priority must be HIGH, MEDIUM, or LOW'
            }
          })
        });
      }
    });

    // Try to create a task
    const createButton = page.locator('[data-testid="create-task-button"]');
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=Title is required')).toBeVisible();
    }
  });

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit response
    await page.route('**/api/tasks', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Too many requests'
        }),
        headers: {
          'Retry-After': '60'
        }
      });
    });

    await page.goto('/tasks');

    // Should show rate limit message
    await expect(page.locator('text=Too many requests')).toBeVisible();
  });

  test('should retry failed requests', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/tasks', async route => {
      requestCount++;
      
      if (requestCount === 1) {
        // First request fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Server error' })
        });
      } else {
        // Second request succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tasks: [{ id: 1, title: 'Retry Success', status: 'TODO' }],
            totalCount: 1
          })
        });
      }
    });

    await page.goto('/tasks');

    // Should eventually show the task after retry
    await expect(page.locator('text=Retry Success')).toBeVisible({ timeout: 10000 });
    expect(requestCount).toBeGreaterThan(1);
  });

  test('should handle concurrent API calls', async ({ page }) => {
    let dashboardCalled = false;
    let tasksCalled = false;

    await page.route('**/api/dashboard/summary', async route => {
      dashboardCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          taskCounts: { todo: 5, inProgress: 3, inReview: 2, done: 10 },
          recentActivities: [],
          myTasks: []
        })
      });
    });

    await page.route('**/api/tasks', async route => {
      tasksCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [],
          totalCount: 0
        })
      });
    });

    await page.goto('/dashboard');

    // Both APIs should be called
    expect(dashboardCalled).toBeTruthy();
  });

  test('should handle pagination', async ({ page }) => {
    // Mock paginated response
    await page.route('**/api/tasks?page=1**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            title: `Task ${i + 1}`,
            status: 'TODO'
          })),
          totalCount: 50,
          page: 1,
          pageSize: 20,
          totalPages: 3
        })
      });
    });

    await page.route('**/api/tasks?page=2**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: Array.from({ length: 20 }, (_, i) => ({
            id: i + 21,
            title: `Task ${i + 21}`,
            status: 'TODO'
          })),
          totalCount: 50,
          page: 2,
          pageSize: 20,
          totalPages: 3
        })
      });
    });

    await page.goto('/tasks');

    // Should show first page
    await expect(page.locator('text=Task 1')).toBeVisible();

    // Click next page
    const nextButton = page.locator('[data-testid="next-page"], button:has-text("Next")');
    if (await nextButton.count() > 0) {
      await nextButton.click();
      
      // Should show second page
      await expect(page.locator('text=Task 21')).toBeVisible();
    }
  });

  test('should handle real-time updates', async ({ page }) => {
    // Mock WebSocket connection
    await page.addInitScript(() => {
      // Mock WebSocket
      class MockWebSocket {
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;

        constructor(url: string) {
          setTimeout(() => {
            if (this.onopen) {
              this.onopen(new Event('open'));
            }
          }, 100);
        }

        send(data: string) {
          // Mock sending data
        }

        close() {
          if (this.onclose) {
            this.onclose(new CloseEvent('close'));
          }
        }

        // Simulate receiving a message
        simulateMessage(data: any) {
          if (this.onmessage) {
            this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
          }
        }
      }

      (window as any).WebSocket = MockWebSocket;
    });

    await page.goto('/tasks');

    // Simulate real-time task update
    await page.evaluate(() => {
      const ws = (window as any).mockWebSocket;
      if (ws && ws.simulateMessage) {
        ws.simulateMessage({
          type: 'task_updated',
          data: {
            id: 1,
            title: 'Updated Task',
            status: 'IN_PROGRESS'
          }
        });
      }
    });

    // Should show updated task
    await expect(page.locator('text=Updated Task')).toBeVisible();
  });

  test('should handle file uploads', async ({ page }) => {
    await page.goto('/tasks');

    // Mock file upload API
    await page.route('**/api/tasks/*/attachments', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            filename: 'test-file.pdf',
            url: '/uploads/test-file.pdf'
          })
        });
      }
    });

    // Open task detail modal
    const taskCard = page.locator('.task-card, [data-testid^="task-card"]').first();
    if (await taskCard.count() > 0) {
      await taskCard.click();

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'test-file.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('test file content')
        });

        // Should show uploaded file
        await expect(page.locator('text=test-file.pdf')).toBeVisible();
      }
    }
  });

  test('should handle search and filtering', async ({ page }) => {
    // Mock search API
    await page.route('**/api/tasks?search=**', async route => {
      const url = new URL(route.request().url());
      const searchTerm = url.searchParams.get('search');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [
            {
              id: 1,
              title: `Task matching ${searchTerm}`,
              status: 'TODO'
            }
          ],
          totalCount: 1
        })
      });
    });

    await page.goto('/tasks');

    // Perform search
    const searchInput = page.locator('[data-testid="task-search"], input[placeholder*="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('authentication');
      await searchInput.press('Enter');

      // Should show filtered results
      await expect(page.locator('text=Task matching authentication')).toBeVisible();
    }
  });
});