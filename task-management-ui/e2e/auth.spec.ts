import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    
    // Click on register link
    await page.click('text=Sign up');
    
    // Should navigate to registration page
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register');
    
    // Fill invalid data
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123'); // Too short
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should handle login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Mock successful login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          }
        })
      });
    });
    
    // Fill valid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should handle login error', async ({ page }) => {
    await page.goto('/login');
    
    // Mock failed login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid credentials'
        })
      });
    });
    
    // Fill credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*\/login/);
  });
});