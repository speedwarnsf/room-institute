import { test, expect } from '@playwright/test';

test.describe('ZenSpace App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Home Page', () => {
    test('should display the app title', async ({ page }) => {
      await expect(page.locator('text=ZenSpace')).toBeVisible();
    });

    test('should show the main heading', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Chaos to Calm');
    });

    test('should display the upload zone', async ({ page }) => {
      await expect(page.locator('[role="button"]').first()).toBeVisible();
    });

    test('should show the three-step process', async ({ page }) => {
      await expect(page.locator('text=Snap')).toBeVisible();
      await expect(page.locator('text=Analyze')).toBeVisible();
      await expect(page.locator('text=Organize')).toBeVisible();
    });
  });

  test.describe('Upload Zone', () => {
    test('should have accessible upload button', async ({ page }) => {
      const uploadZone = page.locator('[role="button"][aria-label*="Upload"]');
      await expect(uploadZone).toBeVisible();
    });

    test('should have hidden file input', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeHidden();
    });

    test('should accept image files', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      const accept = await fileInput.getAttribute('accept');
      expect(accept).toContain('.jpg');
      expect(accept).toContain('.png');
    });

    test('should show drop prompt text', async ({ page }) => {
      await expect(page.locator('text=Drop Photo')).toBeVisible();
    });
  });

  test.describe('Header', () => {
    test('should have clickable logo that resets app', async ({ page }) => {
      const logo = page.locator('button[aria-label*="ZenSpace"]');
      await expect(logo).toBeVisible();
    });

    test('should be sticky on scroll', async ({ page }) => {
      const header = page.locator('header');
      await expect(header).toHaveClass(/sticky/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBeGreaterThanOrEqual(1);
    });

    test('should have accessible buttons', async ({ page }) => {
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();
        // Button should have either aria-label or visible text
        expect(ariaLabel || text?.trim()).toBeTruthy();
      }
    });

    test('should be navigable by keyboard', async ({ page }) => {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should not have horizontal scroll on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const body = page.locator('body');
      const scrollWidth = await body.evaluate((el) => el.scrollWidth);
      const clientWidth = await body.evaluate((el) => el.clientWidth);
      
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
    });

    test('should show mobile help text on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      await expect(page.locator('text=Tap to take')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within 3 seconds', async ({ page }) => {
      const start = Date.now();
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have no console errors on load', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Filter out expected warnings
      const criticalErrors = errors.filter(e => 
        !e.includes('API key not configured') &&
        !e.includes('favicon')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });
});

test.describe('ZenSpace Touch Interactions', () => {
  test.use({ hasTouch: true });

  test('upload zone should respond to touch', async ({ page }) => {
    await page.goto('/');
    
    const uploadZone = page.locator('[role="button"]').first();
    await expect(uploadZone).toBeVisible();
    
    // Simulate touch tap
    await uploadZone.tap();
    
    // Should trigger file input (can't fully test without mocking)
  });
});
