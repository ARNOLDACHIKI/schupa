import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { DocumentType, FeeType, NotificationType, UserRole } from "@prisma/client";
import { prisma, getPrismaInitError } from "./lib/prisma.js";
import {
  sendWelcomeEmail,
  sendSignupVerificationCodeEmail,
  sendPasswordResetEmail,
  sendAdminMessageEmail,
  sendUploadConfirmationEmail,
  sendInquiryReceivedEmail,
  sendInquiryReplyEmail,
} from "./lib/email.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@schupa.org";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@2026";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "SCHUPA Admin";
const AUTO_SEED_ADMIN =
  (process.env.AUTO_SEED_ADMIN || (process.env.VERCEL_ENV === "preview" ? "true" : "false")) === "true";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercelRuntime = process.env.VERCEL === "1";
const uploadsDir = isVercelRuntime ? "/tmp/uploads" : path.resolve(__dirname, "../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:4173,http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (process.env.FRONTEND_URL) {
  corsOrigins.push(process.env.FRONTEND_URL.trim());
}

if (process.env.VERCEL_URL) {
  corsOrigins.push(`https://${process.env.VERCEL_URL}`);
}

const isLocalDevOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch (_error) {
    return false;
  }
};

const isVercelPreviewOrigin = (origin) => {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch (_error) {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        corsOrigins.includes(origin) ||
        isLocalDevOrigin(origin) ||
        isVercelPreviewOrigin(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "7d",
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again shortly." },
});
app.use("/api", limiter);

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const authRequired = asyncHandler(async (req, res, next) => {
  const tokenHeader = req.headers.authorization || "";
  const token = tokenHeader.startsWith("Bearer ") ? tokenHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid token." });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token." });
  }
});

const adminRequired = (req, res, next) => {
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Admin access required." });
  }
  return next();
};

const studentOwnOrAdmin = (req, res, next) => {
  const { id } = req.params;
  const canAccess = req.user.role === UserRole.ADMIN || req.user.profile?.id === id;
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden." });
  }
  return next();
};

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const generateVerificationCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const isTransientDbTimeout = (error) => {
  const message = String(error?.message || "");
  return error?.code === "ETIMEDOUT" || message.includes("ETIMEDOUT");
};

const isMissingRelationError = (error) => {
  const message = String(error?.message || "");
  return (
    error?.code === "P2021" ||
    message.includes("relation") && message.includes("does not exist") ||
    message.includes("table") && message.includes("does not exist")
  );
};

const runBestEffortDbTask = async (task, label) => {
  try {
    await withDbRetry(task);
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(`[db] Skipping ${label}:`, error.message);
      return;
    }
    throw error;
  }
};

const withDbRetry = async (operation, maxAttempts = 3) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;
      if (!isTransientDbTimeout(error) || attempt >= maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  throw new Error("Database operation failed after retries.");
};

const ensureAdminAccount = async () => {
  if (!AUTO_SEED_ADMIN) {
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await withDbRetry(() =>
    prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        name: ADMIN_NAME,
        passwordHash,
        role: UserRole.ADMIN,
        approved: true,
        emailVerified: true,
      },
      create: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: UserRole.ADMIN,
        approved: true,
        emailVerified: true,
      },
    })
  );
};

const toUserDto = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role.toLowerCase(),
  approved: user.approved,
});

