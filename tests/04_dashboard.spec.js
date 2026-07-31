const { test, expect } = require('@playwright/test');
const DashboardPage = require('../features/pages/DashboardPage');

test.slow();

test.describe('Dashboard Navigation & Punch Specs', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
  });

  test('Should toggle work punch status on Dashboard', async () => {
    await expect(dashboardPage.punchStatus).toHaveText('Logged in as Admin (PUNCHED IN)');
    await expect(dashboardPage.punchBtn).toHaveText('Punch Out');

    await dashboardPage.clickPunch();
    await expect(dashboardPage.punchStatus).toHaveText('Logged in as Admin (PUNCHED OUT)');
    await expect(dashboardPage.punchBtn).toHaveText('Punch In');
  });

  test('Should navigate to Leave page via sidebar menu', async ({ page }) => {
    await dashboardPage.clickLeaveMenu();
    await expect(page).toHaveURL(/leave\.html/);
  });

  test('Should navigate to Leave page via Quick Launch card', async ({ page }) => {
    await dashboardPage.clickApplyLeaveQuickLaunch();
    await expect(page).toHaveURL(/leave\.html/);
  });

  test('Should logout and return to login page', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/index\.html/);
  });
});
