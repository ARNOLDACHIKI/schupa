import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";
const API_URL = process.env.PLAYWRIGHT_API_URL || "http://localhost:4000/api";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@schupa.org";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@2026";

const runId = `${Date.now()}`;
const outputDir = path.resolve("artifacts/visual-pass", runId);
fs.mkdirSync(outputDir, { recursive: true });

const report = [];

function reportEntry(entry) {
  report.push({ timestamp: new Date().toISOString(), ...entry });
}

async function safeCapture(page, viewportLabel, area, route, fileName, headingRegex) {
  try {
    await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    const headingVisible = await page
      .getByText(headingRegex)
      .first()
      .isVisible({ timeout: 6000 })
      .catch(() => false);

    const shotPath = path.join(outputDir, fileName);
    await page.screenshot({ path: shotPath, fullPage: true });

    reportEntry({
      viewport: viewportLabel,
      area,
      route,
      screenshot: shotPath,
      status: headingVisible ? "ok" : "warning",
      note: headingVisible ? "Expected heading visible." : "Heading not clearly visible, screenshot captured for review.",
    });
  } catch (error) {
    reportEntry({
      viewport: viewportLabel,
      area,
      route,
      status: "error",
      note: error instanceof Error ? error.message : String(error),
    });
  }
}

async function login(page, email, password, expectedRouteRegex) {
  await page.goto(`${FRONTEND_URL}/signin`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(expectedRouteRegex, { timeout: 20000 });
}

async function ensureStudentAccount(email, password, name) {
  await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

async function runViewport(browser, viewportLabel, contextOptions, studentCreds) {
  const context = await browser.newContext(contextOptions);
  context.setDefaultTimeout(15000);

  const studentPage = await context.newPage();
  await login(studentPage, studentCreds.email, studentCreds.password, /\/dashboard/);

  await safeCapture(studentPage, viewportLabel, "student", "/dashboard", `${viewportLabel}-student-dashboard.png`, /Welcome back/i);
  await safeCapture(studentPage, viewportLabel, "student", "/results", `${viewportLabel}-student-results.png`, /Academic Results/i);
  await safeCapture(studentPage, viewportLabel, "student", "/fees", `${viewportLabel}-student-fees.png`, /Fee Management|Fee Statements/i);
  await safeCapture(studentPage, viewportLabel, "student", "/messages", `${viewportLabel}-student-messages.png`, /Messages/i);
  await safeCapture(studentPage, viewportLabel, "student", "/notifications", `${viewportLabel}-student-notifications.png`, /Notifications/i);
  await safeCapture(studentPage, viewportLabel, "student", "/settings", `${viewportLabel}-student-settings.png`, /Settings/i);
  await studentPage.close();

  const adminPage = await context.newPage();
  await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD, /\/admin/);
  await safeCapture(adminPage, viewportLabel, "admin", "/admin", `${viewportLabel}-admin-overview.png`, /Admin Dashboard/i);
  await safeCapture(adminPage, viewportLabel, "admin", "/admin/students", `${viewportLabel}-admin-students.png`, /Student Management/i);
  await safeCapture(adminPage, viewportLabel, "admin", "/messages", `${viewportLabel}-admin-messages.png`, /Messages/i);
  await adminPage.close();

  await context.close();
}

async function main() {
  const studentCreds = {
    name: `Visual Student ${runId}`,
    email: `visual.student.${runId}@example.com`,
    password: "Student@2026",
  };

  await ensureStudentAccount(studentCreds.email, studentCreds.password, studentCreds.name);

  const browser = await chromium.launch({ headless: true });
  try {
    await runViewport(browser, "desktop", { viewport: { width: 1440, height: 900 } }, studentCreds);
    await runViewport(browser, "mobile", { ...devices["iPhone 13"] }, studentCreds);
  } finally {
    await browser.close();
  }

  const reportPath = path.join(outputDir, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const summary = {
    outputDir,
    reportPath,
    totals: {
      ok: report.filter((r) => r.status === "ok").length,
      warning: report.filter((r) => r.status === "warning").length,
      error: report.filter((r) => r.status === "error").length,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
