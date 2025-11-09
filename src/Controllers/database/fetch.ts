// src/Controllers/fetch.ts
import db from "../../utils/db";

export async function fetchFarmByName(farm_name: string): Promise<any> {
  const { data, error } = await db
    .from("Farm")
    .select("*")
    .eq("farm_name", farm_name)
    .single();
  if (error) {
    console.error("Error fetching farm by name:", error);
    throw new Error("Failed to fetch farm by name");
  }
  return data!;
}

export async function fetchFarmByPhone(phone: number): Promise<any> {
  const { data, error } = await db
    .from("Farmer")
    .select("farm")
    .eq("phone", phone)
    .single();
  if (error) {
    console.error("Error fetching farm by phone:", error);
    throw new Error("Failed to fetch farm by phone");
  }
  return data ? data.farm : null;
}

export async function grabUserInformation(
  phone: string
): Promise<string | null> {
  const farmerRes = await db
    .from("Farmer")
    .select("id, name, phone, state, address, farm")
    .eq("phone", phone)
    .single();
  if (farmerRes.error) {
    if (farmerRes.error.code === "PGRST116") return null;
    console.error("Error fetching farmer by phone:", farmerRes.error);
    throw new Error("Failed to fetch farmer by phone");
  }
  const farmer = farmerRes.data;
  if (!farmer) return null;

  let stateName: string | null = null;
  if (farmer.state != null) {
    const s = await db
      .from("State")
      .select("state_name")
      .eq("id", farmer.state)
      .single();
    if (!s.error && s.data) stateName = s.data.state_name ?? null;
  }

  let farm: any = null;
  if (farmer.farm != null) {
    const fr = await db
      .from("Farm")
      .select("id, farm_name, address, total_size, units, state")
      .eq("id", farmer.farm)
      .single();
    if (!fr.error && fr.data) farm = fr.data;
  }

  let FarmerCrops: any[] = [];
  if (farm?.id) {
    const fc = await db
      .from("Farmer_Crops")
      .select(
        "id, crop, current_yield, unit, expected_harvest_date, last_harvest, farm"
      )
      .eq("farm", farm.id);
    if (!fc.error && fc.data) FarmerCrops = fc.data;
  }

  let cropNamesById: Record<number, string> = {};
  let unitSymbolsById: Record<number, string> = {};
  if (FarmerCrops.length) {
    const cropIds = Array.from(
      new Set(FarmerCrops.map((r) => r.crop).filter(Boolean))
    );
    const unitIds = Array.from(
      new Set(FarmerCrops.map((r) => r.unit).filter(Boolean))
    );

    if (cropIds.length) {
      const cr = await db
        .from("Crops")
        .select("id, crop_name")
        .in("id", cropIds as number[]);
      if (!cr.error && cr.data)
        cr.data.forEach((c) => (cropNamesById[c.id] = c.crop_name));
    }
    if (unitIds.length) {
      const ur = await db
        .from("Units")
        .select("id, unit_symbol")
        .in("id", unitIds as number[]);
      if (!ur.error && ur.data)
        ur.data.forEach((u) => (unitSymbolsById[u.id] = u.unit_symbol));
    }
  }

  const farmLine = farm
    ? `Farm: ${farm.farm_name ?? "Unknown"}; Size: ${farm.total_size ?? "?"}${
        farm.units ? ` (${farm.units})` : ""
      }; Address: ${farm.address ?? ""}`
    : "Farm: Not recorded";

  const cropsLines = FarmerCrops.length
    ? FarmerCrops.map((r) => {
        const crop = cropNamesById[r.crop] ?? `Crop#${r.crop}`;
        const unit = unitSymbolsById[r.unit]
          ? ` ${unitSymbolsById[r.unit]}`
          : "";
        const cy =
          r.current_yield != null ? `${r.current_yield}${unit}` : "unknown";
        const eh = r.expected_harvest_date ?? "unknown";
        const lh = r.last_harvest ?? "unknown";
        return `- ${crop}: current_yield=${cy}; expected_harvest=${eh}; last_harvest=${lh}`;
      }).join("\n")
    : "- No crops recorded";

  return `Farmer Profile
Name: ${farmer.name ?? "Unknown"}
Phone: ${farmer.phone}
State: ${stateName ?? "Unknown"}
Address: ${farmer.address ?? ""}

${farmLine}

Crops & Yields
${cropsLines}`.trim();
}
