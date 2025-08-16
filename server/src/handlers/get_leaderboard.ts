import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type GameSession } from '../schema';
import { desc, isNotNull } from 'drizzle-orm';

export async function getLeaderboard(limit: number = 10): Promise<GameSession[]> {
  try {
    // Build query to get completed game sessions ordered by score
    const results = await db.select()
      .from(gameSessionsTable)
      .where(isNotNull(gameSessionsTable.ended_at))
      .orderBy(desc(gameSessionsTable.total_score))
      .limit(limit)
      .execute();

    return results;
  } catch (error) {
    console.error('Leaderboard retrieval failed:', error);
    throw error;
  }
}