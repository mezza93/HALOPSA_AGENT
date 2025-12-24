import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the hero section', async ({ page }) => {
    // Check main heading
    await expect(
      page.getByRole('heading', { name: /your ai assistant for halopsa/i })
    ).toBeVisible();

    // Check CTA buttons
    await expect(
      page.getByRole('link', { name: /start free trial/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /watch demo/i })
    ).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    // Click on Features link
    await page.getByRole('link', { name: 'Features' }).click();
    await expect(page.locator('#features')).toBeInViewport();

    // Click on Pricing link
    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page.locator('#pricing')).toBeInViewport();
  });

  test('displays feature cards', async ({ page }) => {
    await page.locator('#features').scrollIntoViewIfNeeded();

    // Check for feature cards
    await expect(
      page.getByText('Natural Language Queries')
    ).toBeVisible();
    await expect(
      page.getByText('AI-Powered Actions')
    ).toBeVisible();
    await expect(
      page.getByText('Enterprise Security')
    ).toBeVisible();
  });

  test('displays pricing plans', async ({ page }) => {
    await page.locator('#pricing').scrollIntoViewIfNeeded();

    // Check for pricing tiers
    await expect(page.getByText('Free')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Enterprise')).toBeVisible();
  });

  test('CTA navigates to registration', async ({ page }) => {
    await page.getByRole('link', { name: /start free trial/i }).click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Open mobile menu
    await page.getByRole('button', { name: /toggle menu/i }).click();

    // Check mobile menu items are visible
    await expect(
      page.getByRole('link', { name: 'Features' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Pricing' })
    ).toBeVisible();
  });

  test('has correct meta tags for SEO', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/halopsa ai/i);

    // Check meta description
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description).toContain('AI-powered assistant');
  });

  test('testimonials section displays correctly', async ({ page }) => {
    await page.locator('#testimonials').scrollIntoViewIfNeeded();

    // Check for testimonial quotes
    await expect(page.getByText(/completely transformed/i)).toBeVisible();
  });

  test('footer contains expected links', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer links
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible();
  });
});

test.describe('Landing Page - Accessibility', () => {
  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    // Check for basic accessibility
    // Images have alt text
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBe('');
    }

    // Buttons are focusable
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      await expect(button).toBeEnabled();
    }

    // Links have href
    const links = await page.locator('a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).not.toBeNull();
    }
  });
});

test.describe('Landing Page - Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
