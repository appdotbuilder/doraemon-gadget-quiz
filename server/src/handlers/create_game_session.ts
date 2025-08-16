import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type CreateGameSessionInput, type GameSession } from '../schema';

export const createGameSession = async (input: CreateGameSessionInput): Promise<GameSession> => {
  try {
    // Insert new game session record
    const result = await db.insert(gameSessionsTable)
      .values({
        player_name: input.player_name,
        total_score: 0,
        questions_answered: 0,
        correct_answers: 0
        // started_at and ended_at will be handled by database defaults
      })
      .returning()
      .execute();

    // Return the created game session
    const session = result[0];
    return {
      ...session,
      ended_at: session.ended_at // Will be null as expected
    };
  } catch (error) {
    console.error('Game session creation failed:', error);
    throw error;
  }
};