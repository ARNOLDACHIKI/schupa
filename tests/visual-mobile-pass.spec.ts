import { test, expect, type BrowserContext, type Page, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@schupa.org";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@2026";
const OUTPUT_DIR = path.resolve("artifacts/visual-pass");

async function saveShot(page: Page, fileName: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUTPUT_DIR, fileName), fullPage: true });
}

async function loginStudent(page: Page, studentEmail: string, studentPassword: string) {
  await page.goto(`${FRONTEND_URL}/signin`);
  await page.getByPlaceholder("you@example.com").fill(studentEmail);
  await page.getByPlaceholder("••••••••").fill(studentPassword);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function loginAdmin(page: Page) {
  await page.goto(`${FRONTEND_URL}/signin`);
  await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("••••••••").fill(ADMIN_PASSWORD);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/admin/);
}

async function clickNavbarAction(page: Page, label: string) {
  const candidates = page.getByRole("button", { name: new RegExp(label, "i") });
  const count = await candidates.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = candidates.nth(i);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click({ force: true });
      return;
    }
  }

  const mobileToggle = page.locator("button").filter({ has: page.locator("svg.lucide-menu") }).first();
  await mobileToggle.click();

  const menuCandidates = page.getByRole("button", { name: new RegExp(label, "i") });
  const menuCount = await menuCandidates.count();
  for (let i = 0; i < menuCount; i += 1) {
    const candidate = menuCandidates.nth(i);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click({ force: true });
      return;
    }
  }

  throw new Error(`Unable to find navbar action button: ${label}`);
}

async function captureStudentPages(page: Page, prefix: string) {
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Welcome back/i).first()).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-student-dashboard.png`);

  await page.getByRole("button", { name: /upload results/i }).first().click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByText(/Academic Results/i).first()).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-student-results.png`);

  await clickNavbarAction(page, "Dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("button", { name: /view fees/i }).first().click();
  await expect(page).toHaveURL(/\/fees/);
  await expect(page.getByText(/Fee Management|Fee Statements/i).first()).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-student-fees.png`);

  await clickNavbarAction(page, "Messages");
  await expect(page).toHaveURL(/\/messages/);
  await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-student-messages.png`);

  await clickNavbarAction(page, "Notifications");
  await expect(page).toHaveURL(/\/notifications/);
  await expect(page.getByRole("heading", { name: /Notifications/i })).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-student-notifications.png`);

  await page.goto(`${FRONTEND_URL}/settings`);
  await expect(page).toHaveURL(/\/settings/);
  await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-student-settings.png`);
}

async function captureAdminPages(page: Page, prefix: string) {
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByText(/Admin Dashboard/i).first()).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-admin-overview.png`);

  await page.getByRole("button", { name: /^students$/i }).click();
  await expect(page.getByText(/Student Management/i).first()).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-admin-students.png`);

  await page.getByRole("button", { name: /pending/i }).click();
  await expect(page.getByText(/Pending Approvals|Approval Queue/i).first()).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-admin-approvals.png`);

  await clickNavbarAction(page, "Messages");
  await expect(page).toHaveURL(/\/messages/);
  await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible({ timeout: 20000 });
  await saveShot(page, `${prefix}-admin-messages.png`);
}

async function runVisualFlow(context: BrowserContext, prefix: string, studentEmail: string, studentPassword: string) {
  const studentPage = await context.newPage();

  await loginStudent(studentPage, studentEmail, studentPassword);
  await captureStudentPages(studentPage, prefix);
  await studentPage.close();

  const adminPage = await context.newPage();
  await loginAdmin(adminPage);
  await captureAdminPages(adminPage, prefix);
  await adminPage.close();
}

test("capture desktop and mobile visual pass", async ({ browser }) => {
  test.setTimeout(360000);

  const unique = Date.now();
  const studentName = `Visual Student ${unique}`;
  const studentEmail = `visual.student.${unique}@example.com`;
  const studentPassword = "Student@2026";

  await fetch("http://localhost:4000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: studentName, email: studentEmail, password: studentPassword }),
  });

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await runVisualFlow(desktopContext, "desktop", studentEmail, studentPassword);
  await desktopContext.close();

  const mobileContext = await browser.newContext({ ...devices["iPhone 13"] });
  await runVisualFlow(mobileContext, "mobile", studentEmail, studentPassword);
  await mobileContext.close();
});
