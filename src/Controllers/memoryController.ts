// src/Controllers/memoryController.ts
import fs from "fs/promises";
import path from "path";
import db from "../utils/db"; // <-- Supabase
import {checkIfExists} from "../Controllers/database/utility";

interface UserMemory {
  name: string;
  language: string;
  lastBody: string;
}
interface CacheEntry { data: UserMemory[]; timestamp: number; longTerm: string | null; onboarding?: OnboardingRecord; }

type OnboardingState = "name" | "state" | "location" | "farmName" | "DONE";

interface OnboardingRecord {
 
  answers: {
    name?: string;
    state?: string;
    location?: string;
    farmName?: string;
    lastQuestionAsked?: OnboardingState;
  };
}


const localFilePath = path.resolve("/Users/imrannasir/Documents/Dev/AG/whatsapp-bot/tmp-local/user-memory.json");
const onlineFilePath = path.resolve("/tmp/user-memory.json");


const memoryMap = new Map<string, CacheEntry>();
const FILE_PATH = path.resolve(process.env.IS_SERVERLESS == 'true' ? onlineFilePath : localFilePath);
const TTL = 5 * 60 * 1000; // 5 min

export class MemoryController {
  // -------- Short-term memory (existing) --------
  public static async loadShortTermMemory(phone: string): Promise<UserMemory[] | null> {
    const now = Date.now();
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      const cache: Record<string, CacheEntry> = JSON.parse(raw);
      const entry = cache[phone];
      if (entry && now - entry.timestamp < TTL) {
        memoryMap.set(phone, entry);
        return entry.data;
      }
    } catch {}
    return null;
  }

  public static async saveShortTermMemory(phone: string, memory: UserMemory): Promise<void> {
    const now = Date.now();
    let newEntry: CacheEntry = { data: [memory], timestamp: now, longTerm: null};
    let diskCache: Record<string, CacheEntry> = {};
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      diskCache = JSON.parse(raw);
      const existing = diskCache[phone];
      
      if (existing && now - existing.timestamp < TTL) {
        newEntry.data = [...existing.data, memory];
        let longTerm = existing.longTerm;
        newEntry.longTerm = longTerm; // preserve existing longTerm
      }
    } catch {}
    newEntry.timestamp = now;
    memoryMap.set(phone, newEntry);
    diskCache[phone] = newEntry;
    await fs.writeFile(FILE_PATH, JSON.stringify(diskCache));
  }

  public static async clearShortTermMemory(phone: string): Promise<void> {
    memoryMap.delete(phone);
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      const cache: Record<string, CacheEntry> = JSON.parse(raw);
      delete cache[phone];
      await fs.writeFile(FILE_PATH, JSON.stringify(cache));
    } catch {}
  }

  // -------- Onboarding state (new) --------
  public static async onboardingNextquestion(phone: string): Promise<string | null> {
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      let cache: Record<string, OnboardingRecord> = {};
      if (!raw){
        // create new entry
        cache[phone] = {answers: {lastQuestionAsked: "name"}};
        await fs.writeFile(FILE_PATH, JSON.stringify(cache));
        return "Sannu, da farko ina bukatar in san ka. Menene sunanka? / Hello, first I need to know you. What is your name?";
      }
      cache = JSON.parse(raw);
      if (!cache[phone]) {
        // create new entry
        cache[phone] = {answers: {lastQuestionAsked: "name"}};
        await fs.writeFile(FILE_PATH, JSON.stringify(cache));
        return "Sannu, da farko ina bukatar in san ka. Menene sunanka? / Hello, first I need to know you. What is your name?";
      }
      // existing entry, find next question
      const record = cache[phone];
      if (!record.answers.name) {
        record.answers.lastQuestionAsked = "name";
        cache[phone] = record;
        await fs.writeFile(FILE_PATH, JSON.stringify(cache));
        return "Sannu, da farko ina bukatar in san ka. Menene sunanka? / Hello, first I need to know you. What is your full name?";
      }
      if (!record.answers.state) {
        record.answers.lastQuestionAsked = "state";
        cache[phone] = record;
        await fs.writeFile(FILE_PATH, JSON.stringify(cache));
        return "Wane jihar kake? / Which state do you work in";
      }
      if (!record.answers.location) {
        record.answers.lastQuestionAsked = "location";
        cache[phone] = record;
        await fs.writeFile(FILE_PATH, JSON.stringify(cache));
        return "Address?";
      }
      if (!record.answers.farmName) {
        record.answers.lastQuestionAsked = "farmName";
        cache[phone] = record;
        await fs.writeFile(FILE_PATH, JSON.stringify(cache));
        return "Menene sunan gonarka? / What is your farm name?";
      }
      return null; // all done
    } catch {
      return null;
    }

  }
  public static async getOnboardingState(phone: string): Promise<string | null> {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const record = cache[phone];
    if (record) {
      console.log('Onboarding record found for phone:', phone, 'last question asked:', record.answers.lastQuestionAsked);
      return record.answers.lastQuestionAsked;
    }
    return null;
  }

  public static async setOnboarding(phone: string, lastQ: string, answer:any): Promise<void> {
    let diskCache: Record<string, OnboardingRecord> = {};
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      diskCache = JSON.parse(raw);
    } catch {}

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
        await MemoryController.saveNewUserProfile({
          phone: phone,
          name: diskCache[phone].answers.name!,
          state_name: diskCache[phone].answers.state!,
          location: diskCache[phone].answers.location!,
          farm_name: diskCache[phone].answers.farmName!
        });
        break;
      default:
        throw new Error("Invalid last question state: " + lastQ);
    }
    

    await fs.writeFile(FILE_PATH, JSON.stringify(diskCache));
  }

  // -------- Long-term memory fetch: full profile string --------
  public static async rememberUser(phone: string): Promise<any | null> {
    // First check if the user is in the cache (exists)
    let diskCache: Record<string, CacheEntry> = {};

    try {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      diskCache = JSON.parse(raw);
      const existing = diskCache[phone];
      if (existing && existing.longTerm) return existing.longTerm;
    } catch {
      console.log("no file");
    }

    // Check if user exists in DB
    const exists = await checkIfExists("Farmer", "phone", phone);
    if (!exists) return null;
    // Lazy import to avoid cycles
    const { grabUserInformation } = await import("../Controllers/database/fetch");

    // write to cache
    if (!diskCache[phone]) diskCache[phone] = { data: [], timestamp: Date.now(), longTerm: null };
    diskCache[phone].longTerm = await grabUserInformation(phone);
    await fs.writeFile(FILE_PATH, JSON.stringify(diskCache));
    return diskCache[phone].longTerm;
  }

  // -------- Persist newly onboarded user (new) --------
  /**
   * Creates (if needed) State, Farm, then Farmer with FK to Farm.
   * Returns created farmer id.
   */
  public static async saveNewUserProfile(params: {
    phone: string;
    name: string;
    state_name: string;
    location: string;    // free text address/location in state
    farm_name: string;
  }): Promise<number> {
    const { phone, name, state_name, location, farm_name } = params;

    // 1) State upsert
    let stateId: number | null = null;
    {
      const found = await db.from("State").select("id").eq("state_name", state_name).single();
      if (!found.error && found.data) {
        stateId = found.data.id;
      } else {
        const ins = await db.from("State").insert({ state_name }).select("id").single();
        if (ins.error) throw new Error(`Failed to create state: ${ins.error.message}`);
        stateId = ins.data.id;
      }
    }

    // 2) Farm create
    const farmIns = await db
      .from("Farm")
      .insert({ farm_name, address: location, state: stateId })
      .select("id")
      .single();
    if (farmIns.error) throw new Error(`Failed to create farm: ${farmIns.error.message}`);
    const farmId = farmIns.data.id;

    // 3) Farmer create
    const farmerIns = await db
      .from("Farmer")
      .insert({ name, phone, state: stateId, address: location, farm: farmId })
      .select("id")
      .single();
    if (farmerIns.error) throw new Error(`Failed to create farmer: ${farmerIns.error.message}`);
    return farmerIns.data.id as number;
  }

  public static async saveOrUpdateUserFacts(
    phone: string,
    facts: {
      language?: string;
      name?: string;
      state_name?: string;
      location?: string;
      farm_name?: string;
      crops?: Array<{
        name: string;
        planted_on?: string;
        expected_harvest_date?: string;
        current_yield?: number;
        yield_unit?: string;
        area?: number;
        area_unit?: string;
      }>;
    }
  ): Promise<void> {
    // 0) Find farmer
    const farmerRes = await db.from("Farmer").select("id, name, phone, state, address, farm").eq("phone", phone).single();
    if (farmerRes.error || !farmerRes.data) {
      console.warn("saveOrUpdateUserFacts: farmer not found for phone", phone);
      return;
    }
    let farmer = farmerRes.data as { id: number; name: string | null; phone: string; state: number | null; address: string | null; farm: number | null };

    // 1) Resolve / upsert state if provided
    let stateId: number | null = farmer.state ?? null;
    if (facts.state_name) {
      const found = await db.from("State").select("id").eq("state_name", facts.state_name).single();
      if (!found.error && found.data) {
        stateId = found.data.id;
      } else {
        const ins = await db.from("State").insert({ state_name: facts.state_name }).select("id").single();
        if (!ins.error && ins.data) stateId = ins.data.id;
      }
    }

    // 2) Ensure farm (new or existing)
    let farmId: number | null = farmer.farm ?? null;
    if (facts.farm_name) {
      // try find by name owned by this farmer (or global by name)
      const existingFarm = await db.from("Farm").select("id").eq("farm_name", facts.farm_name).single();
      if (!existingFarm.error && existingFarm.data) {
        farmId = existingFarm.data.id;
      } else {
        const farmIns = await db.from("Farm").insert({ farm_name: facts.farm_name, address: facts.location ?? farmer.address ?? null, state: stateId }).select("id").single();
        if (!farmIns.error && farmIns.data) farmId = farmIns.data.id;
      }
    }

    // 3) Update farmer basic fields if any changed
    if (facts.name || facts.location || (facts.state_name && stateId !== farmer.state) || (facts.farm_name && farmId !== farmer.farm)) {
      const upd = await db.from("Farmer").update({
        name: facts.name ?? farmer.name,
        address: facts.location ?? farmer.address,
        state: stateId ?? farmer.state,
        farm: farmId ?? farmer.farm
      }).eq("id", farmer.id);
      if (upd.error) console.warn("Failed to update Farmer:", upd.error);
    }

    // 4) Upsert crops to Farmers_Crops
    if (farmId && facts.crops?.length) {
      // helper: ensure crop id
      const ensureCropId = async (cropName: string): Promise<number | null> => {
        const lower = cropName.trim().toLowerCase();
        const found = await db.from("Crops").select("id").eq("crop_name", lower).single();
        if (!found.error && found.data) return found.data.id;
        const ins = await db.from("Crops").insert({ crop_name: lower }).select("id").single();
        if (!ins.error && ins.data) return ins.data.id;
        return null;
      };

      // helper: ensure unit id (by symbol or name)
      const ensureUnitId = async (symbolOrName?: string): Promise<number | null> => {
        if (!symbolOrName) return null;
        const key = symbolOrName.trim();
        // try symbol first
        let q = await db.from("Units").select("id").eq("unit_symbol", key).single();
        if (!q.error && q.data) return q.data.id;
        // then by name
        q = await db.from("Units").select("id").eq("unit_name", key).single();
        if (!q.error && q.data) return q.data.id;
        // else create as name
        const ins = await db.from("Units").insert({ unit_name: key, unit_symbol: key }).select("id").single();
        if (!ins.error && ins.data) return ins.data.id;
        return null;
      };

      for (const c of facts.crops) {
        const cropId = await ensureCropId(c.name);
        if (!cropId) continue;

        const yieldUnitId = await ensureUnitId(c.yield_unit);
        const areaUnitId = await ensureUnitId(c.area_unit); // note: you may later store area in Farm or Plot; here we keep it for future use

        // Is there an existing Farmers_Crops row for (farmId, cropId)?
        const existing = await db
          .from("Farmers_Crops")
          .select("id, current_yield, unit, expected_harvest_date, farm, crop, last_harvest")
          .eq("farm", farmId)
          .eq("crop", cropId)
          .maybeSingle();

        const payload: any = {
          farm: farmId,
          crop: cropId,
        };
        if (typeof c.current_yield === "number") payload.current_yield = c.current_yield;
        if (yieldUnitId) payload.unit = yieldUnitId;
        if (c.expected_harvest_date) payload.expected_harvest_date = c.expected_harvest_date;
        // planted_on and area are ignored here unless you add columns; keep for future schema

        if (existing.data) {
          // update
          const upd = await db.from("Farmers_Crops").update(payload).eq("id", existing.data.id);
          if (upd.error) console.warn("Failed to update Farmers_Crops:", upd.error);
        } else {
          // insert
          const ins = await db.from("Farmers_Crops").insert(payload);
          if (ins.error) console.warn("Failed to insert Farmers_Crops:", ins.error);
        }
      }
    }
  }
}
