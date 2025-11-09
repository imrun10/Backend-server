
import db from '../../utils/db';
import { NewUser, NewFarm, NewCrops} from '../../Model/interfaces';

export async function updateFarmer(field: string, value: string, phone: number): Promise<void> {

    if (field === 'phone') {
        throw new Error('Cannot update phone number');
    }
    // Update the farmer's information
    const { data, error } = await db
        .from('Farmers')
        .update({ [field]: value })
        .eq('phone', phone);
    if (error) {
        console.error('Error updating farmer:', error);
        throw new Error('Failed to update farmer');
    }
    console.log('Farmer updated successfully:', data);
}