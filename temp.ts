// src/Controllers/MemoryController.ts

import fs from "fs/promises";
import path from "path";

interface UserMemory {
  name: string;
  language: string;
  lastBody: string;
}

interface CacheEntry {
  data: UserMemory;
  timestamp: number;
}

const memoryMap = new Map<string, CacheEntry>();
const FILE_PATH = path.resolve("/tmp/user-memory.json");
const TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export class MemoryController {
  // Short-term memory: load user memory from in-memory Map or /tmp file
  public static async loadShortTermMemory(phone: string): Promise<UserMemory | null> {
    const now = Date.now();

    // Check in-memory cache first
    if (memoryMap.has(phone)) {
      const { data, timestamp } = memoryMap.get(phone)!;
      if (now - timestamp < TTL) return data;
      memoryMap.delete(phone);
    }

    // Load from file if available
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      const cache: Record<string, CacheEntry> = JSON.parse(raw);
      const entry = cache[phone];

      if (entry && now - entry.timestamp < TTL) {
        memoryMap.set(phone, entry); // Rehydrate memory
        return entry.data;
      }
    } catch (_) {
      // File may not exist or parse error
    }

    return null;
  }

  // Short-term memory: save user memory to in-memory Map and /tmp file
  public static async saveShortTermMemory(phone: string, memory: UserMemory): Promise<void> {
    const now = Date.now();
    const newEntry: CacheEntry = { data: memory, timestamp: now };
    memoryMap.set(phone, newEntry);

    // Update disk cache
    let diskCache: Record<string, CacheEntry> = {};
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      diskCache = JSON.parse(raw);
    } catch (_) {
      // File doesn't exist or is empty
    }

    diskCache[phone] = newEntry;
    await fs.writeFile(FILE_PATH, JSON.stringify(diskCache));
  }

  // Short-term memory: clear memory manually (for testing or reset)
  public static async clearShortTermMemory(phone: string): Promise<void> {
    memoryMap.delete(phone);

    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      const cache: Record<string, CacheEntry> = JSON.parse(raw);
      delete cache[phone];
      await fs.writeFile(FILE_PATH, JSON.stringify(cache));
    } catch (_) {
      // Ignore errors
    }
  }
}