const toStudentDto = (profile) => {
  const feeRecords = profile.feeRecords.map((record) => ({
    id: record.id,
    date: formatDate(record.date),
    description: record.description,
    amount: Number(record.amount),
    type: record.type.toLowerCase(),
  }));

  const feeBalance = feeRecords.reduce(
    (sum, record) => sum + (record.type === "charge" ? record.amount : -record.amount),
    0
  );

  return {
    id: profile.id,
    userId: profile.user.id,
    name: profile.user.name,
    email: profile.user.email,
    photo: profile.photo || "",
    bio: profile.bio || "",
    course: profile.course,
    institution: profile.institution,
    yearJoined: profile.yearJoined,
    currentYear: profile.currentYear,
    totalYears: profile.totalYears,
    results: profile.results.map((result) => ({
      id: result.id,
      semester: result.semester,
      gpa: Number(result.gpa),
      year: result.year,
    })),
    feeRecords,
    feeBalance,
    remarks: profile.remarks.map((remark) => ({
      id: remark.id,
      date: formatDate(remark.date),
      text: remark.text,
      by: remark.by.name,
      byId: remark.by.id,
    })),
    documents: profile.documents.map((doc) => ({
      id: doc.id,
      type:
        doc.type === DocumentType.RESULT
          ? "result"
          : doc.type === DocumentType.FEE_STATEMENT
            ? "fee_statement"
            : "school_id",
      name: doc.originalName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      url: `/uploads/${path.basename(doc.storagePath)}`,
      uploadedAt: doc.createdAt.toISOString(),
    })),
  };
};

const userWithProfileInclude = {
  user: true,
  results: {
    orderBy: [{ year: "asc" }, { semester: "asc" }],
  },
  feeRecords: {
    orderBy: { date: "asc" },
  },
  remarks: {
    include: { by: true },
    orderBy: { date: "desc" },
  },
  documents: {
    orderBy: { createdAt: "desc" },
  },
};

const createNotification = async (userId, type, title, message) => {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  });
};

const logAudit = async ({ actorId, action, entity, entityId, metadata }) => {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
};

app.get("/api/health", (_req, res) => {
  const prismaInitError = getPrismaInitError();
  if (prismaInitError) {
    return res.status(503).json({ ok: false, message: prismaInitError.message });
  }

  res.json({ ok: true });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  const prismaInitError = getPrismaInitError();
  if (prismaInitError) {
    return res.status(500).json({
      message: "Backend configuration error: DATABASE_URL is missing or invalid.",
    });
  }

  return next();
});

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);

    let user = await withDbRetry(() => prisma.user.findUnique({ where: { email: body.email } }));

    if (AUTO_SEED_ADMIN && body.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      await ensureAdminAccount();
      user = await withDbRetry(() => prisma.user.findUnique({ where: { email: body.email } }));
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.role === UserRole.STUDENT && !user.emailVerified) {
      return res.status(403).json({ message: "Email not verified. Enter the verification code sent to your email." });
    }

    if (user.role === UserRole.STUDENT && !user.approved) {
      return res.status(403).json({ message: "Account pending admin approval." });
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ token, user: toUserDto(user) });
  })
);

app.post(
  "/api/auth/signup",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2, "Full name must be at least 2 characters."),
        email: z.string().email("Enter a valid email address."),
        password: z.string().min(6, "Password must be at least 6 characters."),
      })
      .parse(req.body);

    const existing = await withDbRetry(() => prisma.user.findUnique({ where: { email: body.email } }));
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const verificationCode = generateVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await withDbRetry(() =>
      prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash,
          role: UserRole.STUDENT,
          approved: false,
          emailVerified: false,
          emailVerificationCode: verificationCode,
          emailVerificationExpiresAt: verificationExpiresAt,
        },
      })
    );

    await runBestEffortDbTask(() =>
      prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          bio: "",
          course: "Pending Course Assignment",
          institution: "Pending Institution Assignment",
          yearJoined: new Date().getFullYear(),
          currentYear: 1,
          totalYears: 4,
        },
      })
    , "student profile bootstrap");

    await runBestEffortDbTask(() =>
      prisma.userPreference.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
        },
      })
    , "user preference bootstrap");

    await runBestEffortDbTask(() =>
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "auth.signup",
          entity: "user",
          entityId: user.id,
          metadata: JSON.stringify({ email: user.email }),
        },
      })
    , "signup audit log");

    try {
      await sendSignupVerificationCodeEmail(body.name, body.email, verificationCode);
    } catch (emailError) {
      console.error("Signup verification email failed:", emailError.message);
    }

    return res.status(201).json({
      message: "Application submitted. Enter the verification code sent to your email to continue.",
    });
  })
);

