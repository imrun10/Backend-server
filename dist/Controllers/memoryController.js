"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// src/Controllers/memoryController.ts
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("../utils/db")); // <-- Supabase
const utility_1 = require("../Controllers/database/utility");
const localFilePath = path_1.default.resolve("/Users/imrannasir/Documents/Dev/AG/whatsapp-bot/tmp-local/user-memory.json");
const onlineFilePath = path_1.default.resolve("/tmp/user-memory.json");
const memoryMap = new Map();
const FILE_PATH = path_1.default.resolve(process.env.IS_SERVERLESS == 'true' ? onlineFilePath : localFilePath);
const TTL = 5 * 60 * 1000; // 5 min
class MemoryController {
    // -------- Short-term memory (existing) --------
    static loadShortTermMemory(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                const cache = JSON.parse(raw);
                const entry = cache[phone];
                if (entry && now - entry.timestamp < TTL) {
                    memoryMap.set(phone, entry);
                    return entry.data;
                }
            }
            catch (_a) { }
            return null;
        });
    }
    static saveShortTermMemory(phone, memory) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            let newEntry = { data: [memory], timestamp: now, longTerm: null };
            let diskCache = {};
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                diskCache = JSON.parse(raw);
                const existing = diskCache[phone];
                if (existing && now - existing.timestamp < TTL) {
                    newEntry.data = [...existing.data, memory];
                    let longTerm = existing.longTerm;
                    newEntry.longTerm = longTerm; // preserve existing longTerm
                }
            }
            catch (_a) { }
            newEntry.timestamp = now;
            memoryMap.set(phone, newEntry);
            diskCache[phone] = newEntry;
            yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(diskCache));
        });
    }
    static clearShortTermMemory(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            memoryMap.delete(phone);
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                const cache = JSON.parse(raw);
                delete cache[phone];
                yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(cache));
            }
            catch (_a) { }
        });
    }
    // -------- Onboarding state (new) --------
    static onboardingNextquestion(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                let cache = {};
                if (!raw) {
                    // create new entry
                    cache[phone] = { answers: { lastQuestionAsked: "name" } };
                    yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(cache));
                    return "Sannu, da farko ina bukatar in san ka. Menene sunanka? / Hello, first I need to know you. What is your name?";
                }
                cache = JSON.parse(raw);
                if (!cache[phone]) {
                    // create new entry
                    cache[phone] = { answers: { lastQuestionAsked: "name" } };
                    yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(cache));
                    return "Sannu, da farko ina bukatar in san ka. Menene sunanka? / Hello, first I need to know you. What is your name?";
                }
                // existing entry, find next question
                const record = cache[phone];
                if (!record.answers.name) {
                    record.answers.lastQuestionAsked = "name";
                    cache[phone] = record;
                    yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(cache));
                    return "Sannu, da farko ina bukatar in san ka. Menene sunanka? / Hello, first I need to know you. What is your full name?";
                }
                if (!record.answers.state) {
                    record.answers.lastQuestionAsked = "state";
                    cache[phone] = record;
                    yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(cache));
                    return "Wane jihar kake? / Which state do you work in";
                }
                if (!record.answers.location) {
                    record.answers.lastQuestionAsked = "location";
                    cache[phone] = record;
                    yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(cache));
                    return "Address?";
                }
                if (!record.answers.farmName) {
                    record.answers.lastQuestionAsked = "farmName";
                    cache[phone] = record;
                    yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(cache));
                    return "Menene sunan gonarka? / What is your farm name?";
                }
                return null; // all done
            }
            catch (_a) {
                return null;
            }
        });
    }
    static getOnboardingState(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
            if (!raw)
                return null;
            const cache = JSON.parse(raw);
            const record = cache[phone];
            if (record) {
                console.log('Onboarding record found for phone:', phone, 'last question asked:', record.answers.lastQuestionAsked);
                return record.answers.lastQuestionAsked;
            }
            return null;
        });
    }
    static setOnboarding(phone, lastQ, answer) {
        return __awaiter(this, void 0, void 0, function* () {
            let diskCache = {};
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                diskCache = JSON.parse(raw);
            }
            catch (_a) { }
            // Update the onboarding record
            if (!diskCache[phone]) {
                // the entry has to already be here snce lastq is provided so something must be wrong call onboardingNextquestion first
                throw new Error("Onboarding record not found for phone: " + phone);
            }
            switch (lastQ) {
                case "name":
                    diskCache[phone].answers.name = answer;
                    break;
                case "state":
                    diskCache[phone].answers.state = answer;
                    break;
                case "location":
                    diskCache[phone].answers.location = answer;
                    break;
                case "farmName":
                    diskCache[phone].answers.farmName = answer;
                    diskCache[phone].answers.lastQuestionAsked = "DONE";
                    // complete so update the db
                    yield MemoryController.saveNewUserProfile({
                        phone: phone,
                        name: diskCache[phone].answers.name,
                        state_name: diskCache[phone].answers.state,
                        location: diskCache[phone].answers.location,
                        farm_name: diskCache[phone].answers.farmName
                    });
                    break;
                default:
                    throw new Error("Invalid last question state: " + lastQ);
            }
            yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(diskCache));
        });
    }
    // -------- Long-term memory fetch: full profile string --------
    static rememberUser(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            // First check if the user is in the cache (exists)
            let diskCache = {};
            try {
                const raw = yield promises_1.default.readFile(FILE_PATH, "utf8");
                diskCache = JSON.parse(raw);
                const existing = diskCache[phone];
                if (existing && existing.longTerm)
                    return existing.longTerm;
            }
            catch (_a) {
                console.log("no file");
            }
            // Check if user exists in DB
            const exists = yield (0, utility_1.checkIfExists)("Farmer", "phone", phone);
            if (!exists)
                return null;
            // Lazy import to avoid cycles
            const { grabUserInformation } = yield Promise.resolve().then(() => __importStar(require("../Controllers/database/fetch")));
            // write to cache
            if (!diskCache[phone])
                diskCache[phone] = { data: [], timestamp: Date.now(), longTerm: null };
            diskCache[phone].longTerm = yield grabUserInformation(phone);
            yield promises_1.default.writeFile(FILE_PATH, JSON.stringify(diskCache));
            return diskCache[phone].longTerm;
        });
    }
    // -------- Persist newly onboarded user (new) --------
    /**
     * Creates (if needed) State, Farm, then Farmer with FK to Farm.
     * Returns created farmer id.
     */
    static saveNewUserProfile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phone, name, state_name, location, farm_name } = params;
            // 1) State upsert
            let stateId = null;
            {
                const found = yield db_1.default.from("State").select("id").eq("state_name", state_name).single();
                if (!found.error && found.data) {
                    stateId = found.data.id;
                }
                else {
                    const ins = yield db_1.default.from("State").insert({ state_name }).select("id").single();
                    if (ins.error)
                        throw new Error(`Failed to create state: ${ins.error.message}`);
                    stateId = ins.data.id;
                }
            }
            // 2) Farm create
            const farmIns = yield db_1.default
                .from("Farm")
                .insert({ farm_name, address: location, state: stateId })
                .select("id")
                .single();
            if (farmIns.error)
                throw new Error(`Failed to create farm: ${farmIns.error.message}`);
            const farmId = farmIns.data.id;
            // 3) Farmer create
            const farmerIns = yield db_1.default
                .from("Farmer")
                .insert({ name, phone, state: stateId, address: location, farm: farmId })
                .select("id")
                .single();
            if (farmerIns.error)
                throw new Error(`Failed to create farmer: ${farmerIns.error.message}`);
            return farmerIns.data.id;
        });
    }
    static saveOrUpdateUserFacts(phone, facts) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            // 0) Find farmer
            const farmerRes = yield db_1.default.from("Farmer").select("id, name, phone, state, address, farm").eq("phone", phone).single();
            if (farmerRes.error || !farmerRes.data) {
                console.warn("saveOrUpdateUserFacts: farmer not found for phone", phone);
                return;
            }
            let farmer = farmerRes.data;
            // 1) Resolve / upsert state if provided
            let stateId = (_a = farmer.state) !== null && _a !== void 0 ? _a : null;
            if (facts.state_name) {
                const found = yield db_1.default.from("State").select("id").eq("state_name", facts.state_name).single();
                if (!found.error && found.data) {
                    stateId = found.data.id;
                }
                else {
                    const ins = yield db_1.default.from("State").insert({ state_name: facts.state_name }).select("id").single();
                    if (!ins.error && ins.data)
                        stateId = ins.data.id;
                }
            }
            // 2) Ensure farm (new or existing)
            let farmId = (_b = farmer.farm) !== null && _b !== void 0 ? _b : null;
            if (facts.farm_name) {
                // try find by name owned by this farmer (or global by name)
                const existingFarm = yield db_1.default.from("Farm").select("id").eq("farm_name", facts.farm_name).single();
                if (!existingFarm.error && existingFarm.data) {
                    farmId = existingFarm.data.id;
                }
                else {
                    const farmIns = yield db_1.default.from("Farm").insert({ farm_name: facts.farm_name, address: (_d = (_c = facts.location) !== null && _c !== void 0 ? _c : farmer.address) !== null && _d !== void 0 ? _d : null, state: stateId }).select("id").single();
                    if (!farmIns.error && farmIns.data)
                        farmId = farmIns.data.id;
                }
            }
            // 3) Update farmer basic fields if any changed
            if (facts.name || facts.location || (facts.state_name && stateId !== farmer.state) || (facts.farm_name && farmId !== farmer.farm)) {
                const upd = yield db_1.default.from("Farmer").update({
                    name: (_e = facts.name) !== null && _e !== void 0 ? _e : farmer.name,
                    address: (_f = facts.location) !== null && _f !== void 0 ? _f : farmer.address,
                    state: stateId !== null && stateId !== void 0 ? stateId : farmer.state,
                    farm: farmId !== null && farmId !== void 0 ? farmId : farmer.farm
                }).eq("id", farmer.id);
                if (upd.error)
                    console.warn("Failed to update Farmer:", upd.error);
            }
            // 4) Upsert crops to Farmers_Crops
            if (farmId && ((_g = facts.crops) === null || _g === void 0 ? void 0 : _g.length)) {
                // helper: ensure crop id
                const ensureCropId = (cropName) => __awaiter(this, void 0, void 0, function* () {
                    const lower = cropName.trim().toLowerCase();
                    const found = yield db_1.default.from("Crops").select("id").eq("crop_name", lower).single();
                    if (!found.error && found.data)
                        return found.data.id;
                    const ins = yield db_1.default.from("Crops").insert({ crop_name: lower }).select("id").single();
                    if (!ins.error && ins.data)
                        return ins.data.id;
                    return null;
                });
                // helper: ensure unit id (by symbol or name)
                const ensureUnitId = (symbolOrName) => __awaiter(this, void 0, void 0, function* () {
                    if (!symbolOrName)
                        return null;
                    const key = symbolOrName.trim();
                    // try symbol first
                    let q = yield db_1.default.from("Units").select("id").eq("unit_symbol", key).single();
                    if (!q.error && q.data)
                        return q.data.id;
                    // then by name
                    q = yield db_1.default.from("Units").select("id").eq("unit_name", key).single();
                    if (!q.error && q.data)
                        return q.data.id;
                    // else create as name
                    const ins = yield db_1.default.from("Units").insert({ unit_name: key, unit_symbol: key }).select("id").single();
                    if (!ins.error && ins.data)
                        return ins.data.id;
                    return null;
                });
                for (const c of facts.crops) {
                    const cropId = yield ensureCropId(c.name);
                    if (!cropId)
                        continue;
                    const yieldUnitId = yield ensureUnitId(c.yield_unit);
                    const areaUnitId = yield ensureUnitId(c.area_unit); // note: you may later store area in Farm or Plot; here we keep it for future use
                    // Is there an existing Farmers_Crops row for (farmId, cropId)?
                    const existing = yield db_1.default
                        .from("Farmers_Crops")
                        .select("id, current_yield, unit, expected_harvest_date, farm, crop, last_harvest")
                        .eq("farm", farmId)
                        .eq("crop", cropId)
                        .maybeSingle();
                    const payload = {
                        farm: farmId,
                        crop: cropId,
                    };
                    if (typeof c.current_yield === "number")
                        payload.current_yield = c.current_yield;
                    if (yieldUnitId)
                        payload.unit = yieldUnitId;
                    if (c.expected_harvest_date)
                        payload.expected_harvest_date = c.expected_harvest_date;
                    // planted_on and area are ignored here unless you add columns; keep for future schema
                    if (existing.data) {
                        // update
                        const upd = yield db_1.default.from("Farmers_Crops").update(payload).eq("id", existing.data.id);
                        if (upd.error)
                            console.warn("Failed to update Farmers_Crops:", upd.error);
                    }
                    else {
                        // insert
                        const ins = yield db_1.default.from("Farmers_Crops").insert(payload);
                        if (ins.error)
                            console.warn("Failed to insert Farmers_Crops:", ins.error);
                    }
                }
            }
        });
    }
}
exports.MemoryController = MemoryController;
