
import db from '../../utils/db';
import { NewUser, NewFarm, NewCrops} from '../../Model/interfaces';

export default async function saveNewUserMemory(newUser: NewUser): Promise<any> {
  // First validate i the user exist with the phone number
  const { data: existingUser, error: fetchError } = await db
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
    const { data, error } = await db
    .from('Farmers')
    .insert([newUser]);
    if (error) {
      console.error('Error saving new user:', error);
      throw new Error('Failed to save new user');
    }
    console.log('New user saved successfully:', data);
    return data!;
}

export async function saveNewFarm(newFarm: NewFarm): Promise<any> {
  // First validate if the farm already exist with the farm name
  const { data: existingFarm, error: fetchError } = await db
    .from('Farm')
    .select('*')
    .eq('farm_name', newFarm.farm_name)
    .single();  
    if (fetchError) {
      console.error('Error fetching existing farm:', fetchError);
      throw new Error('Failed to fetch existing farm');
    }

  // then save the new user with all their information and return the id
    const { data, error } = await db
    .from('Farm')
    .insert([newFarm]);
    if (error) {
      console.error('Error saving new farm:', error);
      throw new Error('Failed to save new farm');
    }
    console.log('New farm saved successfully:', data);
    return data!;
}


/*
export async function saveProduct(product: ProductProp): Promise<any> {
  const { data, error } = await db
    .from('Product_Use')
    .insert([product]);
  if (error) {
    console.error('Error saving product use:', error);
    throw new Error('Failed to save product use');
  }
  console.log('Product use saved successfully:', data);
  return data!;
}
*/