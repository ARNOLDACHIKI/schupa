import "dotenv/config";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "../server/lib/prisma.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@schupa.org";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@2026";
const ADMIN_NAME = "SCHUPA Admin";

async function seed() {
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.$transaction([
    prisma.contactMessage.deleteMany(),
    prisma.passwordResetRequest.deleteMany(),
    prisma.user.deleteMany({
      where: {
        role: UserRole.STUDENT,
      },
    }),
    prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        name: ADMIN_NAME,
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        approved: true,
        emailVerified: true,
      },
      create: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        approved: true,
        emailVerified: true,
      },
    }),
    prisma.user.deleteMany({
      where: {
        role: UserRole.ADMIN,
        email: {
          not: ADMIN_EMAIL,
        },
      },
    }),
  ]);

  console.log("Seed completed: primary admin account is ready.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
