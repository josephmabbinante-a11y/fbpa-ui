// full-workflow-e2e.spec.js
// Playwright test: Full end-to-end workflow for load booking, customer/carrier input, rate config, AR/AP, delivery, and POD upload
const { test, expect } = require('@playwright/test');
const path = require('path');

test('Full E2E: Book load through delivery and POD', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'testuser@example.com');
  await page.fill('input[name="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard|home/);

  // Book a load
  await page.goto('/build-load');
  await page.fill('input[name="origin"]', 'Chicago, IL');
  await page.fill('input[name="destination"]', 'Dallas, TX');
  await page.fill('input[name="weight"]', '10000');
  // Add more required fields as needed
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Load created')).toBeVisible();

  // Customer input
  await page.goto('/loads');
  await page.click('text=View Details'); // Adjust selector as needed
  await page.click('button:text("Add Customer")');
  await page.fill('input[name="customerName"]', 'Acme Shipper');
  await page.click('button:text("Save")');
  await expect(page.locator('text=Acme Shipper')).toBeVisible();

  // Carrier input
  await page.click('button:text("Add Carrier")');
  await page.fill('input[name="carrierName"]', 'Best Carrier LLC');
  await page.click('button:text("Save")');
  await expect(page.locator('text=Best Carrier LLC')).toBeVisible();

  // Rate configuration
  await page.click('text=Financial');
  await page.fill('input[name="rate"]', '2500');
  await page.click('button:text("Save Rate")');
  await expect(page.locator('text=$2,500')).toBeVisible();

  // AR/AP steps
  await page.goto('/invoices');
  await page.click('text=Mark as Sent');
  await page.click('text=Mark as Paid');
  await expect(page.locator('text=Paid')).toBeVisible();

  // Delivery tracking
  await page.goto('/loads');
  await page.click('text=View Details');
  await page.click('text=Mark as Delivered');
  await expect(page.locator('text=Delivered')).toBeVisible();

  // POD upload
  const podPath = path.resolve(__dirname, 'fixtures', 'pod-sample.pdf');
  await page.setInputFiles('input[type="file"]', podPath);
  await page.click('button:text("Upload POD")');
  await expect(page.locator('text=POD Uploaded')).toBeVisible();
});
