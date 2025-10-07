import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
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

    // Mock projects API
    await page.route('**/api/projects**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              name: 'Task Management System',
              description: 'A comprehensive task management application',
              status: 'ACTIVE',
              progress: 65,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
              teamId: 1,
              memberCount: 5
            },
            {
              id: 2,
              name: 'Mobile App',
              description: 'Mobile version of the task management app',
              status: 'PLANNING',
              progress: 15,
              startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
              endDate: new Date(Date.now() + 60 * 86400000).toISOString(),
              teamId: 2,
              memberCount: 3
            }
          ])
        });
      } else if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            ...body,
            progress: 0,
            memberCount: 1,
            createdAt: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('/projects');
  });

  test('should display projects list', async ({ page }) => {
    // Check for project cards
    await expect(page.locator('text=Task Management System')).toBeVisible();
    await expect(page.locator('text=Mobile App')).toBeVisible();
    
    // Check project status
    await expect(page.locator('text=ACTIVE')).toBeVisible();
    await expect(page.locator('text=PLANNING')).toBeVisible();
    
    // Check progress indicators
    await expect(page.locator('[data-testid="project-progress-1"]')).toContainText('65%');
    await expect(page.locator('[data-testid="project-progress-2"]')).toContainText('15%');
  });

  test('should switch between card and list view', async ({ page }) => {
    // Should start in card view
    await expect(page.locator('[data-testid="projects-card-view"]')).toBeVisible();

    // Switch to list view
    await page.click('[data-testid="view-toggle-list"]');
    await expect(page.locator('[data-testid="projects-list-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="projects-card-view"]')).not.toBeVisible();

    // Switch back to card view
    await page.click('[data-testid="view-toggle-card"]');
    await expect(page.locator('[data-testid="projects-card-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="projects-list-view"]')).not.toBeVisible();
  });

  test('should open create project modal', async ({ page }) => {
    // Click create project button
    await page.click('[data-testid="create-project-button"]');

    // Modal should open
    await expect(page.locator('[data-testid="create-project-modal"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="startDate"]')).toBeVisible();
    await expect(page.locator('input[name="endDate"]')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    // Fill project details
    await page.fill('input[name="name"]', 'New Test Project');
    await page.fill('textarea[name="description"]', 'This is a test project');
    
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    
    await page.fill('input[name="startDate"]', today);
    await page.fill('input[name="endDate"]', futureDate);

    // Submit form
    await page.click('button[type="submit"]');

    // Modal should close and project should appear
    await expect(page.locator('[data-testid="create-project-modal"]')).not.toBeVisible();
    await expect(page.locator('text=New Test Project')).toBeVisible();
  });

  test('should validate project creation form', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Project name is required')).toBeVisible();
    await expect(page.locator('text=Start date is required')).toBeVisible();
  });

  test('should navigate to project detail page', async ({ page }) => {
    // Click on a project card
    await page.click('text=Task Management System');

    // Should navigate to project detail page
    await expect(page).toHaveURL(/.*\/projects\/1/);
  });

  test('should display project details', async ({ page }) => {
    // Mock project detail API
    await page.route('**/api/projects/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Task Management System',
          description: 'A comprehensive task management application',
          status: 'ACTIVE',
          progress: 65,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          teamId: 1,
          tasks: [
            {
              id: 1,
              title: 'Setup project structure',
              status: 'DONE'
            },
            {
              id: 2,
              title: 'Implement authentication',
              status: 'IN_PROGRESS'
            }
          ],
          members: [
            {
              id: 1,
              user: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
              },
              role: 'PROJECT_MANAGER'
            }
          ]
        })
      });
    });

    await page.goto('/projects/1');

    // Check project information
    await expect(page.locator('text=Task Management System')).toBeVisible();
    await expect(page.locator('text=A comprehensive task management application')).toBeVisible();
    await expect(page.locator('text=ACTIVE')).toBeVisible();

    // Check project tasks
    await expect(page.locator('text=Setup project structure')).toBeVisible();
    await expect(page.locator('text=Implement authentication')).toBeVisible();

    // Check project members
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should filter projects by status', async ({ page }) => {
    // Open filters
    await page.click('[data-testid="project-filters-toggle"]');

    // Filter by ACTIVE status
    await page.click('[data-testid="filter-status-ACTIVE"]');

    // Should only show active projects
    await expect(page.locator('text=Task Management System')).toBeVisible();
    await expect(page.locator('text=Mobile App')).not.toBeVisible();
  });

  test('should search projects', async ({ page }) => {
    // Use search input
    await page.fill('[data-testid="project-search"]', 'Mobile');

    // Should filter projects by search term
    await expect(page.locator('text=Mobile App')).toBeVisible();
    await expect(page.locator('text=Task Management System')).not.toBeVisible();
  });

  test('should assign members to project', async ({ page }) => {
    await page.goto('/projects/1');

    // Mock assign member API
    await page.route('**/api/projects/1/members', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Member assigned successfully'
          })
        });
      }
    });

    // Click assign member button
    await page.click('[data-testid="assign-member-button"]');

    // Modal should open
    await expect(page.locator('[data-testid="assign-member-modal"]')).toBeVisible();

    // Select a user and role
    await page.selectOption('select[name="userId"]', '2');
    await page.selectOption('select[name="role"]', 'DEVELOPER');

    // Submit assignment
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Member assigned successfully')).toBeVisible();
  });

  test('should update project status', async ({ page }) => {
    await page.goto('/projects/1');

    // Mock update API
    await page.route('**/api/projects/1', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            status: 'COMPLETED',
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    // Click project settings
    await page.click('[data-testid="project-settings-button"]');

    // Update status
    await page.selectOption('select[name="status"]', 'COMPLETED');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show updated status
    await expect(page.locator('text=COMPLETED')).toBeVisible();
  });

  test('should handle empty projects state', async ({ page }) => {
    // Mock empty projects response
    await page.route('**/api/projects**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/projects');

    // Should show empty state
    await expect(page.locator('[data-testid="empty-projects-state"]')).toBeVisible();
    await expect(page.locator('text=No projects found')).toBeVisible();
  });

  test('should display project timeline', async ({ page }) => {
    await page.goto('/projects/1');

    // Click timeline tab
    await page.click('[data-testid="project-timeline-tab"]');

    // Should show timeline view
    await expect(page.locator('[data-testid="project-timeline"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Projects should display in mobile layout
    await expect(page.locator('[data-testid="mobile-projects-layout"]')).toBeVisible();

    // Project cards should stack vertically
    const cards = page.locator('[data-testid^="project-card-"]');
    const firstCard = cards.first();
    const secondCard = cards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // Second card should be below first card
    expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0);
  });
});