import { test, expect } from '@playwright/test';

test.describe('Backend API Integration Tests', () => {
  const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  
  test.beforeEach(async ({ page }) => {
    // Set up API base URL for tests
    await page.addInitScript((apiUrl) => {
      window.localStorage.setItem('api-base-url', apiUrl);
    }, API_BASE_URL);
  });

  test('Authentication API integration', async ({ page }) => {
    await page.goto('/login');

    // Test login with real API
    await page.fill('input[type="email"]', 'admin@taskmanagement.com');
    await page.fill('input[type="password"]', 'admin123');

    // Intercept the actual API call
    const loginResponse = page.waitForResponse(`${API_BASE_URL}/auth/login`);
    await page.click('button[type="submit"]');

    const response = await loginResponse;
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('token');
    expect(responseBody).toHaveProperty('user');
    expect(responseBody.user).toHaveProperty('email', 'admin@taskmanagement.com');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify token is stored
    const token = await page.evaluate(() => localStorage.getItem('auth-token'));
    expect(token).toBeTruthy();
  });

  test('User registration API integration', async ({ page }) => {
    await page.goto('/register');

    const uniqueEmail = `testuser${Date.now()}@example.com`;

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    // Intercept registration API call
    const registerResponse = page.waitForResponse(`${API_BASE_URL}/auth/register`);
    await page.click('button[type="submit"]');

    const response = await registerResponse;
    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('user');
    expect(responseBody.user.email).toBe(uniqueEmail);
  });

  test('Tasks API integration', async ({ page }) => {
    // Login first
    await loginUser(page);

    await page.goto('/tasks');

    // Test fetching tasks
    const tasksResponse = page.waitForResponse(`${API_BASE_URL}/tasks**`);
    await page.reload();

    const response = await tasksResponse;
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('tasks');
    expect(Array.isArray(responseBody.tasks)).toBe(true);

    // Test creating a task
    await page.click('[data-testid="create-task-button"]');
    
    const taskTitle = `API Integration Test Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);
    await page.fill('textarea[name="description"]', 'Testing API integration');
    await page.selectOption('select[name="priority"]', 'HIGH');

    const createTaskResponse = page.waitForResponse(`${API_BASE_URL}/tasks`);
    await page.click('button[type="submit"]');

    const createResponse = await createTaskResponse;
    expect(createResponse.status()).toBe(201);

    const createdTask = await createResponse.json();
    expect(createdTask.title).toBe(taskTitle);
    expect(createdTask.priority).toBe('HIGH');

    // Verify task appears in UI
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();

    // Test updating task status
    const taskCard = page.locator(`[data-testid*="task-card"]`).filter({ hasText: taskTitle });
    const inProgressColumn = page.locator('[data-testid="kanban-column-IN_PROGRESS"]');

    const updateTaskResponse = page.waitForResponse(`${API_BASE_URL}/tasks/${createdTask.id}`);
    await taskCard.dragTo(inProgressColumn);

    const updateResponse = await updateTaskResponse;
    expect(updateResponse.status()).toBe(200);

    const updatedTask = await updateResponse.json();
    expect(updatedTask.status).toBe('IN_PROGRESS');
  });

  test('Teams API integration', async ({ page }) => {
    await loginUser(page);
    await page.goto('/teams');

    // Test fetching teams
    const teamsResponse = page.waitForResponse(`${API_BASE_URL}/teams`);
    await page.reload();

    const response = await teamsResponse;
    expect(response.status()).toBe(200);

    const teams = await response.json();
    expect(Array.isArray(teams)).toBe(true);

    // Test creating a team
    await page.click('[data-testid="create-team-button"]');

    const teamName = `API Test Team ${Date.now()}`;
    await page.fill('input[name="name"]', teamName);
    await page.fill('textarea[name="description"]', 'Team for API testing');

    const createTeamResponse = page.waitForResponse(`${API_BASE_URL}/teams`);
    await page.click('button[type="submit"]');

    const createResponse = await createTeamResponse;
    expect(createResponse.status()).toBe(201);

    const createdTeam = await createResponse.json();
    expect(createdTeam.name).toBe(teamName);

    // Verify team appears in UI
    await expect(page.locator(`text=${teamName}`)).toBeVisible();

    // Test team member operations
    await page.click(`text=${teamName}`);
    
    // Test inviting a member
    await page.click('[data-testid="invite-member-button"]');
    await page.fill('input[name="email"]', 'newmember@example.com');
    await page.selectOption('select[name="role"]', 'MEMBER');

    const inviteResponse = page.waitForResponse(`${API_BASE_URL}/teams/${createdTeam.id}/invite`);
    await page.click('button[type="submit"]');

    const inviteResult = await inviteResponse;
    expect(inviteResult.status()).toBe(200);
  });

  test('Projects API integration', async ({ page }) => {
    await loginUser(page);
    await page.goto('/projects');

    // Test fetching projects
    const projectsResponse = page.waitForResponse(`${API_BASE_URL}/projects`);
    await page.reload();

    const response = await projectsResponse;
    expect(response.status()).toBe(200);

    const projects = await response.json();
    expect(Array.isArray(projects)).toBe(true);

    // Test creating a project
    await page.click('[data-testid="create-project-button"]');

    const projectName = `API Test Project ${Date.now()}`;
    await page.fill('input[name="name"]', projectName);
    await page.fill('textarea[name="description"]', 'Project for API testing');
    
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    
    await page.fill('input[name="startDate"]', today);
    await page.fill('input[name="endDate"]', futureDate);

    const createProjectResponse = page.waitForResponse(`${API_BASE_URL}/projects`);
    await page.click('button[type="submit"]');

    const createResponse = await createProjectResponse;
    expect(createResponse.status()).toBe(201);

    const createdProject = await createResponse.json();
    expect(createdProject.name).toBe(projectName);

    // Verify project appears in UI
    await expect(page.locator(`text=${projectName}`)).toBeVisible();

    // Test project member assignment
    await page.click(`text=${projectName}`);
    
    const projectDetailResponse = page.waitForResponse(`${API_BASE_URL}/projects/${createdProject.id}`);
    await page.waitForLoadState('networkidle');

    const detailResponse = await projectDetailResponse;
    expect(detailResponse.status()).toBe(200);
  });

  test('Comments API integration', async ({ page }) => {
    await loginUser(page);
    await page.goto('/tasks');

    // Create a task first
    await page.click('[data-testid="create-task-button"]');
    const taskTitle = `Comment Test Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);
    
    const createTaskResponse = page.waitForResponse(`${API_BASE_URL}/tasks`);
    await page.click('button[type="submit"]');
    
    const createdTask = await (await createTaskResponse).json();

    // Open task detail
    const taskCard = page.locator(`text=${taskTitle}`);
    await taskCard.click();

    // Add a comment
    const commentText = `API test comment ${Date.now()}`;
    await page.fill('[data-testid="comment-input"]', commentText);

    const addCommentResponse = page.waitForResponse(`${API_BASE_URL}/tasks/${createdTask.id}/comments`);
    await page.click('[data-testid="add-comment-button"]');

    const commentResponse = await addCommentResponse;
    expect(commentResponse.status()).toBe(201);

    const createdComment = await commentResponse.json();
    expect(createdComment.content).toBe(commentText);

    // Verify comment appears in UI
    await expect(page.locator(`text=${commentText}`)).toBeVisible();
  });

  test('Real-time WebSocket integration', async ({ page }) => {
    await loginUser(page);
    await page.goto('/tasks');

    // Test WebSocket connection
    const wsConnected = page.evaluate(() => {
      return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws');
        ws.onopen = () => resolve(true);
        ws.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 5000); // Timeout after 5 seconds
      });
    });

    expect(await wsConnected).toBe(true);

    // Test real-time task updates
    // This would require coordination with backend WebSocket events
    // For now, we'll test that the WebSocket connection is established
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toHaveText(/connected/i);
  });

  test('Error handling with real API', async ({ page }) => {
    await page.goto('/login');

    // Test invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    const loginResponse = page.waitForResponse(`${API_BASE_URL}/auth/login`);
    await page.click('button[type="submit"]');

    const response = await loginResponse;
    expect(response.status()).toBe(401);

    // Should show error message
    await expect(page.locator('text=Invalid credentials').or(page.locator('text=Authentication failed'))).toBeVisible();

    // Test network timeout
    await page.route(`${API_BASE_URL}/auth/login`, route => {
      // Simulate slow response
      setTimeout(() => route.continue(), 10000);
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.locator('[data-testid="login-loading"]')).toBeVisible();
  });

  test('API rate limiting handling', async ({ page }) => {
    await loginUser(page);
    await page.goto('/tasks');

    // Simulate rapid API calls to trigger rate limiting
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        page.evaluate((apiUrl: string) => {
          return fetch(`${apiUrl}/tasks`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
            }
          }).then(response => ({ status: response.status }));
        }, API_BASE_URL)
      );
    }

    const responses = await Promise.all(promises);
    
    // Some requests should be rate limited (429 status)
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // UI should handle rate limiting gracefully
    if (rateLimitedResponses.length > 0) {
      await expect(page.locator('text=Too many requests').or(page.locator('text=Rate limit'))).toBeVisible();
    }
  });

  test('Data validation with backend', async ({ page }) => {
    await loginUser(page);
    await page.goto('/tasks');

    // Test creating task with invalid data
    await page.click('[data-testid="create-task-button"]');
    
    // Try to create task with title that's too long
    const longTitle = 'A'.repeat(300); // Assuming max title length is 255
    await page.fill('input[name="title"]', longTitle);

    const createTaskResponse = page.waitForResponse(`${API_BASE_URL}/tasks`);
    await page.click('button[type="submit"]');

    const response = await createTaskResponse;
    expect(response.status()).toBe(400); // Bad request

    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty('message');
    expect(errorResponse.message).toMatch(/title/i);

    // UI should show validation error
    await expect(page.locator('text=Title is too long').or(page.locator('text=Invalid title'))).toBeVisible();
  });

  // Helper function to login
  async function loginUser(page: any) {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@taskmanagement.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  }
});