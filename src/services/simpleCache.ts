// src/services/simpleCache.ts
// Simple in-memory cache. Not distributed, not suitable for multi-instance production.

type CacheValue<T> = {
  expiresAt: number;
  value: T;
};

export class SimpleCache<T> {
  private store = new Map<string, CacheValue<T>>();

  constructor(private defaultTtlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }
}
