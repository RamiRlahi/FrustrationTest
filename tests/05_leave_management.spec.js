const { test, expect } = require('@playwright/test');
const LeavePage = require('../features/pages/LeavePage');

test.slow();

test.describe('Leave Management Application Specs', () => {
  let leavePage;

  test.beforeEach(async ({ page }) => {
    leavePage = new LeavePage(page);
    await leavePage.navigate();
  });

  test('Should submit valid leave request and deduct balance', async () => {
    await leavePage.fillLeaveRequest('US - Annual Leave', '2026-08-10', '2026-08-12');
    await leavePage.clickApply();
    await expect(leavePage.leaveSuccessBanner).toBeVisible();
    await expect(leavePage.leaveSuccessMsg).toContainText('Leave request submitted successfully!');
    await expect(leavePage.leaveBalanceBadge).toContainText('9.0 Days');
  });

  test('Should display error when end date is before start date', async () => {
    await leavePage.fillLeaveRequest('US - Annual Leave', '2026-08-10', '2026-08-05');
    await leavePage.clickApply();
    await expect(leavePage.leaveErrorBanner).toBeVisible();
    await expect(leavePage.leaveErrorMsg).toContainText('Invalid date range. End date cannot be before start date.');
  });

  test('Should display error when duration exceeds leave balance', async () => {
    await leavePage.fillLeaveRequest('US - Annual Leave', '2026-08-01', '2026-08-20');
    await leavePage.clickApply();
    await expect(leavePage.leaveErrorBanner).toBeVisible();
    await expect(leavePage.leaveErrorMsg).toContainText('Insufficient leave balance for requested duration.');
  });

  test('Should display friction banner on 3 rapid submit clicks', async () => {
    await leavePage.rapidlyClickApply(3);
    await expect(leavePage.leaveFrictionBanner).toBeVisible();
  });
});