app.post(
  "/api/auth/verify-signup-code",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        code: z
          .string()
          .trim()
          .regex(/^\d{6}$/),
      })
      .parse(req.body);

    const user = await withDbRetry(() => prisma.user.findUnique({ where: { email: body.email } }));

    if (!user || user.role !== UserRole.STUDENT) {
      return res.status(400).json({ message: "Invalid verification request." });
    }

    if (user.emailVerified) {
      return res.json({ message: "Email already verified." });
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
      return res.status(400).json({ message: "Verification code not found. Request a new code." });
    }

    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Verification code has expired. Request a new code." });
    }

    if (user.emailVerificationCode !== body.code) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    await withDbRetry(() =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiresAt: null,
        },
      })
    );

    try {
      await sendWelcomeEmail(user.name, user.email);
    } catch (emailError) {
      console.error("Post-verification email failed:", emailError.message);
    }

    return res.json({ message: "Email verified. Your application is now awaiting admin approval." });
  })
);

app.post(
  "/api/auth/resend-signup-code",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email() }).parse(req.body);

    const user = await withDbRetry(() => prisma.user.findUnique({ where: { email: body.email } }));
    if (!user || user.role !== UserRole.STUDENT) {
      return res.json({ message: "If the account exists, a verification code has been sent." });
    }

    if (user.emailVerified) {
      return res.json({ message: "Email already verified." });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await withDbRetry(() =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCode: verificationCode,
          emailVerificationExpiresAt: verificationExpiresAt,
        },
      })
    );

    try {
      await sendSignupVerificationCodeEmail(user.name, user.email, verificationCode);
    } catch (emailError) {
      console.error("Resend verification email failed:", emailError.message);
    }

    return res.json({ message: "A new verification code has been sent." });
  })
);

app.post(
  "/api/auth/forgot-password",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user) {
      return res.json({ message: "If the account exists, a reset link will be sent." });
    }

    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.passwordResetRequest.deleteMany({ where: { email: body.email } });

    await prisma.passwordResetRequest.create({
      data: {
        email: body.email,
        token: resetToken,
        expiresAt,
      },
    });

    try {
      await sendPasswordResetEmail(user.name, body.email, resetToken);
    } catch (emailError) {
      console.error("Reset email failed:", emailError.message);
      return res.status(500).json({ message: "Failed to send reset email. Please try again." });
    }

    return res.json({ message: "If the account exists, a reset link will be sent." });
  })
);

app.post(
  "/api/auth/reset-password",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        token: z.string().min(1),
        newPassword: z.string().min(6),
      })
      .parse(req.body);

    const reset = await prisma.passwordResetRequest.findUnique({ where: { token: body.token } });

    if (!reset || reset.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const user = await prisma.user.findUnique({ where: { email: reset.email } });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const newPasswordHash = await bcrypt.hash(body.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await prisma.passwordResetRequest.delete({ where: { id: reset.id } });

    return res.json({ message: "Password reset successfully. You can now sign in." });
  })
);

app.get(
  "/api/auth/me",
  authRequired,
  asyncHandler(async (req, res) => {
    return res.json({ user: toUserDto(req.user) });
  })
);

app.get(
  "/api/users/admins",
  authRequired,
  asyncHandler(async (_req, res) => {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return res.json({ admins });
  })
);

app.post(
  "/api/auth/change-password",
  authRequired,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    await logAudit({
      actorId: user.id,
      action: "auth.change_password",
      entity: "user",
      entityId: user.id,
    });

    return res.json({ message: "Password changed successfully." });
  })
);

