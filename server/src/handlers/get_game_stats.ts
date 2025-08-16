import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type GameStats } from '../schema';
import { eq } from 'drizzle-orm';

export async function getGameStats(sessionId: number): Promise<GameStats> {
  try {
    // Fetch game session data
    const results = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, sessionId))
      .execute();

    if (results.length === 0) {
      throw new Error(`Game session with ID ${sessionId} not found`);
    }

    const session = results[0];

    // Calculate accuracy percentage
    const accuracy_percentage = session.questions_answered > 0 
      ? (session.correct_answers / session.questions_answered) * 100
      : 0;

    return {
      total_score: session.total_score,
      questions_answered: session.questions_answered,
      correct_answers: session.correct_answers,
      accuracy_percentage: Math.round(accuracy_percentage * 100) / 100 // Round to 2 decimal places
    };
  } catch (error) {
    console.error('Failed to get game stats:', error);
    throw error;
  }
}