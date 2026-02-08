import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/config/env.config";

/**
 * Optimized PostgreSQL connection pool
 * Configured for serverless and production environments
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if can't get connection
});

const adapter = new PrismaPg(pool);

/**
 * Global Prisma client singleton
 * Prevents multiple instances in development (Next.js hot reload)
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"] // Detailed logging in development
        : ["error"], // Only errors in production
  });

// Prevent multiple instances in development
if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures database connections are closed properly
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}

// Handle process termination
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await disconnectPrisma();
  });
}
