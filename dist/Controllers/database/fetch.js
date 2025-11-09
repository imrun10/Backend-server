"use strict";
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
exports.fetchFarmByName = fetchFarmByName;
exports.grabUserInformation = grabUserInformation;
// src/Controllers/fetch.ts
const db_1 = __importDefault(require("../../utils/db"));
function fetchFarmByName(farm_name) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, error } = yield db_1.default.from('Farm').select('*').eq('farm_name', farm_name).single();
        if (error) {
            console.error('Error fetching farm by name:', error);
            throw new Error('Failed to fetch farm by name');
        }
        return data;
    });
}
function grabUserInformation(phone) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const farmerRes = yield db_1.default
            .from('Farmer')
            .select('id, name, phone, state, address, farm')
            .eq('phone', phone)
            .single();
        if (farmerRes.error) {
            if (farmerRes.error.code === 'PGRST116')
                return null;
            console.error('Error fetching farmer by phone:', farmerRes.error);
            throw new Error('Failed to fetch farmer by phone');
        }
        const farmer = farmerRes.data;
        if (!farmer)
            return null;
        let stateName = null;
        if (farmer.state != null) {
            const s = yield db_1.default.from('State').select('state_name').eq('id', farmer.state).single();
            if (!s.error && s.data)
                stateName = (_a = s.data.state_name) !== null && _a !== void 0 ? _a : null;
        }
        let farm = null;
        if (farmer.farm != null) {
            const fr = yield db_1.default.from('Farm').select('id, farm_name, address, total_size, units, state').eq('id', farmer.farm).single();
            if (!fr.error && fr.data)
                farm = fr.data;
        }
        let FarmerCrops = [];
        if (farm === null || farm === void 0 ? void 0 : farm.id) {
            const fc = yield db_1.default
                .from('Farmer_Crops')
                .select('id, crop, current_yield, unit, expected_harvest_date, last_harvest, farm')
                .eq('farm', farm.id);
            if (!fc.error && fc.data)
                FarmerCrops = fc.data;
        }
        let cropNamesById = {};
        let unitSymbolsById = {};
        if (FarmerCrops.length) {
            const cropIds = Array.from(new Set(FarmerCrops.map(r => r.crop).filter(Boolean)));
            const unitIds = Array.from(new Set(FarmerCrops.map(r => r.unit).filter(Boolean)));
            if (cropIds.length) {
                const cr = yield db_1.default.from('Crops').select('id, crop_name').in('id', cropIds);
                if (!cr.error && cr.data)
                    cr.data.forEach(c => (cropNamesById[c.id] = c.crop_name));
            }
            if (unitIds.length) {
                const ur = yield db_1.default.from('Units').select('id, unit_symbol').in('id', unitIds);
                if (!ur.error && ur.data)
                    ur.data.forEach(u => (unitSymbolsById[u.id] = u.unit_symbol));
            }
        }
        const farmLine = farm
            ? `Farm: ${(_b = farm.farm_name) !== null && _b !== void 0 ? _b : 'Unknown'}; Size: ${(_c = farm.total_size) !== null && _c !== void 0 ? _c : '?'}${farm.units ? ` (${farm.units})` : ''}; Address: ${(_d = farm.address) !== null && _d !== void 0 ? _d : ''}`
            : 'Farm: Not recorded';
        const cropsLines = FarmerCrops.length
            ? FarmerCrops.map(r => {
                var _a, _b, _c;
                const crop = (_a = cropNamesById[r.crop]) !== null && _a !== void 0 ? _a : `Crop#${r.crop}`;
                const unit = unitSymbolsById[r.unit] ? ` ${unitSymbolsById[r.unit]}` : '';
                const cy = r.current_yield != null ? `${r.current_yield}${unit}` : 'unknown';
                const eh = (_b = r.expected_harvest_date) !== null && _b !== void 0 ? _b : 'unknown';
                const lh = (_c = r.last_harvest) !== null && _c !== void 0 ? _c : 'unknown';
                return `- ${crop}: current_yield=${cy}; expected_harvest=${eh}; last_harvest=${lh}`;
            }).join('\n')
            : '- No crops recorded';
        return (`Farmer Profile
Name: ${(_e = farmer.name) !== null && _e !== void 0 ? _e : 'Unknown'}
Phone: ${farmer.phone}
State: ${stateName !== null && stateName !== void 0 ? stateName : 'Unknown'}
Address: ${(_f = farmer.address) !== null && _f !== void 0 ? _f : ''}

${farmLine}

Crops & Yields
${cropsLines}`).trim();
    });
}