app.delete(
  "/api/auth/account",
  authRequired,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await logAudit({
      actorId: req.user.role === UserRole.ADMIN ? req.user.id : null,
      action: "auth.delete_account",
      entity: "user",
      entityId: userId,
    });

    await prisma.user.delete({ where: { id: userId } });

    return res.json({ message: "Account deleted." });
  })
);

app.get(
  "/api/students",
  authRequired,
  adminRequired,
  asyncHandler(async (_req, res) => {
    const profiles = await prisma.studentProfile.findMany({
      include: userWithProfileInclude,
      orderBy: { user: { name: "asc" } },
    });
    return res.json({ students: profiles.map(toStudentDto) });
  })
);

app.get(
  "/api/students/me",
  authRequired,
  asyncHandler(async (req, res) => {
    if (req.user.role !== UserRole.STUDENT || !req.user.profile) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { id: req.user.profile.id },
      include: userWithProfileInclude,
    });

    if (!profile) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    return res.json({ student: toStudentDto(profile) });
  })
);

app.get(
  "/api/students/:id",
  authRequired,
  studentOwnOrAdmin,
  asyncHandler(async (req, res) => {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: req.params.id },
      include: userWithProfileInclude,
    });
    if (!profile) {
      return res.status(404).json({ message: "Student not found." });
    }
    return res.json({ student: toStudentDto(profile) });
  })
);

app.delete(
  "/api/students/:id",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!profile || profile.user.role !== UserRole.STUDENT) {
      return res.status(404).json({ message: "Student not found." });
    }

    await prisma.user.delete({ where: { id: profile.userId } });

    await logAudit({
      actorId: req.user.id,
      action: "admin.student.delete",
      entity: "student_profile",
      entityId: profile.id,
      metadata: { studentUserId: profile.userId, studentEmail: profile.user.email },
    });

    return res.json({ message: "Student removed from the system." });
  })
);

app.post(
  "/api/students/:id/results",
  authRequired,
  studentOwnOrAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        semester: z.string().trim().min(2, "Semester is required."),
        year: z.coerce.number().int().min(1, "Year must be a positive number."),
        gpa: z.coerce.number().min(0, "GPA must be at least 0.").max(5, "GPA cannot exceed 5.0."),
      })
      .parse(req.body);

    const profile = await prisma.studentProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      return res.status(404).json({ message: "Student not found." });
    }

    const created = await prisma.result.create({
      data: {
        studentId: profile.id,
        semester: body.semester,
        year: body.year,
        gpa: body.gpa,
      },
    });

    await createNotification(
      profile.userId,
      NotificationType.RESULT,
      "New Result Recorded",
      `A result for ${body.semester} (${body.year}) with GPA ${body.gpa.toFixed(2)} was added.`
    );

    await logAudit({
      actorId: req.user.id,
      action: "student.result.create",
      entity: "result",
      entityId: created.id,
      metadata: { studentId: profile.id },
    });

    return res.status(201).json({ message: "Result saved." });
  })
);

app.post(
  "/api/students/:id/fees",
  authRequired,
  studentOwnOrAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        date: z.string().trim().min(8, "Payment date is required."),
        description: z.string().trim().min(3, "Description must be at least 3 characters."),
        amount: z.coerce.number().positive("Amount must be greater than 0."),
        type: z.enum(["payment", "charge"]),
      })
      .parse(req.body);

    const parsedDate = new Date(body.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid payment date." });
    }

    const profile = await prisma.studentProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      return res.status(404).json({ message: "Student not found." });
    }

    const created = await prisma.feeRecord.create({
      data: {
        studentId: profile.id,
        date: parsedDate,
        description: body.description,
        amount: body.amount,
        type: body.type === "payment" ? FeeType.PAYMENT : FeeType.CHARGE,
      },
    });

    await createNotification(
      profile.userId,
      NotificationType.FEE,
      "Fee Record Updated",
      `${body.type === "payment" ? "Payment" : "Charge"} of KES ${body.amount.toLocaleString()} was added.`
    );

    await logAudit({
      actorId: req.user.id,
      action: "student.fee.create",
      entity: "fee_record",
      entityId: created.id,
      metadata: { studentId: profile.id, type: body.type },
    });

    return res.status(201).json({ message: "Fee record saved." });
  })
);

