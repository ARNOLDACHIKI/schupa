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
    name: `Workflow Student ${unique}`,
    email: `workflow.student.${unique}@example.com`,
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

  const createdUser = await prisma.user.findUnique({ where: { email: applicant.email } });
  if (!createdUser?.emailVerificationCode) {
    throw new Error("Verification code missing for applicant.");
  }

  const blockedLogin = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: applicant.email, password: applicant.password }),
  });

  if (blockedLogin.status !== 403 || !String(blockedLogin.payload?.message || "").includes("Email not verified")) {
    throw new Error(`Expected unverified login 403, got ${blockedLogin.status}`);
  }

  const verify = await api("/auth/verify-signup-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: applicant.email, code: createdUser.emailVerificationCode }),
  });

  if (!verify.ok) {
    throw new Error(`Verification failed (${verify.status}): ${verify.payload?.message || "unknown"}`);
  }

  const pendingLogin = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: applicant.email, password: applicant.password }),
  });

  if (pendingLogin.status !== 403 || !String(pendingLogin.payload?.message || "").includes("pending admin approval")) {
    throw new Error(`Expected pending approval login 403, got ${pendingLogin.status}`);
  }

  const adminLogin = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!adminLogin.ok || !adminLogin.payload?.token) {
    throw new Error(`Admin login failed (${adminLogin.status})`);
  }

  const adminToken = adminLogin.payload.token;

  const pending = await api("/pending-users", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (!pending.ok || !Array.isArray(pending.payload?.pendingUsers)) {
    throw new Error("Failed to load pending users.");
  }

  const pendingUser = pending.payload.pendingUsers.find((u) => u.email === applicant.email);
  if (!pendingUser) {
    throw new Error("Applicant not found in pending users.");
  }

  const approve = await api(`/pending-users/${pendingUser.id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (!approve.ok) {
    throw new Error(`Approval failed (${approve.status}): ${approve.payload?.message || "unknown"}`);
  }

  const approvedLogin = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: applicant.email, password: applicant.password }),
  });

  if (!approvedLogin.ok || !approvedLogin.payload?.token) {
    throw new Error(`Approved login failed (${approvedLogin.status})`);
  }

  const studentToken = approvedLogin.payload.token;
  const me = await api("/students/me", {
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (!me.ok || !me.payload?.student) {
    throw new Error(`Student profile check failed (${me.status})`);
  }

  console.log(
    JSON.stringify(
      {
        signupStatus: signup.status,
        unverifiedLoginStatus: blockedLogin.status,
        unverifiedMessage: blockedLogin.payload?.message,
        verificationStatus: verify.status,
        pendingLoginStatus: pendingLogin.status,
        pendingMessage: pendingLogin.payload?.message,
        pendingListed: true,
        approveStatus: approve.status,
        approvedLoginStatus: approvedLogin.status,
        studentProfileAvailable: Boolean(me.payload?.student?.id),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
