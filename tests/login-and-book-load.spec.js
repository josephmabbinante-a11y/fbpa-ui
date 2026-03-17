// login-and-book-load.spec.js
// Playwright test: Automate login and book a load
const { test, expect } = require('@playwright/test');

test('Login and book a load', async ({ page }) => {
  // Go to login page
  await page.goto('/login');

  // Fill in login form (adjust selectors as needed)
  await page.fill('input[name="email"]', 'testuser@example.com');
  await page.fill('input[name="password"]', 'testpassword');
  await page.click('button[type="submit"]');

  // Wait for dashboard or successful login indication
  await expect(page).toHaveURL(/dashboard|home/);

  // Navigate to load booking page (adjust path as needed)
  await page.goto('/build-load');

  // Fill in required fields for booking a load (adjust selectors/fields as needed)
  await page.fill('input[name="origin"]', 'Chicago, IL');
  await page.fill('input[name="destination"]', 'Dallas, TX');
  await page.fill('input[name="weight"]', '10000');
  // ...add more fields as required by your form

  // Submit the load booking form
  await page.click('button[type="submit"]');

  // Assert load booking success (adjust selector/text as needed)
  await expect(page.locator('text=Load created')).toBeVisible();
});
