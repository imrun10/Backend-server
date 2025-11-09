


import db from '../../utils/db'

export async function checkIfExists(table: string, field: string, value: string | number): Promise<number | null> {
  const { data, error } = await db
    .from(table)
    .select('*')
    .eq(field, value)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116 is the code for "No rows found"
    console.error(`Error checking existence in ${table}:`, error);
    throw new Error(`Failed to check existence in ${table}`);
  }

  // return id if exists, else null
  return data ? data.id : null;
}


console.log('Database utility functions loaded.');