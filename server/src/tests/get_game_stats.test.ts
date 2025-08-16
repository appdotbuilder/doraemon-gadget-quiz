import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { getGameStats } from '../handlers/get_game_stats';

describe('getGameStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return game stats for existing session', async () => {
    // Create a test game session
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Test Player',
        total_score: 150,
        questions_answered: 10,
        correct_answers: 7
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Get game stats
    const stats = await getGameStats(sessionId);

    expect(stats.total_score).toEqual(150);
    expect(stats.questions_answered).toEqual(10);
    expect(stats.correct_answers).toEqual(7);
    expect(stats.accuracy_percentage).toEqual(70); // 7/10 * 100 = 70%
  });

  it('should calculate accuracy percentage correctly for perfect score', async () => {
    // Create session with perfect score
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Perfect Player',
        total_score: 200,
        questions_answered: 8,
        correct_answers: 8
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const stats = await getGameStats(sessionId);

    expect(stats.accuracy_percentage).toEqual(100);
  });

  it('should calculate accuracy percentage correctly for zero correct answers', async () => {
    // Create session with no correct answers
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Unlucky Player',
        total_score: 0,
        questions_answered: 5,
        correct_answers: 0
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const stats = await getGameStats(sessionId);

    expect(stats.accuracy_percentage).toEqual(0);
  });

  it('should handle zero questions answered correctly', async () => {
    // Create session with no questions answered yet
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'New Player',
        total_score: 0,
        questions_answered: 0,
        correct_answers: 0
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const stats = await getGameStats(sessionId);

    expect(stats.total_score).toEqual(0);
    expect(stats.questions_answered).toEqual(0);
    expect(stats.correct_answers).toEqual(0);
    expect(stats.accuracy_percentage).toEqual(0); // Should handle division by zero
  });

  it('should round accuracy percentage to 2 decimal places', async () => {
    // Create session that will result in repeating decimal
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Decimal Player',
        total_score: 100,
        questions_answered: 3,
        correct_answers: 2
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const stats = await getGameStats(sessionId);

    expect(stats.accuracy_percentage).toEqual(66.67); // 2/3 * 100 = 66.666... rounded to 66.67
  });

  it('should throw error for non-existent session', async () => {
    const nonExistentId = 99999;

    await expect(getGameStats(nonExistentId))
      .rejects.toThrow(/Game session with ID 99999 not found/i);
  });

  it('should return stats with correct data types', async () => {
    // Create test session
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Type Test Player',
        total_score: 85,
        questions_answered: 6,
        correct_answers: 4
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const stats = await getGameStats(sessionId);

    // Verify all fields are numbers
    expect(typeof stats.total_score).toBe('number');
    expect(typeof stats.questions_answered).toBe('number');
    expect(typeof stats.correct_answers).toBe('number');
    expect(typeof stats.accuracy_percentage).toBe('number');

    // Verify integer fields are integers
    expect(Number.isInteger(stats.total_score)).toBe(true);
    expect(Number.isInteger(stats.questions_answered)).toBe(true);
    expect(Number.isInteger(stats.correct_answers)).toBe(true);
  });

  it('should handle session with default values correctly', async () => {
    // Create session using database defaults
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Default Player'
        // total_score, questions_answered, correct_answers will use defaults (0)
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const stats = await getGameStats(sessionId);

    expect(stats.total_score).toEqual(0);
    expect(stats.questions_answered).toEqual(0);
    expect(stats.correct_answers).toEqual(0);
    expect(stats.accuracy_percentage).toEqual(0);
  });
});