// src/Controllers/memoryController.ts

import fs from "fs/promises";
import path from "path";

interface UserMemory {
  name: string;
  language: string;
  lastBody: string;
}

interface CacheEntry {
  data: UserMemory[]; // Array of entries per name
  timestamp: number;
}

const localFilePath = path.resolve("../../../whatsapp-bot/tmp-local/user-memory.json");
const onlineFilePath = path.resolve("/tmp/user-memory.json");

const memoryMap = new Map<string, CacheEntry>();
const FILE_PATH = path.resolve(process.env
    .IS_SERVERLESS ? onlineFilePath : localFilePath
); // Change this to onlineFilePath in production
const TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export class MemoryController {
  // Short-term memory: l oad all matching user memories from in-memory Map or /tmp file by name
  public static async loadShortTermMemory(phone: string): Promise<UserMemory[] | null> {
    const now = Date.now();

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

  // Short-term memory: append new memory to in-memory Map and /tmp file
  public static async saveShortTermMemory(phone: string, memory: UserMemory): Promise<void> {
    const now = Date.now();
    let newEntry: CacheEntry = { data: [memory], timestamp: now };

    // Load existing from file
    let diskCache: Record<string, CacheEntry> = {};
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      diskCache = JSON.parse(raw);

      const existing = diskCache[phone];
      if (existing && now - existing.timestamp < TTL) {
        newEntry.data = [...existing.data, memory];
      }
    } catch (_) {
      // No file or parsing error
    }

    newEntry.timestamp = now;
    memoryMap.set(phone, newEntry);
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
