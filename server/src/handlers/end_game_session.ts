import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type EndGameSessionInput, type GameSession } from '../schema';
import { eq } from 'drizzle-orm';

export const endGameSession = async (input: EndGameSessionInput): Promise<GameSession> => {
  try {
    // Update the game session to set the ended_at timestamp
    const result = await db.update(gameSessionsTable)
      .set({
        ended_at: new Date()
      })
      .where(eq(gameSessionsTable.id, input.session_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Game session with id ${input.session_id} not found`);
    }

    // Return the updated session data
    return result[0];
  } catch (error) {
    console.error('Game session end failed:', error);
    throw error;
  }
};