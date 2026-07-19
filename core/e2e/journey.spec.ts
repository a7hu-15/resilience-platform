import { test, expect } from '@playwright/test';

test('User can submit a Docker image and view results', async ({ page }) => {
  // 1. Navigate to the dashboard
  await page.goto('/');

  // 2. Verify the page is loaded
  await expect(page.getByRole('heading', { name: 'Resilience Platform' })).toBeVisible();

  // 3. Enter a mock Docker image
  const input = page.getByPlaceholder('Enter Docker Image (e.g., nginx:alpine)');
  await input.fill('nginx:alpine');

  // 4. Click the run button
  const runButton = page.getByRole('button', { name: 'Run Resilience Test' });
  await runButton.click();

  // 5. Verify the SSE Terminal appears and shows initialization
  await expect(page.getByText('Initializing resilience pipeline for [nginx:alpine]...')).toBeVisible();

  // 6. Wait for the transition to the results page
  // The mock SSE takes about 9.6 seconds + 1s redirect delay, so we need a higher timeout here
  await expect(page).toHaveURL(/.*\/results\/.*/, { timeout: 15000 });

  // 7. Verify the Results Page Master Score ring and metrics appear
  await expect(page.getByRole('heading', { name: 'Resilience Report' })).toBeVisible();
  
  // Ensure the metrics cards are visible
  await expect(page.getByText('Security')).toBeVisible();
  await expect(page.getByText('Performance')).toBeVisible();
  await expect(page.getByText('Resilience')).toBeVisible();

  // Ensure Master Score is rendered
  await expect(page.getByText('Master Score')).toBeVisible();
});
