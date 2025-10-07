import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
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

    // Mock tasks API
    await page.route('**/api/tasks**', async route => {
      const url = route.request().url();
      
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tasks: [
              {
                id: 1,
                title: 'Implement authentication',
                description: 'Add login and registration functionality',
                status: 'TODO',
                priority: 'HIGH',
                assigneeId: 1,
                projectId: 1,
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                createdAt: new Date().toISOString()
              },
              {
                id: 2,
                title: 'Design dashboard',
                description: 'Create wireframes and mockups',
                status: 'IN_PROGRESS',
                priority: 'MEDIUM',
                assigneeId: 1,
                projectId: 1,
                dueDate: new Date(Date.now() + 172800000).toISOString(),
                createdAt: new Date().toISOString()
              }
            ],
            totalCount: 2,
            page: 1,
            pageSize: 20
          })
        });
      } else if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('/tasks');
  });

  test('should display tasks in Kanban board', async ({ page }) => {
    // Check for Kanban columns
    await expect(page.locator('[data-testid="kanban-column-TODO"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-IN_PROGRESS"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-IN_REVIEW"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-DONE"]')).toBeVisible();

    // Check for task cards
    await expect(page.locator('text=Implement authentication')).toBeVisible();
    await expect(page.locator('text=Design dashboard')).toBeVisible();
  });

  test('should switch between Kanban and list view', async ({ page }) => {
    // Should start in Kanban view
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();

    // Switch to list view
    await page.click('[data-testid="view-toggle-list"]');
    await expect(page.locator('[data-testid="task-list-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-board"]')).not.toBeVisible();

    // Switch back to Kanban view
    await page.click('[data-testid="view-toggle-kanban"]');
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-list-view"]')).not.toBeVisible();
  });

  test('should open create task modal', async ({ page }) => {
    // Click create task button
    await page.click('[data-testid="create-task-button"]');

    // Modal should open
    await expect(page.locator('[data-testid="create-task-modal"]')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('select[name="priority"]')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    // Open create task modal
    await page.click('[data-testid="create-task-button"]');

    // Fill task details
    await page.fill('input[name="title"]', 'New Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task description');
    await page.selectOption('select[name="priority"]', 'HIGH');

    // Submit form
    await page.click('button[type="submit"]');

    // Modal should close and task should appear
    await expect(page.locator('[data-testid="create-task-modal"]')).not.toBeVisible();
    await expect(page.locator('text=New Test Task')).toBeVisible();
  });

  test('should validate task creation form', async ({ page }) => {
    // Open create task modal
    await page.click('[data-testid="create-task-button"]');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
  });

  test('should open task detail modal', async ({ page }) => {
    // Click on a task card
    await page.click('text=Implement authentication');

    // Task detail modal should open
    await expect(page.locator('[data-testid="task-detail-modal"]')).toBeVisible();
    await expect(page.locator('text=Implement authentication')).toBeVisible();
    await expect(page.locator('text=Add login and registration functionality')).toBeVisible();
  });

  test('should filter tasks', async ({ page }) => {
    // Open filters
    await page.click('[data-testid="task-filters-toggle"]');

    // Filter by status
    await page.click('[data-testid="filter-status-TODO"]');

    // Should only show TODO tasks
    await expect(page.locator('text=Implement authentication')).toBeVisible();
    await expect(page.locator('text=Design dashboard')).not.toBeVisible();
  });

  test('should search tasks', async ({ page }) => {
    // Use search input
    await page.fill('[data-testid="task-search"]', 'authentication');

    // Should filter tasks by search term
    await expect(page.locator('text=Implement authentication')).toBeVisible();
    await expect(page.locator('text=Design dashboard')).not.toBeVisible();
  });

  test('should drag and drop tasks between columns', async ({ page }) => {
    const taskCard = page.locator('text=Implement authentication').first();
    const inProgressColumn = page.locator('[data-testid="kanban-column-IN_PROGRESS"]');

    // Drag task from TODO to IN_PROGRESS
    await taskCard.dragTo(inProgressColumn);

    // Task should move to IN_PROGRESS column
    const inProgressTasks = page.locator('[data-testid="kanban-column-IN_PROGRESS"] .task-card');
    await expect(inProgressTasks.locator('text=Implement authentication')).toBeVisible();
  });

  test('should handle task status updates via API', async ({ page }) => {
    // Mock task update API
    await page.route('**/api/tasks/1', async route => {
      if (route.request().method() === 'PUT') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            title: 'Implement authentication',
            status: body.status,
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    const taskCard = page.locator('text=Implement authentication').first();
    const inProgressColumn = page.locator('[data-testid="kanban-column-IN_PROGRESS"]');

    // Drag and drop should trigger API call
    await taskCard.dragTo(inProgressColumn);

    // Wait for API call to complete
    await page.waitForResponse('**/api/tasks/1');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Kanban board should adapt to mobile
    await expect(page.locator('[data-testid="mobile-kanban"]')).toBeVisible();

    // Columns should be horizontally scrollable
    const kanbanBoard = page.locator('[data-testid="kanban-board"]');
    await expect(kanbanBoard).toHaveCSS('overflow-x', 'auto');
  });
});