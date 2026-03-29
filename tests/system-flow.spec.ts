import "dotenv/config";
import { test, expect } from "@playwright/test";
import path from "node:path";
import { prisma } from "../server/lib/prisma.js";

const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@schupa.org";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@2026";

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("student and admin workflows are connected end-to-end", async ({ page }) => {
  test.setTimeout(120000);
  const unique = Date.now();
  const studentName = `E2E Student ${unique}`;
  const studentEmail = `e2e.student.${unique}@example.com`;
  const studentPassword = "Student@2026";
  const uploadFilePath = path.resolve("tests/fixtures/sample-proof.pdf");
  const messageSubject = `E2E message ${unique}`;
  const messageBody = "Hello admin, this is an integration test message.";

  await page.goto(`${FRONTEND_URL}/signup`);
  await page.getByPlaceholder("John Doe").fill(studentName);
  await page.getByPlaceholder("you@example.com").fill(studentEmail);
  await page.locator('input[placeholder="••••••••"]').first().fill(studentPassword);
  await page.locator('input[placeholder="••••••••"]').nth(1).fill(studentPassword);
  await page.locator("#terms").click();
  await page.locator("form").getByRole("button", { name: /sign up/i }).click();
  await expect(page.getByRole("heading", { name: "Verify Your Email" })).toBeVisible();

  const signedUpUser = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!signedUpUser?.emailVerificationCode) {
    throw new Error("Verification code not found for signed-up student.");
  }

  await page.getByPlaceholder("123456").fill(signedUpUser.emailVerificationCode);
  await page.getByRole("button", { name: /verify code/i }).click();
  await expect(page.getByRole("heading", { name: "Email Verified" })).toBeVisible();

  await page.getByRole("button", { name: /back to sign in/i }).click();
  await expect(page).toHaveURL(/\/signin/);

  await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("••••••••").fill(ADMIN_PASSWORD);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/admin/);

  await page.getByRole("button", { name: /^pending approvals$/i }).click();
  await expect(page.getByText(studentEmail).first()).toBeVisible({ timeout: 20000 });
  await page
    .locator("div")
    .filter({ hasText: studentEmail })
    .first()
    .getByRole("button", { name: /approve/i })
    .click();

  await page.getByRole("button", { name: /logout/i }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(`${FRONTEND_URL}/signin`);

  await page.getByPlaceholder("you@example.com").fill(studentEmail);
  await page.getByPlaceholder("••••••••").fill(studentPassword);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("button", { name: /upload results/i }).first().click();
  await expect(page).toHaveURL(/\/results/);
  await page.locator("select").first().selectOption("Semester 1");
  await page.getByPlaceholder("e.g., 3.8").fill("3.7");
  await page.locator('input[type="number"]').nth(1).fill("2026");
  await page.locator("#file-input").setInputFiles(uploadFilePath);
  await page.getByRole("button", { name: /upload results/i }).click();
  await expect(page.getByText(/Semester 1 2026/i).first()).toBeVisible();
  await expect(page.getByText(/sample-proof.pdf/i).first()).toBeVisible();

  await page.getByRole("button", { name: /dashboard/i }).first().click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("button", { name: /view fees/i }).first().click();
  await expect(page).toHaveURL(/\/fees/);
  await page.getByPlaceholder("e.g., 25000").fill("25000");
  await page.locator("#fee-file-input").setInputFiles(uploadFilePath);
  await page.getByRole("button", { name: /submit payment/i }).click();
  await expect(page.getByText(/uploaded payment/i).first()).toBeVisible();
  await expect(page.getByText(/sample-proof.pdf/i).first()).toBeVisible();

  await page.getByRole("button", { name: /messages/i }).first().click();
  await expect(page).toHaveURL(/\/messages/);
  await page.locator('input[placeholder="Subject"]').first().fill(messageSubject);
  await page.getByPlaceholder("Write your message").fill(messageBody);
  await page.getByRole("button", { name: /^send$/i }).click();
  await expect(page.getByText(messageSubject).first()).toBeVisible();

  await page.getByRole("button", { name: /notifications/i }).first().click();
  await expect(page).toHaveURL(/\/notifications/);
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await expect(page.getByText(/Result Document Uploaded|Fee Record Updated|New Result Recorded/i).first()).toBeVisible();

  await page.getByRole("button", { name: /settings/i }).first().click();
  await expect(page).toHaveURL(/\/settings/);
  await page.getByRole("button", { name: /notifications/i }).nth(1).click();
  const darkModeCheckbox = page.getByRole("checkbox").last();
  await darkModeCheckbox.check();
  await page.getByRole("button", { name: /save preferences/i }).click();
  await expect(page.getByText(/preferences updated/i).first()).toBeVisible();

  await page.getByRole("button", { name: /logout/i }).first().click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto(`${FRONTEND_URL}/signin`);
  await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("••••••••").fill(ADMIN_PASSWORD);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/admin/);

  await page.getByRole("button", { name: /^students$/i }).click();
  await expect(page.getByPlaceholder("Search students...")).toBeVisible({ timeout: 20000 });
  await page.getByPlaceholder("Search students...").fill(studentEmail);
  await expect(page.getByText(studentName).first()).toBeVisible({ timeout: 20000 });

  await page.getByRole("button", { name: /messages/i }).first().click();
  await expect(page).toHaveURL(/\/messages/);
  await expect(page.getByText(messageSubject).first()).toBeVisible();
});
