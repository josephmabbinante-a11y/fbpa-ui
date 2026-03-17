// playwright.config.js
// Playwright configuration for UI automation
// Docs: https://playwright.dev/docs/test-configuration

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  use: {
    baseURL: 'http://localhost:5173', // Adjust if your frontend runs elsewhere
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },
  testDir: './tests',
  timeout: 30000,
};

module.exports = config;
