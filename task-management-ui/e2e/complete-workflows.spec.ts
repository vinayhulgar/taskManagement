import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TEST_HELPERS, TEST_FACTORIES, TEST_ASSERTIONS } from './test-config';

test.describe('Complete User Workflows - Backend Integration', () => {
  let authToken: string;
  let userId: number;

  test.beforeAll(async () => {
    // Check if backend is running
    if (!TEST_CONFIG.FLAGS.SKIP_BACKEND_CHECK) {
      const isBackendHealthy = await TEST_HELPERS.checkBackendHealth();
      if (!isBackendHealthy) {
        throw new Error('Backend is not running or not healthy. Start the Spring Boot backend or use SKIP_BACKEND_CHECK=true');
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
    
    // Set up API base URL
    await page.addInitScript((apiUrl) => {
      window.localStorage.setItem('api-base-url', apiUrl);
    }, TEST_CONFIG.API_BASE_URL);
  });

  test('Complete user registration and login workflow', async ({ page }) => {
    const testUser = TEST_FACTORIES.createTestUser();
    
    // Test user registration flow
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="firstName"]', testUser.firstName);
    await page.fill('input[name="lastName"]', testUser.lastName);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.confirmPassword);

    // Intercept registration API call
    const registerResponse = TEST_HELPERS.waitForResponse(page, `${TEST_CONFIG.API_BASE_URL}/auth/register`);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Verify API call was successful
    const regResponse = await registerResponse;
    await TEST_ASSERTIONS.expectApiResponse(regResponse, 201);

    // Should redirect to login or dashboard
    await TEST_ASSERTIONS.expectUrl(page, /.*\/(login|dashboard)/);

    // If redirected to login, complete login flow
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      
      const loginResponse = TEST_HELPERS.waitForResponse(page, `${TEST_CONFIG.API_BASE_URL}/auth/login`);
      await page.click('button[type="submit"]');
      
      // Verify login API call
      const loginResp = await loginResponse;
      await TEST_ASSERTIONS.expectApiResponse(loginResp, 200);
    }

    // Should be on dashboard
    await TEST_ASSERTIONS.expectUrl(page, /.*\/dashboard/);
    await TEST_ASSERTIONS.expectVisible(page, 'text=Welcome');

    // Verify user profile is accessible
    await page.click('[data-testid="user-menu-trigger"]');
    await TEST_ASSERTIONS.expectText(page, '[data-testid="user-menu"]', `${testUser.firstName} ${testUser.lastName}`);

    // Test logout
    await page.click('[data-testid="logout-button"]');
    await TEST_ASSERTIONS.expectUrl(page, /.*\/login/);
    
    // Verify token is cleared
    const token = await page.evaluate(() => localStorage.getItem('auth-token'));
    expect(token).toBeNull();
  });

  test('Complete task management workflow from creation to completion', async ({ page }) => {
    // Login first
    await TEST_HELPERS.loginUser(page);

    // Navigate to tasks
    await page.goto('/tasks');
    await TEST_ASSERTIONS.expectVisible(page, '[data-testid="kanban-board"]');

    // Create a new task
    const testTask = TEST_FACTORIES.createTestTask();
    
    await page.click('[data-testid="create-task-button"]');
    await TEST_ASSERTIONS.expectVisible(page, '[data-testid="create-task-modal"]');

    await page.fill('input[name="title"]', testTask.title);
    await page.fill('textarea[name="description"]', testTask.description);
    await page.selectOption('select[name="priority"]', testTask.priority);
    await page.fill('input[name="dueDate"]', testTask.dueDate);

    // Intercept task creation API call
    const createTaskResponse = TEST_HELPERS.waitForResponse(page, `${TEST_CONFIG.API_BASE_URL}/tasks`);
    
    // Submit task creation
    await page.click('button[type="submit"]');
    
    // Verify API call was successful
    const createResp = await createTaskResponse;
    await TEST_ASSERTIONS.expectApiResponse(createResp, 201);
    const createdTask = await createResp.json();
    
    await expect(page.locator('[data-testid="create-task-modal"]')).not.toBeVisible();

    // Verify task appears in TODO column
    await TEST_ASSERTIONS.expectVisible(page, `text=${testTask.title}`);
    const taskCard = page.locator(`[data-testid*="task-card"]`).filter({ hasText: testTask.title });
    await expect(taskCard).toBeVisible();

    // Move task to IN_PROGRESS
    const inProgressColumn = page.locator('[data-testid="kanban-column-IN_PROGRESS"]');
    
    // Intercept task update API call
    const updateTaskResponse = TEST_HELPERS.waitForResponse(page, `${TEST_CONFIG.API_BASE_URL}/tasks/${createdTask.id}`);
    
    await taskCard.dragTo(inProgressColumn);
    
    // Verify API call was successful
    const updateResp = await updateTaskResponse;
    await TEST_ASSERTIONS.expectApiResponse(updateResp, 200);
    
    // Verify task moved
    await expect(inProgressColumn.locator(`text=${testTask.title}`)).toBeVisible();

    // Open task detail modal
    await taskCard.click();
    await TEST_ASSERTIONS.expectVisible(page, '[data-testid="task-detail-modal"]');

    // Add a comment
    const commentText = 'Working on this task now - integration test';
    await page.fill('[data-testid="comment-input"]', commentText);
    
    // Intercept comment creation API call
    const addCommentResponse = TEST_HELPERS.waitForResponse(page, `${TEST_CONFIG.API_BASE_URL}/tasks/${createdTask.id}/comments`);
    
    await page.click('[data-testid="add-comment-button"]');
    
    // Verify comment API call
    const commentResp = await addCommentResponse;
    await TEST_ASSERTIONS.expectApiResponse(commentResp, 201);
    
    await TEST_ASSERTIONS.expectText(page, '[data-testid="comments-section"]', commentText);

    // Update task description
    await page.click('[data-testid="edit-task-button"]');
    const updatedDescription = 'Updated task description with more details - integration test';
    await page.fill('textarea[name="description"]', updatedDescription);
    
    // Intercept task update API call
    const updateDescResponse = TEST_HELPERS.waitForResponse(page, `${TEST_CONFIG.API_BASE_URL}/tasks/${createdTask.id}`);
    
    await page.click('[data-testid="save-task-button"]');
    
    // Verify update API call
    const descResp = await updateDescResponse;
    await TEST_ASSERTIONS.expectApiResponse(descResp, 200);
    
    await TEST_ASSERTIONS.expectText(page, '[data-testid="task-description"]', updatedDescription);

    // Close modal
    await page.click('[data-testid="close-modal-button"]');

    // Move task to DONE
    const doneColumn = page.locator('[data-testid="kanban-column-DONE"]');
    
    // Intercept final task update API call
    const completeTaskResponse = TEST_HELPERS.waitForResponse(page, `${TEST_CONFIG.API_BASE_URL}/tasks/${createdTask.id}`);
    
    await taskCard.dragTo(doneColumn);
    
    // Verify completion API call
    const completeResp = await completeTaskResponse;
    await TEST_ASSERTIONS.expectApiResponse(completeResp, 200);
    
    // Verify task completed
    await expect(doneColumn.locator(`text=${testTask.title}`)).toBeVisible();

    // Verify task appears in dashboard recent activities
    await page.goto('/dashboard');
    
    // Wait for dashboard data to load
    const dashboardResponse = TEST_HELPERS.waitForResponse(page, `${TEST_CONFIG.API_BASE_URL}/dashboard/summary`);
    await dashboardResponse;
    
    await TEST_ASSERTIONS.expectVisible(page, '[data-testid="recent-activities"]');
    
    // Should show task completion activity
    await page.waitForTimeout(2000); // Allow time for activity to be recorded
    await expect(page.locator('text=completed').or(page.locator('text=finished'))).toBeVisible();
  });

  test('Complete team creation, member invitation, and project management workflow', async ({ page }) => {
    // Login first
    await TEST_HELPERS.loginUser(page);

    // Create a new team
    await page.goto('/teams');
    await page.click('[data-testid="create-team-button"]');

    const teamName = `Integration Test Team ${Date.now()}`;
    await page.fill('input[name="name"]', teamName);
    await page.fill('textarea[name="description"]', 'Team created for integration testing');
    await page.click('button[type="submit"]');

    // Verify team created
    await expect(page.locator(`text=${teamName}`)).toBeVisible();

    // Navigate to team detail
    await page.click(`text=${teamName}`);
    await expect(page).toHaveURL(/.*\/teams\/\d+/);

    // Invite a team member
    await page.click('[data-testid="invite-member-button"]');
    await page.fill('input[name="email"]', 'newmember@example.com');
    await page.selectOption('select[name="role"]', 'MEMBER');
    await page.click('button[type="submit"]');

    // Should show invitation sent message
    await expect(page.locator('text=Invitation sent').or(page.locator('text=invited'))).toBeVisible();

    // Create a project for this team
    await page.goto('/projects');
    await page.click('[data-testid="create-project-button"]');

    const projectName = `Integration Test Project ${Date.now()}`;
    await page.fill('input[name="name"]', projectName);
    await page.fill('textarea[name="description"]', 'Project created for integration testing');
    
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    
    await page.fill('input[name="startDate"]', today);
    await page.fill('input[name="endDate"]', futureDate);
    
    // Select the team we just created
    await page.selectOption('select[name="teamId"]', { label: teamName });
    
    await page.click('button[type="submit"]');

    // Verify project created
    await expect(page.locator(`text=${projectName}`)).toBeVisible();

    // Navigate to project detail
    await page.click(`text=${projectName}`);
    await expect(page).toHaveURL(/.*\/projects\/\d+/);

    // Verify project shows team information
    await expect(page.locator(`text=${teamName}`)).toBeVisible();

    // Create a task within this project
    await page.click('[data-testid="create-task-button"]');
    const taskTitle = `Project Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);
    await page.fill('textarea[name="description"]', 'Task created within project');
    await page.click('button[type="submit"]');

    // Verify task appears in project
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();

    // Update project status
    await page.click('[data-testid="project-settings-button"]');
    await page.selectOption('select[name="status"]', 'ACTIVE');
    await page.click('[data-testid="save-project-button"]');
    await expect(page.locator('text=ACTIVE')).toBeVisible();
  });

  test('Real-time updates and notifications workflow', async ({ page, context }) => {
    // Login first
    await TEST_HELPERS.loginUser(page);

    // Open a second page to simulate another user
    const secondPage = await context.newPage();
    await TEST_HELPERS.loginUser(secondPage, 'seconduser@example.com', 'SecondUser123!');

    // Navigate both users to the same project/task board
    await page.goto('/tasks');
    await secondPage.goto('/tasks');

    // First user creates a task
    await page.click('[data-testid="create-task-button"]');
    const taskTitle = `Real-time Test Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);
    await page.click('button[type="submit"]');

    // Second user should see the new task appear (real-time update)
    await expect(secondPage.locator(`text=${taskTitle}`)).toBeVisible({ timeout: 10000 });

    // First user moves task to IN_PROGRESS
    const taskCard = page.locator(`[data-testid*="task-card"]`).filter({ hasText: taskTitle });
    const inProgressColumn = page.locator('[data-testid="kanban-column-IN_PROGRESS"]');
    await taskCard.dragTo(inProgressColumn);

    // Second user should see the task move (real-time update)
    await expect(secondPage.locator('[data-testid="kanban-column-IN_PROGRESS"]').locator(`text=${taskTitle}`))
      .toBeVisible({ timeout: 10000 });

    // First user adds a comment
    await taskCard.click();
    await page.fill('[data-testid="comment-input"]', 'Real-time comment test');
    await page.click('[data-testid="add-comment-button"]');

    // Second user opens the same task and should see the comment
    const secondTaskCard = secondPage.locator(`[data-testid*="task-card"]`).filter({ hasText: taskTitle });
    await secondTaskCard.click();
    await expect(secondPage.locator('text=Real-time comment test')).toBeVisible({ timeout: 10000 });

    // Check notifications
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
    
    // Click notification bell to see notifications
    await page.click('[data-testid="notification-bell"]');
    await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible();

    await secondPage.close();
  });

  test('Error handling and recovery workflow', async ({ page }) => {
    // Login first
    await TEST_HELPERS.loginUser(page);

    // Test network error handling
    await page.goto('/tasks');

    // Simulate network failure
    await page.route('**/api/tasks', route => route.abort());

    // Try to create a task (should fail gracefully)
    await page.click('[data-testid="create-task-button"]');
    await page.fill('input[name="title"]', 'Network Error Test Task');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Network error').or(page.locator('text=Failed to create'))).toBeVisible();

    // Restore network
    await page.unroute('**/api/tasks');

    // Retry should work
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Network Error Test Task')).toBeVisible();

    // Test validation error handling
    await page.click('[data-testid="create-task-button"]');
    await page.click('button[type="submit"]'); // Submit empty form

    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();

    // Test unauthorized access
    // Clear auth token
    await page.evaluate(() => localStorage.removeItem('auth-token'));
    await page.goto('/tasks');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Performance and loading states workflow', async ({ page }) => {
    // Login first
    await TEST_HELPERS.loginUser(page);

    // Test loading states
    await page.goto('/dashboard');

    // Should show loading skeletons initially
    await expect(page.locator('[data-testid="dashboard-skeleton"]')).toBeVisible();

    // Wait for content to load
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="dashboard-skeleton"]')).not.toBeVisible();

    // Test pagination/virtual scrolling with large datasets
    await page.goto('/tasks');

    // Simulate large dataset
    await page.route('**/api/tasks**', async route => {
      const tasks = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        description: `Description for task ${i + 1}`,
        status: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'][i % 4],
        priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
        createdAt: new Date().toISOString()
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: tasks.slice(0, 20), // First page
          totalCount: 100,
          page: 1,
          pageSize: 20
        })
      });
    });

    await page.reload();

    // Should show first 20 tasks
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 20')).toBeVisible();
    await expect(page.locator('text=Task 21')).not.toBeVisible();

    // Test search performance
    await page.fill('[data-testid="task-search"]', 'Task 1');
    
    // Should filter quickly
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).not.toBeVisible();
  });

  // Helper functions are now handled by TEST_HELPERS from test-config.ts
});