app.patch(
  "/api/students/:id/profile",
  authRequired,
  studentOwnOrAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        photo: z.string().trim().max(2048).optional(),
        bio: z.string().trim().max(1000).optional(),
        course: z.string().trim().min(2, "Course must be at least 2 characters."),
        institution: z.string().trim().min(2, "Institution must be at least 2 characters."),
        yearJoined: z.coerce.number().int().min(1990).max(2100),
        currentYear: z.coerce.number().int().min(1).max(15),
        totalYears: z.coerce.number().int().min(1).max(15),
      })
      .parse(req.body);

    if (body.currentYear > body.totalYears) {
      return res.status(400).json({ message: "Current year cannot exceed total years." });
    }

    const profile = await prisma.studentProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      return res.status(404).json({ message: "Student not found." });
    }

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        photo: body.photo,
        bio: body.bio,
        course: body.course,
        institution: body.institution,
        yearJoined: body.yearJoined,
        currentYear: body.currentYear,
        totalYears: body.totalYears,
      },
    });

    return res.json({ message: "Profile updated." });
  })
);

app.post(
  "/api/students/:id/profile-photo",
  authRequired,
  studentOwnOrAdmin,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Only image files are allowed." });
    }

    const profile = await prisma.studentProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      return res.status(404).json({ message: "Student not found." });
    }

    const photoUrl = `/uploads/${path.basename(req.file.path)}`;

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { photo: photoUrl },
    });

    await logAudit({
      actorId: req.user.id,
      action: "student.profile_photo.upload",
      entity: "student_profile",
      entityId: profile.id,
      metadata: { filename: req.file.originalname },
    });

    return res.status(201).json({
      message: "Profile photo uploaded.",
      photo: photoUrl,
    });
  })
);

app.post(
  "/api/students/:id/remarks",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const body = z.object({ text: z.string().min(2) }).parse(req.body);

    const profile = await prisma.studentProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      return res.status(404).json({ message: "Student not found." });
    }

    const created = await prisma.remark.create({
      data: {
        studentId: profile.id,
        byId: req.user.id,
        text: body.text,
      },
    });

    await createNotification(profile.userId, NotificationType.REMARK, "New Admin Remark", body.text);

    await logAudit({
      actorId: req.user.id,
      action: "student.remark.create",
      entity: "remark",
      entityId: created.id,
      metadata: { studentId: profile.id },
    });

    return res.status(201).json({ message: "Remark added." });
  })
);

app.get(
  "/api/pending-users",
  authRequired,
  adminRequired,
  asyncHandler(async (_req, res) => {
    const pendingUsers = await prisma.user.findMany({
      where: { role: UserRole.STUDENT, approved: false, emailVerified: true },
      orderBy: { createdAt: "asc" },
    });
    return res.json({
      pendingUsers: pendingUsers.map(toUserDto),
    });
  })
);

app.post(
  "/api/pending-users/:id/approve",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const pendingUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!pendingUser || pendingUser.role !== UserRole.STUDENT) {
      return res.status(404).json({ message: "Pending user not found." });
    }

    if (!pendingUser.emailVerified) {
      return res.status(400).json({ message: "User email must be verified before approval." });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: pendingUser.id },
        data: { approved: true },
      }),
      prisma.studentProfile.upsert({
        where: { userId: pendingUser.id },
        update: {},
        create: {
          userId: pendingUser.id,
          bio: "",
          course: "Pending Course Assignment",
          institution: "Pending Institution Assignment",
          yearJoined: new Date().getFullYear(),
          currentYear: 1,
          totalYears: 4,
        },
      }),
      prisma.notification.create({
        data: {
          userId: pendingUser.id,
          type: NotificationType.APPROVAL,
          title: "Account Approved",
          message: "Your account has been approved by an administrator.",
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: req.user.id,
          action: "admin.approve_user",
          entity: "user",
          entityId: pendingUser.id,
        },
      }),
    ]);

    return res.json({ message: "User approved." });
  })
);

