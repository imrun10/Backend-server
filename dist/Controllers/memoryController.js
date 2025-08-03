"use strict";
// src/Controllers/memoryController.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryController = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const localFilePath = path_1.default.resolve("../../../whatsapp-bot/tmp-local/user-memory.json");
const onlineFilePath = path_1.default.resolve("/tmp/user-memory.json");
const memoryMap = new Map();
const FILE_PATH = path_1.default.resolve(process.env
    .IS_SERVERLESS ? onlineFilePath : localFilePath); // Change this to onlineFilePath in production
const TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
class MemoryController {
    // Short-term memory: load all matching user memories from in-memory Map or /tmp file by name
    static loadShortTermMemory(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            // Load from file if available
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                const cache = JSON.parse(raw);
                const entry = cache[phone];
                if (entry && now - entry.timestamp < TTL) {
                    memoryMap.set(phone, entry); // Rehydrate memory
                    return entry.data;
                }
            }
            catch (_) {
                // File may not exist or parse error
            }
            return null;
        });
    }
    // Short-term memory: append new memory to in-memory Map and /tmp file
    static saveShortTermMemory(phone, memory) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            let newEntry = { data: [memory], timestamp: now };
            // Load existing from file
            let diskCache = {};
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                diskCache = JSON.parse(raw);
                const existing = diskCache[phone];
                if (existing && now - existing.timestamp < TTL) {
                    newEntry.data = [...existing.data, memory];
                }
            }
            catch (_) {
                // No file or parsing error
            }
            newEntry.timestamp = now;
            memoryMap.set(phone, newEntry);
            diskCache[phone] = newEntry;
            yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(diskCache));
        });
    }
    // Short-term memory: clear memory manually (for testing or reset)
    static clearShortTermMemory(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            memoryMap.delete(phone);
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                const cache = JSON.parse(raw);
                delete cache[phone];
                yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(cache));
            }
            catch (_) {
                // Ignore errors
            }
        });
    }
}
exports.MemoryController = MemoryController;
