import { db } from '../db';
import { gadgetsTable } from '../db/schema';
import { type Gadget } from '../schema';

export const getAllGadgets = async (): Promise<Gadget[]> => {
  try {
    const results = await db.select()
      .from(gadgetsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch gadgets:', error);
    throw error;
  }
};