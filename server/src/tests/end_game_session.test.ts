import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type EndGameSessionInput } from '../schema';
import { endGameSession } from '../handlers/end_game_session';
import { eq } from 'drizzle-orm';

describe('endGameSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should end an active game session', async () => {
    // Create a test game session
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Test Player',
        total_score: 150,
        questions_answered: 5,
        correct_answers: 3,
        started_at: new Date('2024-01-01T10:00:00Z'),
        ended_at: null // Session is active
      })
      .returning()
      .execute();

    const testInput: EndGameSessionInput = {
      session_id: sessionResult[0].id
    };

    const beforeEndTime = new Date();
    const result = await endGameSession(testInput);
    const afterEndTime = new Date();

    // Verify the returned session data
    expect(result.id).toEqual(sessionResult[0].id);
    expect(result.player_name).toEqual('Test Player');
    expect(result.total_score).toEqual(150);
    expect(result.questions_answered).toEqual(5);
    expect(result.correct_answers).toEqual(3);
    expect(result.started_at).toEqual(sessionResult[0].started_at);
    expect(result.ended_at).toBeInstanceOf(Date);
    expect(result.ended_at).not.toBeNull();

    // Verify ended_at is set to current time (within reasonable range)
    expect(result.ended_at!.getTime()).toBeGreaterThanOrEqual(beforeEndTime.getTime());
    expect(result.ended_at!.getTime()).toBeLessThanOrEqual(afterEndTime.getTime());
  });

  it('should save ended session to database', async () => {
    // Create a test game session
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Database Test Player',
        total_score: 200,
        questions_answered: 8,
        correct_answers: 6,
        ended_at: null
      })
      .returning()
      .execute();

    const testInput: EndGameSessionInput = {
      session_id: sessionResult[0].id
    };

    await endGameSession(testInput);

    // Query the database to verify the session was updated
    const sessions = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, sessionResult[0].id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].player_name).toEqual('Database Test Player');
    expect(sessions[0].total_score).toEqual(200);
    expect(sessions[0].questions_answered).toEqual(8);
    expect(sessions[0].correct_answers).toEqual(6);
    expect(sessions[0].ended_at).toBeInstanceOf(Date);
    expect(sessions[0].ended_at).not.toBeNull();
  });

  it('should handle ending an already ended session', async () => {
    // Create a game session that's already ended
    const originalEndTime = new Date('2024-01-01T12:00:00Z');
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Already Ended Player',
        total_score: 100,
        questions_answered: 4,
        correct_answers: 2,
        ended_at: originalEndTime
      })
      .returning()
      .execute();

    const testInput: EndGameSessionInput = {
      session_id: sessionResult[0].id
    };

    const result = await endGameSession(testInput);

    // The ended_at should be updated to current time, not keep the original
    expect(result.ended_at).toBeInstanceOf(Date);
    expect(result.ended_at).not.toEqual(originalEndTime);
    expect(result.ended_at!.getTime()).toBeGreaterThan(originalEndTime.getTime());
  });

  it('should throw error for non-existent session', async () => {
    const testInput: EndGameSessionInput = {
      session_id: 99999 // Non-existent session ID
    };

    expect(endGameSession(testInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve all session data when ending', async () => {
    // Create a session with varied data to ensure all fields are preserved
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Data Preservation Test',
        total_score: 350,
        questions_answered: 12,
        correct_answers: 9,
        started_at: new Date('2024-01-15T08:30:00Z')
      })
      .returning()
      .execute();

    const testInput: EndGameSessionInput = {
      session_id: sessionResult[0].id
    };

    const result = await endGameSession(testInput);

    // Verify all original data is preserved
    expect(result.player_name).toEqual('Data Preservation Test');
    expect(result.total_score).toEqual(350);
    expect(result.questions_answered).toEqual(12);
    expect(result.correct_answers).toEqual(9);
    expect(result.started_at).toEqual(new Date('2024-01-15T08:30:00Z'));
    
    // Only ended_at should be newly set
    expect(result.ended_at).toBeInstanceOf(Date);
    expect(result.ended_at!.getTime()).toBeGreaterThan(new Date('2024-01-15T08:30:00Z').getTime());
  });
});