import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type CreateGameSessionInput } from '../schema';
import { createGameSession } from '../handlers/create_game_session';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateGameSessionInput = {
  player_name: 'TestPlayer123'
};

describe('createGameSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a game session with correct default values', async () => {
    const result = await createGameSession(testInput);

    // Verify all fields are set correctly
    expect(result.player_name).toEqual('TestPlayer123');
    expect(result.total_score).toEqual(0);
    expect(result.questions_answered).toEqual(0);
    expect(result.correct_answers).toEqual(0);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull();
  });

  it('should save game session to database', async () => {
    const result = await createGameSession(testInput);

    // Query database to verify the session was saved
    const sessions = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    const savedSession = sessions[0];
    
    expect(savedSession.player_name).toEqual('TestPlayer123');
    expect(savedSession.total_score).toEqual(0);
    expect(savedSession.questions_answered).toEqual(0);
    expect(savedSession.correct_answers).toEqual(0);
    expect(savedSession.started_at).toBeInstanceOf(Date);
    expect(savedSession.ended_at).toBeNull();
  });

  it('should create multiple unique game sessions', async () => {
    const input1: CreateGameSessionInput = { player_name: 'Player1' };
    const input2: CreateGameSessionInput = { player_name: 'Player2' };

    const session1 = await createGameSession(input1);
    const session2 = await createGameSession(input2);

    // Verify unique IDs and different player names
    expect(session1.id).not.toEqual(session2.id);
    expect(session1.player_name).toEqual('Player1');
    expect(session2.player_name).toEqual('Player2');

    // Verify both have correct default values
    expect(session1.total_score).toEqual(0);
    expect(session2.total_score).toEqual(0);
    expect(session1.questions_answered).toEqual(0);
    expect(session2.questions_answered).toEqual(0);
  });

  it('should handle player names with special characters', async () => {
    const specialInput: CreateGameSessionInput = {
      player_name: 'Player-With_Special@Characters!123'
    };

    const result = await createGameSession(specialInput);

    expect(result.player_name).toEqual('Player-With_Special@Characters!123');
    expect(result.id).toBeDefined();
    expect(result.started_at).toBeInstanceOf(Date);
  });

  it('should set started_at to current time', async () => {
    const beforeCreation = new Date();
    const result = await createGameSession(testInput);
    const afterCreation = new Date();

    // Verify started_at is within reasonable time range
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.started_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000); // Allow 1 second buffer
    expect(result.started_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000); // Allow 1 second buffer
  });

  it('should allow same player name for multiple sessions', async () => {
    const sameNameInput: CreateGameSessionInput = { player_name: 'SameName' };

    const session1 = await createGameSession(sameNameInput);
    const session2 = await createGameSession(sameNameInput);

    // Both should be created successfully with different IDs
    expect(session1.id).not.toEqual(session2.id);
    expect(session1.player_name).toEqual('SameName');
    expect(session2.player_name).toEqual('SameName');

    // Verify both exist in database
    const sessions = await db.select()
      .from(gameSessionsTable)
      .execute();

    const sameNameSessions = sessions.filter(s => s.player_name === 'SameName');
    expect(sameNameSessions).toHaveLength(2);
  });
});