app.post(
  "/api/pending-users/:id/reject",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const pendingUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!pendingUser || pendingUser.role !== UserRole.STUDENT || pendingUser.approved) {
      return res.status(404).json({ message: "Pending user not found." });
    }

    await prisma.user.delete({ where: { id: pendingUser.id } });
    await logAudit({
      actorId: req.user.id,
      action: "admin.reject_user",
      entity: "user",
      entityId: pendingUser.id,
    });
    return res.json({ message: "Pending user rejected." });
  })
);

app.post(
  "/api/students/:id/documents",
  authRequired,
  studentOwnOrAdmin,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        type: z.enum(["result", "fee_statement", "school_id"]),
      })
      .parse(req.body);

    if (!req.file) {
      return res.status(400).json({ message: "File is required." });
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!profile) {
      return res.status(404).json({ message: "Student not found." });
    }

    const document = await prisma.uploadedDocument.create({
      data: {
        studentId: profile.id,
        uploadedById: req.user.id,
        type:
          body.type === "result"
            ? DocumentType.RESULT
            : body.type === "fee_statement"
              ? DocumentType.FEE_STATEMENT
              : DocumentType.SCHOOL_ID,
        originalName: req.file.originalname,
        storagePath: req.file.path,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    });

    const notificationType =
      body.type === "result"
        ? NotificationType.RESULT
        : body.type === "fee_statement"
          ? NotificationType.FEE
          : NotificationType.SYSTEM;

    const notificationTitle =
      body.type === "result"
        ? "Result Document Uploaded"
        : body.type === "fee_statement"
          ? "Fee Statement Uploaded"
          : "School ID Uploaded";

    await createNotification(profile.userId, notificationType, notificationTitle, `${req.file.originalname} has been uploaded successfully.`);

    await logAudit({
      actorId: req.user.id,
      action: "student.document.upload",
      entity: "uploaded_document",
      entityId: document.id,
      metadata: { studentId: profile.id, type: body.type, filename: req.file.originalname },
    });

    try {
      await sendUploadConfirmationEmail(profile.user.name, profile.user.email, req.file.originalname, body.type);
    } catch (error) {
      console.error("Upload confirmation email failed:", error.message);
    }

    return res.status(201).json({
      message: "Document uploaded.",
      document: {
        id: document.id,
        type: body.type,
        name: document.originalName,
        url: `/uploads/${path.basename(document.storagePath)}`,
      },
    });
  })
);

app.get(
  "/api/students/:id/documents",
  authRequired,
  studentOwnOrAdmin,
  asyncHandler(async (req, res) => {
    const profile = await prisma.studentProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      return res.status(404).json({ message: "Student not found." });
    }

    const documents = await prisma.uploadedDocument.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      documents: documents.map((doc) => ({
        id: doc.id,
        type:
          doc.type === DocumentType.RESULT
            ? "result"
            : doc.type === DocumentType.FEE_STATEMENT
              ? "fee_statement"
              : "school_id",
        name: doc.originalName,
        sizeBytes: doc.sizeBytes,
        uploadedAt: doc.createdAt.toISOString(),
        url: `/uploads/${path.basename(doc.storagePath)}`,
      })),
    });
  })
);

app.get(
  "/api/preferences",
  authRequired,
  asyncHandler(async (req, res) => {
    const preference = await prisma.userPreference.upsert({
      where: { userId: req.user.id },
      update: {},
      create: { userId: req.user.id },
    });

    return res.json({ preference });
  })
);

