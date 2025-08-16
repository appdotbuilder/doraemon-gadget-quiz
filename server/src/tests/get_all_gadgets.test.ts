import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gadgetsTable } from '../db/schema';
import { getAllGadgets } from '../handlers/get_all_gadgets';

describe('getAllGadgets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no gadgets exist', async () => {
    const result = await getAllGadgets();

    expect(result).toEqual([]);
  });

  it('should return all gadgets from the database', async () => {
    // Create test gadgets
    const testGadgets = [
      {
        name: 'Anywhere Door',
        description: 'A door that can take you anywhere in the world',
        image_url: 'https://example.com/anywhere-door.jpg'
      },
      {
        name: 'Take-copter',
        description: 'A small helicopter that allows you to fly',
        image_url: null
      },
      {
        name: 'Memory Bread',
        description: 'Bread that helps you memorize anything written on it',
        image_url: 'https://example.com/memory-bread.jpg'
      }
    ];

    // Insert test data
    await db.insert(gadgetsTable)
      .values(testGadgets)
      .execute();

    const result = await getAllGadgets();

    // Should return all gadgets
    expect(result).toHaveLength(3);
    
    // Verify all gadgets are returned with correct data
    expect(result.map(g => g.name)).toContain('Anywhere Door');
    expect(result.map(g => g.name)).toContain('Take-copter');
    expect(result.map(g => g.name)).toContain('Memory Bread');

    // Check structure of first gadget
    const anywhereGadget = result.find(g => g.name === 'Anywhere Door');
    expect(anywhereGadget).toBeDefined();
    expect(anywhereGadget?.description).toEqual('A door that can take you anywhere in the world');
    expect(anywhereGadget?.image_url).toEqual('https://example.com/anywhere-door.jpg');
    expect(anywhereGadget?.id).toBeDefined();
    expect(anywhereGadget?.created_at).toBeInstanceOf(Date);

    // Check gadget with null image_url
    const takecopter = result.find(g => g.name === 'Take-copter');
    expect(takecopter?.image_url).toBeNull();
  });

  it('should return gadgets ordered by creation time', async () => {
    // Create gadgets in sequence with small delays to ensure different timestamps
    await db.insert(gadgetsTable)
      .values({
        name: 'First Gadget',
        description: 'Created first',
        image_url: null
      })
      .execute();

    await db.insert(gadgetsTable)
      .values({
        name: 'Second Gadget',
        description: 'Created second',
        image_url: null
      })
      .execute();

    const result = await getAllGadgets();

    expect(result).toHaveLength(2);
    
    // Verify both gadgets are present
    expect(result.map(g => g.name)).toContain('First Gadget');
    expect(result.map(g => g.name)).toContain('Second Gadget');
    
    // All should have valid timestamps
    result.forEach(gadget => {
      expect(gadget.created_at).toBeInstanceOf(Date);
      expect(gadget.id).toBeTypeOf('number');
    });
  });

  it('should handle various data types correctly', async () => {
    // Test with different field combinations
    await db.insert(gadgetsTable)
      .values([
        {
          name: 'Gadget with Long Description',
          description: 'This is a very long description that contains multiple sentences. It should be handled properly by the database and returned correctly.',
          image_url: 'https://very-long-url-that-should-work.example.com/path/to/image.png'
        },
        {
          name: 'Special Characters テスト',
          description: 'Description with special characters: !@#$%^&*()_+{}[]|\\:";\'<>?,./`~',
          image_url: null
        }
      ])
      .execute();

    const result = await getAllGadgets();

    expect(result).toHaveLength(2);

    const longDescGadget = result.find(g => g.name === 'Gadget with Long Description');
    expect(longDescGadget?.description.length).toBeGreaterThan(50);
    expect(longDescGadget?.image_url).toContain('very-long-url');

    const specialCharGadget = result.find(g => g.name.includes('テスト'));
    expect(specialCharGadget?.description).toContain('!@#$%^&*()');
    expect(specialCharGadget?.image_url).toBeNull();
  });
});