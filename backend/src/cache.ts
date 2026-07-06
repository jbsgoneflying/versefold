/**
 * Two-tier scripture cache: in-memory LRU in front of a JSON-file persistent store.
 * Interface is adapter-shaped so Redis/Postgres can replace the file tier at scale
 * without touching call sites.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

interface Entry {
  value: unknown;
  expiresAt: number | null; // null = never
}

export class ScriptureCache {
  private memory = new Map<string, Entry>();
  private readonly maxMemoryEntries = 5000;
  private dirty = false;

  constructor(private readonly filePath: string) {
    if (existsSync(filePath)) {
      try {
        const disk = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, Entry>;
        for (const [k, v] of Object.entries(disk)) this.memory.set(k, v);
      } catch {
        // Corrupt cache file is not fatal; start cold.
      }
    }
    setInterval(() => this.flush(), 30_000).unref();
  }

  get<T>(key: string): T | undefined {
    const entry = this.memory.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return undefined;
    }
    // LRU touch
    this.memory.delete(key);
    this.memory.set(key, entry);
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlSeconds: number): void {
    if (this.memory.size >= this.maxMemoryEntries) {
      const oldest = this.memory.keys().next().value;
      if (oldest !== undefined) this.memory.delete(oldest);
    }
    this.memory.set(key, {
      value,
      expiresAt: ttlSeconds === 0 ? null : Date.now() + ttlSeconds * 1000,
    });
    this.dirty = true;
  }

  flush(): void {
    if (!this.dirty) return;
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(Object.fromEntries(this.memory)));
      this.dirty = false;
    } catch {
      // Persistence failure degrades to memory-only; never crash the server for cache IO.
    }
  }

  get size(): number {
    return this.memory.size;
  }
}