app.patch(
  "/api/preferences",
  authRequired,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        emailNotifications: z.boolean().optional(),
        weeklyReport: z.boolean().optional(),
        adminAlerts: z.boolean().optional(),
        feeReminders: z.boolean().optional(),
        language: z.enum(["en", "sw"]).optional(),
        darkMode: z.boolean().optional(),
      })
      .parse(req.body);

    const preference = await prisma.userPreference.upsert({
      where: { userId: req.user.id },
      update: body,
      create: { userId: req.user.id, ...body },
    });

    await logAudit({
      actorId: req.user.id,
      action: "user.preference.update",
      entity: "user_preference",
      entityId: preference.id,
      metadata: body,
    });

    return res.json({ message: "Preferences updated.", preference });
  })
);

app.get(
  "/api/notifications",
  authRequired,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type.toLowerCase(),
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      })),
    });
  })
);

app.patch(
  "/api/notifications/:id/read",
  authRequired,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { read: true },
    });

    if (notification.count === 0) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return res.json({ message: "Notification marked as read." });
  })
);

app.patch(
  "/api/notifications/read-all",
  authRequired,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user.id }, data: { read: true } });
    return res.json({ message: "All notifications marked as read." });
  })
);

app.delete(
  "/api/notifications/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) {
      return res.status(404).json({ message: "Notification not found." });
    }
    return res.json({ message: "Notification deleted." });
  })
);

app.get(
  "/api/messages",
  authRequired,
  asyncHandler(async (req, res) => {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ fromUserId: req.user.id }, { toUserId: req.user.id }],
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json({
      messages: messages.map((message) => ({
        id: message.id,
        subject: message.subject,
        body: message.body,
        read: message.read,
        createdAt: message.createdAt.toISOString(),
        from: message.fromUser,
        to: message.toUser,
      })),
    });
  })
);

app.post(
  "/api/messages",
  authRequired,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        toUserId: z.string().min(1),
        subject: z.string().min(2),
        body: z.string().min(2),
      })
      .parse(req.body);

    const recipient = await prisma.user.findUnique({ where: { id: body.toUserId } });
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: req.user.id,
        toUserId: body.toUserId,
        subject: body.subject,
        body: body.body,
      },
    });

    await createNotification(recipient.id, NotificationType.MESSAGE, `New message: ${body.subject}`, body.body);

    await logAudit({
      actorId: req.user.id,
      action: "message.send",
      entity: "message",
      entityId: message.id,
      metadata: { toUserId: recipient.id },
    });

    try {
      await sendAdminMessageEmail(recipient.name, recipient.email, body.subject, body.body);
    } catch (error) {
      console.error("Message notification email failed:", error.message);
    }

    return res.status(201).json({ message: "Message sent." });
  })
);

app.patch(
  "/api/messages/:id/read",
  authRequired,
  asyncHandler(async (req, res) => {
    const result = await prisma.message.updateMany({
      where: { id: req.params.id, toUserId: req.user.id },
      data: { read: true },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Message not found." });
    }

    return res.json({ message: "Message marked as read." });
  })
);

app.get(
  "/api/admin/audit-logs",
  authRequired,
  adminRequired,
  asyncHandler(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return res.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
    });
  })
);

app.get(
  "/api/admin/contact-messages",
  authRequired,
  adminRequired,
  asyncHandler(async (_req, res) => {
    const inquiries = await prisma.contactMessage.findMany({
      include: {
        repliedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const users = await prisma.user.findMany({
      where: {
        email: {
          in: inquiries.map((inquiry) => inquiry.email),
        },
      },
      select: { id: true, name: true, email: true },
    });

    const usersByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]));

    return res.json({
      inquiries: inquiries.map((inquiry) => ({
        id: inquiry.id,
        name: inquiry.name,
        email: inquiry.email,
        message: inquiry.message,
        createdAt: inquiry.createdAt.toISOString(),
        acknowledgedAt: inquiry.acknowledgedAt ? inquiry.acknowledgedAt.toISOString() : null,
        repliedAt: inquiry.repliedAt ? inquiry.repliedAt.toISOString() : null,
        replyMessage: inquiry.replyMessage || null,
        repliedBy: inquiry.repliedBy,
        linkedUser: usersByEmail.get(inquiry.email.toLowerCase()) || null,
      })),
    });
  })
);

