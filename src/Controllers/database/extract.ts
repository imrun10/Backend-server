


import db from '../../utils/db';
import { schema } from '../../.schema';
import { fetchFarmByPhone } from './fetch';
import { checkIfExists } from './utility';

type extractProductUse = {
    name: string; // e.g., "Urea"
    last_use: string; // e.g., "2023-10-01"
    phone: number; // Farmer's phone number to link the product use
};  

export async function extractProdutUse(productUse: extractProductUse): Promise<any> {

        // First get the farm based on the farmer's phone number
        const farmId = await fetchFarmByPhone(productUse.phone);
        if (!farmId) {
            throw new Error('No farm found for the given phone number');
        }
        // Check if the product exists
        const productId = await checkIfExists('products', 'name', productUse.name);
       
        

}