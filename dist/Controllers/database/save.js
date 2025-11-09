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
exports.default = saveNewUserMemory;
exports.updateFarmer = updateFarmer;
exports.saveNewFarm = saveNewFarm;
const db_1 = __importDefault(require("../../utils/db"));
function saveNewUserMemory(newUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // First validate i the user exist with the phone number
        const { data: existingUser, error: fetchError } = yield db_1.default
            .from('Farmers')
            .select('*')
            .eq('phone', newUser.phone)
            .single();
        if (fetchError) {
            console.error('Error fetching existing user:', fetchError);
            throw new Error('Failed to fetch existing user');
        }
        if (existingUser) {
            console.log('User already exists:', existingUser);
            return; // User already exists, no need to save
        }
        // then save the new user with all their information
        const { data, error } = yield db_1.default
            .from('Farmers')
            .insert([newUser]);
        if (error) {
            console.error('Error saving new user:', error);
            throw new Error('Failed to save new user');
        }
        console.log('New user saved successfully:', data);
        return data;
    });
}
function updateFarmer(field, value, phone) {
    return __awaiter(this, void 0, void 0, function* () {
        if (field === 'phone') {
            throw new Error('Cannot update phone number');
        }
        // Update the farmer's information
        const { data, error } = yield db_1.default
            .from('Farmers')
            .update({ [field]: value })
            .eq('phone', phone);
        if (error) {
            console.error('Error updating farmer:', error);
            throw new Error('Failed to update farmer');
        }
        console.log('Farmer updated successfully:', data);
    });
}
function saveNewFarm(newFarm) {
    return __awaiter(this, void 0, void 0, function* () {
        // First validate if the farm already exist with the farm name
        const { data: existingFarm, error: fetchError } = yield db_1.default
            .from('Farm')
            .select('*')
            .eq('farm_name', newFarm.farm_name)
            .single();
        if (fetchError) {
            console.error('Error fetching existing farm:', fetchError);
            throw new Error('Failed to fetch existing farm');
        }
        // then save the new user with all their information and return the id
        const { data, error } = yield db_1.default
            .from('Farm')
            .insert([newFarm]);
        if (error) {
            console.error('Error saving new farm:', error);
            throw new Error('Failed to save new farm');
        }
        console.log('New farm saved successfully:', data);
        return data;
    });
}
