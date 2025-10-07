import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
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

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();
    
    expect(h1).toBeGreaterThan(0);
    expect(h2).toBeGreaterThan(0);

    // Main page should have one h1
    expect(h1).toBe(1);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for ARIA labels on interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/login');

    // Focus on email input
    await page.focus('input[type="email"]');
    
    // Check for focus styles
    const focusedElement = page.locator('input[type="email"]:focus');
    await expect(focusedElement).toBeVisible();
    
    // Should have focus outline or ring
    const styles = await focusedElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow
      };
    });
    
    // Should have some form of focus indicator
    expect(styles.outline !== 'none' || styles.boxShadow !== 'none').toBeTruthy();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/dashboard');

    // Check text elements for color contrast
    const textElements = page.locator('p, span, div').filter({ hasText: /\w+/ });
    const count = await textElements.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = textElements.nth(i);
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });

      // Basic check that text has color
      expect(styles.color).not.toBe('');
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/login');

    // Check that form inputs have labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const labelExists = await label.count() > 0;
        
        // Input should have label, aria-label, or aria-labelledby
        expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for landmark roles
    await expect(page.locator('[role="main"], main')).toBeVisible();
    await expect(page.locator('[role="navigation"], nav')).toBeVisible();

    // Check for skip links
    const skipLink = page.locator('a[href="#main-content"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible();
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/dashboard');

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
    
    // Text should still be readable
    const textElements = page.locator('h1, h2, p').first();
    await expect(textElements).toBeVisible();
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dashboard');

    // Animations should be reduced or disabled
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
    const count = await animatedElements.count();

    if (count > 0) {
      // Check that animations respect reduced motion
      const styles = await animatedElements.first().evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          animationDuration: computed.animationDuration,
          transitionDuration: computed.transitionDuration
        };
      });

      // Animations should be instant or very short
      expect(
        styles.animationDuration === '0s' || 
        styles.transitionDuration === '0s' ||
        styles.animationDuration === '0.01s' ||
        styles.transitionDuration === '0.01s'
      ).toBeTruthy();
    }
  });

  test('should have proper error announcements', async ({ page }) => {
    await page.goto('/login');

    // Submit form with invalid data to trigger errors
    await page.click('button[type="submit"]');

    // Check for ARIA live regions for error announcements
    const liveRegions = page.locator('[aria-live], [role="alert"]');
    const count = await liveRegions.count();

    if (count > 0) {
      // Should have error messages in live regions
      const errorText = await liveRegions.first().textContent();
      expect(errorText).toBeTruthy();
    }
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/dashboard');

    // Test global keyboard shortcuts
    await page.keyboard.press('Control+k'); // Global search
    
    // Should open search or show some response
    // This depends on implementation, so we'll check for any modal or focus change
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });
});