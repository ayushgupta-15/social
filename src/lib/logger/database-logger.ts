import type { Prisma } from "@prisma/client";
import { dbLogger } from "./logger";

/**
 * Database Query Logger
 *
 * Logs slow queries and database errors for monitoring and optimization.
 */

const SLOW_QUERY_THRESHOLD = 500; // 500ms

export function createDatabaseLogger(): Prisma.LogDefinition[] {
  if (process.env.NODE_ENV === "production") {
    return [
      {
        level: "warn",
        emit: "event",
      },
      {
        level: "error",
        emit: "event",
      },
    ];
  }

  return [
    {
      level: "query",
      emit: "event",
    },
    {
      level: "warn",
      emit: "event",
    },
    {
      level: "error",
      emit: "event",
    },
  ];
}

export function attachDatabaseLoggers(prisma: any) {
  prisma.$on("query", (e: Prisma.QueryEvent) => {
    const duration = e.duration;

    if (duration > SLOW_QUERY_THRESHOLD) {
      dbLogger.warn(
        {
          query: e.query,
          params: e.params,
          duration,
          target: e.target,
        },
        "Slow database query detected"
      );
    } else {
      dbLogger.debug(
        {
          query: e.query,
          duration,
        },
        "Database query executed"
      );
    }
  });

  prisma.$on("warn", (e: Prisma.LogEvent) => {
    dbLogger.warn(
      {
        message: e.message,
        target: e.target,
      },
      "Database warning"
    );
  });

  prisma.$on("error", (e: Prisma.LogEvent) => {
    dbLogger.error(
      {
        message: e.message,
        target: e.target,
      },
      "Database error"
    );
  });
}
