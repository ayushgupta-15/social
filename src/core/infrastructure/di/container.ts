/**
 * Simple Dependency Injection Container
 *
 * Manages dependencies following the Dependency Inversion Principle.
 * Repositories and services are registered here and can be resolved by key.
 */

type Factory<T> = () => T;

class Container {
  private instances = new Map<string, unknown>();
  private factories = new Map<string, Factory<unknown>>();

  /**
   * Register a singleton instance
   * The instance is created immediately and reused on every resolve
   */
  registerInstance<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  /**
   * Register a factory function for lazy initialization
   * The instance is created on first resolve and then reused
   */
  registerFactory<T>(key: string, factory: Factory<T>): void {
    this.factories.set(key, factory);
  }

  /**
   * Resolve a dependency by key
   * @throws {Error} if no registration found
   */
  resolve<T>(key: string): T {
    // Return existing instance if available
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    // Create from factory if registered
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      this.instances.set(key, instance);
      return instance as T;
    }

    throw new Error(
      `No registration found for key: "${key}". ` +
        `Available keys: ${Array.from(this.factories.keys()).join(", ")}`
    );
  }

  /**
   * Check if a key is registered
   */
  has(key: string): boolean {
    return this.instances.has(key) || this.factories.has(key);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.instances.clear();
    this.factories.clear();
  }
}

export const container = new Container();

// Import repository implementations
import { PrismaPostRepository } from "../database/prisma/repositories/prisma-post.repository";
import { PrismaUserRepository } from "../database/prisma/repositories/prisma-user.repository";
import { PrismaNotificationRepository } from "../database/prisma/repositories/prisma-notification.repository";

// Register repository factories
// These are lazy-loaded singletons - created on first use and then reused
container.registerFactory("PostRepository", () => new PrismaPostRepository());
container.registerFactory("UserRepository", () => new PrismaUserRepository());
container.registerFactory("NotificationRepository", () => new PrismaNotificationRepository());
