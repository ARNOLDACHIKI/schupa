import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";
const API_BASE = process.env.VITE_API_URL || "http://localhost:4000/api";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@schupa.org";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@2026";

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { ok: response.ok, status: response.status, payload };
}

async function main() {
  const unique = Date.now();
  const applicant = {
    name: `Verify Flow ${unique}`,
    email: `verify.flow.${unique}@example.com`,
    password: "Student@2026",
  };

  const signup = await api("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(applicant),
  });

  if (!signup.ok) {
    throw new Error(`Signup failed (${signup.status}): ${signup.payload?.message || "unknown"}`);
  }

  const created = await prisma.user.findUnique({ where: { email: applicant.email } });
  if (!created || !created.emailVerificationCode) {
    throw new Error("Verification code was not created for signup.");
  }

  const loginBeforeVerify = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: applicant.email, password: applicant.password }),
  });

  const wrongCode = await api("/auth/verify-signup-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: applicant.email, code: "000000" }),
  });

  const verify = await api("/auth/verify-signup-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: applicant.email, code: created.emailVerificationCode }),
  });

  if (!verify.ok) {
    throw new Error(`Verification failed (${verify.status}): ${verify.payload?.message || "unknown"}`);
  }

  const loginAfterVerify = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: applicant.email, password: applicant.password }),
  });

  const adminLogin = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!adminLogin.ok || !adminLogin.payload?.token) {
    throw new Error(`Admin login failed (${adminLogin.status}).`);
  }

  const pending = await api("/pending-users", {
    headers: { Authorization: `Bearer ${adminLogin.payload.token}` },
  });

  const appearsInPending = Array.isArray(pending.payload?.pendingUsers)
    ? pending.payload.pendingUsers.some((user) => user.email === applicant.email)
    : false;

  console.log(
    JSON.stringify(
      {
        signupStatus: signup.status,
        codeGenerated: /^\d{6}$/.test(created.emailVerificationCode),
        loginBeforeVerifyStatus: loginBeforeVerify.status,
        loginBeforeVerifyMessage: loginBeforeVerify.payload?.message,
        wrongCodeStatus: wrongCode.status,
        verifyStatus: verify.status,
        loginAfterVerifyStatus: loginAfterVerify.status,
        loginAfterVerifyMessage: loginAfterVerify.payload?.message,
        listedInAdminPending: appearsInPending,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
