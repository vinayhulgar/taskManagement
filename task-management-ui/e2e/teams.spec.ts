import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
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

    // Mock teams API
    await page.route('**/api/teams**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              name: 'Development Team',
              description: 'Frontend and backend developers',
              memberCount: 5,
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              name: 'Design Team',
              description: 'UI/UX designers',
              memberCount: 3,
              createdAt: new Date().toISOString()
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
            memberCount: 1,
            createdAt: new Date().toISOString()
          })
        });
      }
    });

    // Mock team members API
    await page.route('**/api/teams/*/members', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            },
            role: 'ADMIN',
            joinedAt: new Date().toISOString()
          },
          {
            id: 2,
            user: {
              id: 2,
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com'
            },
            role: 'MEMBER',
            joinedAt: new Date().toISOString()
          }
        ])
      });
    });

    await page.goto('/teams');
  });

  test('should display teams list', async ({ page }) => {
    // Check for team cards
    await expect(page.locator('text=Development Team')).toBeVisible();
    await expect(page.locator('text=Design Team')).toBeVisible();
    
    // Check member counts
    await expect(page.locator('text=5 members')).toBeVisible();
    await expect(page.locator('text=3 members')).toBeVisible();
  });

  test('should open create team modal', async ({ page }) => {
    // Click create team button
    await page.click('[data-testid="create-team-button"]');

    // Modal should open
    await expect(page.locator('[data-testid="create-team-modal"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
  });

  test('should create a new team', async ({ page }) => {
    // Open create team modal
    await page.click('[data-testid="create-team-button"]');

    // Fill team details
    await page.fill('input[name="name"]', 'QA Team');
    await page.fill('textarea[name="description"]', 'Quality assurance team');

    // Submit form
    await page.click('button[type="submit"]');

    // Modal should close and team should appear
    await expect(page.locator('[data-testid="create-team-modal"]')).not.toBeVisible();
    await expect(page.locator('text=QA Team')).toBeVisible();
  });

  test('should validate team creation form', async ({ page }) => {
    // Open create team modal
    await page.click('[data-testid="create-team-button"]');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Team name is required')).toBeVisible();
  });

  test('should navigate to team detail page', async ({ page }) => {
    // Click on a team card
    await page.click('text=Development Team');

    // Should navigate to team detail page
    await expect(page).toHaveURL(/.*\/teams\/1/);
  });

  test('should display team members in detail page', async ({ page }) => {
    await page.goto('/teams/1');

    // Check for team members
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    
    // Check for roles
    await expect(page.locator('text=ADMIN')).toBeVisible();
    await expect(page.locator('text=MEMBER')).toBeVisible();
  });

  test('should open invite member modal', async ({ page }) => {
    await page.goto('/teams/1');

    // Click invite member button
    await page.click('[data-testid="invite-member-button"]');

    // Modal should open
    await expect(page.locator('[data-testid="invite-member-modal"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();
  });

  test('should invite team member', async ({ page }) => {
    await page.goto('/teams/1');

    // Mock invite API
    await page.route('**/api/teams/1/invite', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invitation sent successfully'
        })
      });
    });

    // Open invite modal
    await page.click('[data-testid="invite-member-button"]');

    // Fill invitation details
    await page.fill('input[name="email"]', 'newmember@example.com');
    await page.selectOption('select[name="role"]', 'MEMBER');

    // Submit invitation
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Invitation sent successfully')).toBeVisible();
  });

  test('should filter teams', async ({ page }) => {
    // Use search input
    await page.fill('[data-testid="team-search"]', 'Development');

    // Should filter teams by search term
    await expect(page.locator('text=Development Team')).toBeVisible();
    await expect(page.locator('text=Design Team')).not.toBeVisible();
  });

  test('should handle empty teams state', async ({ page }) => {
    // Mock empty teams response
    await page.route('**/api/teams**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/teams');

    // Should show empty state
    await expect(page.locator('[data-testid="empty-teams-state"]')).toBeVisible();
    await expect(page.locator('text=No teams found')).toBeVisible();
  });

  test('should open team settings', async ({ page }) => {
    await page.goto('/teams/1');

    // Click settings button
    await page.click('[data-testid="team-settings-button"]');

    // Settings modal should open
    await expect(page.locator('[data-testid="team-settings-modal"]')).toBeVisible();
  });

  test('should update team settings', async ({ page }) => {
    await page.goto('/teams/1');

    // Mock update API
    await page.route('**/api/teams/1', async route => {
      if (route.request().method() === 'PUT') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            ...body,
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    // Open settings
    await page.click('[data-testid="team-settings-button"]');

    // Update team name
    await page.fill('input[name="name"]', 'Updated Development Team');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Team updated successfully')).toBeVisible();
  });

  test('should remove team member', async ({ page }) => {
    await page.goto('/teams/1');

    // Mock remove member API
    await page.route('**/api/teams/1/members/2', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Member removed successfully'
          })
        });
      }
    });

    // Click remove button for Jane Smith
    await page.click('[data-testid="remove-member-2"]');

    // Confirm removal
    await page.click('[data-testid="confirm-remove-member"]');

    // Member should be removed
    await expect(page.locator('text=Jane Smith')).not.toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Teams should display in mobile layout
    await expect(page.locator('[data-testid="mobile-teams-layout"]')).toBeVisible();

    // Team cards should stack vertically
    const cards = page.locator('[data-testid^="team-card-"]');
    const firstCard = cards.first();
    const secondCard = cards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // Second card should be below first card
    expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0);
  });
});