import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

const normalizeDatabaseUrl = (rawValue) => {
  if (!rawValue) {
    return "";
  }

  const trimmed = rawValue.trim();
  const postgresqlMatch = trimmed.match(/postgres(?:ql)?:\/\/[^\s'\"]+/i);
  if (postgresqlMatch) {
    return postgresqlMatch[0];
  }

  return trimmed.replace(/^['\"]|['\"]$/g, "");
};

const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);

let prismaInitError = null;
let prismaClient = globalForPrisma.prisma || null;

if (!prismaClient) {
  if (!connectionString) {
    prismaInitError = new Error("DATABASE_URL is required to initialize Prisma.");
  } else {
    const adapter = new PrismaPg({ connectionString });
    prismaClient = new PrismaClient({
      adapter,
      log: ["warn", "error"],
    });
  }
}

if (process.env.NODE_ENV !== "production" && prismaClient) {
  globalForPrisma.prisma = prismaClient;
}

export const getPrismaInitError = () => prismaInitError;

export const prisma = new Proxy(
  {},
  {
    get(_target, property) {
      if (!prismaClient) {
        throw prismaInitError || new Error("Prisma client is not initialized.");
      }

      const value = prismaClient[property];
      return typeof value === "function" ? value.bind(prismaClient) : value;
    },
  }
);