app.post(
  "/api/admin/contact-messages/:id/reply",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        message: z.string().min(2),
        subject: z.string().min(2).optional(),
      })
      .parse(req.body);

    console.log(`[Contact Reply] Processing reply for inquiry ${req.params.id}`);
    console.log(`[Contact Reply] Message received: "${body.message.substring(0, 100)}..."`);
    console.log(`[Contact Reply] Message length: ${body.message.length}`);

    const inquiry = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    const trimmedReply = body.message.trim();
    const subject = body.subject?.trim() || "Reply to your SCHUPA inquiry";

    console.log(`[Contact Reply] Trimmed message length: ${trimmedReply.length}`);

    const updatedInquiry = await prisma.contactMessage.update({
      where: { id: inquiry.id },
      data: {
        replyMessage: trimmedReply,
        repliedAt: new Date(),
        repliedById: req.user.id,
      },
    });

    console.log(`[Contact Reply] Updated inquiry in database. Stored message: "${updatedInquiry.replyMessage.substring(0, 100)}..."`);

    const linkedUser = await prisma.user.findUnique({ where: { email: inquiry.email } });
    let deliveredInWebsite = false;

    if (linkedUser) {
      await prisma.message.create({
        data: {
          fromUserId: req.user.id,
          toUserId: linkedUser.id,
          subject,
          body: trimmedReply,
        },
      });

      await createNotification(
        linkedUser.id,
        NotificationType.MESSAGE,
        `New message: ${subject}`,
        trimmedReply
      );

      deliveredInWebsite = true;
      console.log(`[Contact Reply] Created in-website message for linked user ${linkedUser.email}`);
    }

    try {
      console.log(`[Contact Reply] Sending email to ${inquiry.email}...`);
      await sendInquiryReplyEmail(inquiry.name, inquiry.email, trimmedReply);
      console.log(`[Contact Reply] Email sent successfully`);
    } catch (error) {
      console.error("Inquiry reply email failed:", error.message);
    }

    await logAudit({
      actorId: req.user.id,
      action: "contact.reply",
      entity: "contact_message",
      entityId: inquiry.id,
      metadata: { deliveredInWebsite },
    });

    return res.json({
      message: "Inquiry reply sent.",
      inquiry: {
        id: updatedInquiry.id,
        repliedAt: updatedInquiry.repliedAt.toISOString(),
        replyMessage: updatedInquiry.replyMessage,
      },
      deliveredInWebsite,
    });
  })
);

app.post(
  "/api/contact",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().trim().min(2),
        email: z.string().email(),
        message: z.string().trim().min(2, "Message must contain at least 2 characters."),
      })
      .parse(req.body);

    const inquiry = await prisma.contactMessage.create({ data: body });

    try {
      await sendInquiryReceivedEmail(body.name, body.email, body.message);
      await prisma.contactMessage.update({
        where: { id: inquiry.id },
        data: { acknowledgedAt: new Date() },
      });
    } catch (error) {
      console.error("Inquiry acknowledgement email failed:", error.message);
    }

    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          NotificationType.SYSTEM,
          "New contact inquiry",
          `${body.name} (${body.email}) sent a new contact inquiry.`
        )
      )
    );

    return res.status(201).json({ message: "Message sent." });
  })
);

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    const firstIssue = err.issues[0]?.message;
    return res.status(400).json({
      message: firstIssue ? `Invalid request payload: ${firstIssue}` : "Invalid request payload.",
      issues: err.issues,
    });
  }

  console.error(err);
  return res.status(500).json({ message: "Server error." });
});

if (!isVercelRuntime) {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

export default app;
