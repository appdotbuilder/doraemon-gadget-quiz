import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { getLeaderboard } from '../handlers/get_leaderboard';

describe('getLeaderboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no completed sessions exist', async () => {
    const result = await getLeaderboard();
    expect(result).toHaveLength(0);
  });

  it('should return completed sessions ordered by total_score descending', async () => {
    // Create test sessions - mix of completed and ongoing
    const sessions = [
      {
        player_name: 'Alice',
        total_score: 150,
        questions_answered: 10,
        correct_answers: 8,
        started_at: new Date('2024-01-01T10:00:00Z'),
        ended_at: new Date('2024-01-01T10:30:00Z') // Completed
      },
      {
        player_name: 'Bob',
        total_score: 200,
        questions_answered: 12,
        correct_answers: 10,
        started_at: new Date('2024-01-01T11:00:00Z'),
        ended_at: new Date('2024-01-01T11:30:00Z') // Completed
      },
      {
        player_name: 'Charlie',
        total_score: 100,
        questions_answered: 8,
        correct_answers: 5,
        started_at: new Date('2024-01-01T12:00:00Z'),
        ended_at: null // Ongoing - should be excluded
      },
      {
        player_name: 'Diana',
        total_score: 180,
        questions_answered: 15,
        correct_answers: 12,
        started_at: new Date('2024-01-01T13:00:00Z'),
        ended_at: new Date('2024-01-01T13:30:00Z') // Completed
      }
    ];

    await db.insert(gameSessionsTable).values(sessions).execute();

    const result = await getLeaderboard();

    // Should return only completed sessions (3 out of 4)
    expect(result).toHaveLength(3);

    // Should be ordered by total_score descending
    expect(result[0].player_name).toEqual('Bob');
    expect(result[0].total_score).toEqual(200);
    
    expect(result[1].player_name).toEqual('Diana');
    expect(result[1].total_score).toEqual(180);
    
    expect(result[2].player_name).toEqual('Alice');
    expect(result[2].total_score).toEqual(150);

    // Verify all returned sessions have ended_at
    result.forEach(session => {
      expect(session.ended_at).not.toBeNull();
      expect(session.ended_at).toBeInstanceOf(Date);
    });
  });

  it('should respect the limit parameter', async () => {
    // Create 5 completed sessions
    const sessions = [];
    for (let i = 1; i <= 5; i++) {
      sessions.push({
        player_name: `Player${i}`,
        total_score: i * 50, // 50, 100, 150, 200, 250
        questions_answered: 10,
        correct_answers: 8,
        started_at: new Date(`2024-01-0${i}T10:00:00Z`),
        ended_at: new Date(`2024-01-0${i}T10:30:00Z`)
      });
    }

    await db.insert(gameSessionsTable).values(sessions).execute();

    // Test with limit of 3
    const result = await getLeaderboard(3);

    expect(result).toHaveLength(3);
    
    // Should get the top 3 scores (250, 200, 150)
    expect(result[0].total_score).toEqual(250);
    expect(result[1].total_score).toEqual(200);
    expect(result[2].total_score).toEqual(150);
  });

  it('should handle default limit of 10', async () => {
    // Create 15 completed sessions
    const sessions = [];
    for (let i = 1; i <= 15; i++) {
      sessions.push({
        player_name: `Player${i}`,
        total_score: i * 10,
        questions_answered: 5,
        correct_answers: 3,
        started_at: new Date(`2024-01-01T${i.toString().padStart(2, '0')}:00:00Z`),
        ended_at: new Date(`2024-01-01T${i.toString().padStart(2, '0')}:30:00Z`)
      });
    }

    await db.insert(gameSessionsTable).values(sessions).execute();

    // Call without explicit limit (should default to 10)
    const result = await getLeaderboard();

    expect(result).toHaveLength(10);
    
    // Should get the top 10 scores (150, 140, 130, ..., 60)
    expect(result[0].total_score).toEqual(150);
    expect(result[9].total_score).toEqual(60);
  });

  it('should handle sessions with same score correctly', async () => {
    // Create sessions with identical scores
    const sessions = [
      {
        player_name: 'Alice',
        total_score: 100,
        questions_answered: 10,
        correct_answers: 5,
        started_at: new Date('2024-01-01T10:00:00Z'),
        ended_at: new Date('2024-01-01T10:30:00Z')
      },
      {
        player_name: 'Bob',
        total_score: 100,
        questions_answered: 10,
        correct_answers: 5,
        started_at: new Date('2024-01-01T11:00:00Z'),
        ended_at: new Date('2024-01-01T11:30:00Z')
      },
      {
        player_name: 'Charlie',
        total_score: 200,
        questions_answered: 15,
        correct_answers: 10,
        started_at: new Date('2024-01-01T12:00:00Z'),
        ended_at: new Date('2024-01-01T12:30:00Z')
      }
    ];

    await db.insert(gameSessionsTable).values(sessions).execute();

    const result = await getLeaderboard();

    expect(result).toHaveLength(3);
    
    // Highest score should be first
    expect(result[0].total_score).toEqual(200);
    expect(result[0].player_name).toEqual('Charlie');
    
    // Both sessions with score 100 should be included
    expect(result[1].total_score).toEqual(100);
    expect(result[2].total_score).toEqual(100);
    
    const playerNames = [result[1].player_name, result[2].player_name];
    expect(playerNames).toContain('Alice');
    expect(playerNames).toContain('Bob');
  });

  it('should exclude ongoing sessions even with high scores', async () => {
    const sessions = [
      {
        player_name: 'Alice',
        total_score: 50,
        questions_answered: 5,
        correct_answers: 3,
        started_at: new Date('2024-01-01T10:00:00Z'),
        ended_at: new Date('2024-01-01T10:30:00Z') // Completed
      },
      {
        player_name: 'Bob',
        total_score: 500, // Very high score but ongoing
        questions_answered: 20,
        correct_answers: 18,
        started_at: new Date('2024-01-01T11:00:00Z'),
        ended_at: null // Ongoing - should be excluded despite high score
      }
    ];

    await db.insert(gameSessionsTable).values(sessions).execute();

    const result = await getLeaderboard();

    // Should only return Alice's completed session
    expect(result).toHaveLength(1);
    expect(result[0].player_name).toEqual('Alice');
    expect(result[0].total_score).toEqual(50);
  });
});