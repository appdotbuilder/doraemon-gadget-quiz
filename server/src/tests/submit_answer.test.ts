import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gadgetsTable, quizQuestionsTable, gameSessionsTable, quizAnswersTable } from '../db/schema';
import { type SubmitAnswerInput } from '../schema';
import { submitAnswer } from '../handlers/submit_answer';
import { eq, and } from 'drizzle-orm';

describe('submitAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testGadgetId: number;
  let testQuestionId: number;
  let testSessionId: number;

  beforeEach(async () => {
    // Create test gadget
    const gadgetResult = await db.insert(gadgetsTable)
      .values({
        name: 'Bamboo Copter',
        description: 'A helicopter hat that allows flight',
        image_url: 'https://example.com/bamboo-copter.jpg'
      })
      .returning()
      .execute();
    testGadgetId = gadgetResult[0].id;

    // Create test question
    const questionResult = await db.insert(quizQuestionsTable)
      .values({
        gadget_id: testGadgetId,
        question_text: 'What does the Bamboo Copter do?',
        correct_answer: 'B',
        option_a: 'Makes bamboo grow',
        option_b: 'Allows flight',
        option_c: 'Creates wind',
        option_d: 'Nothing special',
        hint: 'Think about helicopters!'
      })
      .returning()
      .execute();
    testQuestionId = questionResult[0].id;

    // Create test game session
    const sessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Test Player',
        total_score: 20,
        questions_answered: 2,
        correct_answers: 2
      })
      .returning()
      .execute();
    testSessionId = sessionResult[0].id;
  });

  const createTestInput = (overrides: Partial<SubmitAnswerInput> = {}): SubmitAnswerInput => ({
    session_id: testSessionId,
    question_id: testQuestionId,
    selected_answer: 'B',
    ...overrides
  });

  it('should submit correct answer and update session stats', async () => {
    const input = createTestInput();
    const result = await submitAnswer(input);

    // Check return values
    expect(result.is_correct).toBe(true);
    expect(result.points_awarded).toBe(10);
    expect(result.correct_answer).toBe('B');
    expect(result.hint).toBe(null); // No hint for correct answer
    expect(result.current_score).toBe(30); // 20 + 10

    // Verify answer was recorded
    const answers = await db.select()
      .from(quizAnswersTable)
      .where(and(
        eq(quizAnswersTable.session_id, testSessionId),
        eq(quizAnswersTable.question_id, testQuestionId)
      ))
      .execute();

    expect(answers).toHaveLength(1);
    expect(answers[0].selected_answer).toBe('B');
    expect(answers[0].is_correct).toBe(true);
    expect(answers[0].points_awarded).toBe(10);
    expect(answers[0].answered_at).toBeInstanceOf(Date);

    // Verify session was updated
    const sessions = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, testSessionId))
      .execute();

    expect(sessions[0].total_score).toBe(30);
    expect(sessions[0].questions_answered).toBe(3);
    expect(sessions[0].correct_answers).toBe(3);
  });

  it('should submit incorrect answer with hint and update session stats', async () => {
    const input = createTestInput({ selected_answer: 'A' });
    const result = await submitAnswer(input);

    // Check return values
    expect(result.is_correct).toBe(false);
    expect(result.points_awarded).toBe(0);
    expect(result.correct_answer).toBe('B');
    expect(result.hint).toBe('Think about helicopters!'); // Hint provided for incorrect answer
    expect(result.current_score).toBe(20); // No change in score

    // Verify answer was recorded
    const answers = await db.select()
      .from(quizAnswersTable)
      .where(and(
        eq(quizAnswersTable.session_id, testSessionId),
        eq(quizAnswersTable.question_id, testQuestionId)
      ))
      .execute();

    expect(answers).toHaveLength(1);
    expect(answers[0].selected_answer).toBe('A');
    expect(answers[0].is_correct).toBe(false);
    expect(answers[0].points_awarded).toBe(0);

    // Verify session was updated (questions_answered incremented, correct_answers unchanged)
    const sessions = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, testSessionId))
      .execute();

    expect(sessions[0].total_score).toBe(20);
    expect(sessions[0].questions_answered).toBe(3);
    expect(sessions[0].correct_answers).toBe(2); // No change in correct answers
  });

  it('should handle question with no hint for incorrect answer', async () => {
    // Create question without hint
    const questionResult = await db.insert(quizQuestionsTable)
      .values({
        gadget_id: testGadgetId,
        question_text: 'Another question?',
        correct_answer: 'C',
        option_a: 'Option A',
        option_b: 'Option B', 
        option_c: 'Option C',
        option_d: 'Option D',
        hint: null
      })
      .returning()
      .execute();

    const input = createTestInput({ 
      question_id: questionResult[0].id,
      selected_answer: 'A' // Wrong answer
    });
    
    const result = await submitAnswer(input);

    expect(result.is_correct).toBe(false);
    expect(result.hint).toBe(null); // No hint available
    expect(result.correct_answer).toBe('C');
  });

  it('should throw error for non-existent session', async () => {
    const input = createTestInput({ session_id: 99999 });

    await expect(submitAnswer(input)).rejects.toThrow(/session not found/i);
  });

  it('should throw error for non-existent question', async () => {
    const input = createTestInput({ question_id: 99999 });

    await expect(submitAnswer(input)).rejects.toThrow(/question not found/i);
  });

  it('should throw error for ended game session', async () => {
    // End the game session
    await db.update(gameSessionsTable)
      .set({ ended_at: new Date() })
      .where(eq(gameSessionsTable.id, testSessionId))
      .execute();

    const input = createTestInput();

    await expect(submitAnswer(input)).rejects.toThrow(/session has already ended/i);
  });

  it('should throw error when answering same question twice', async () => {
    const input = createTestInput();

    // Submit answer first time
    await submitAnswer(input);

    // Try to submit answer for same question again
    await expect(submitAnswer(input)).rejects.toThrow(/already been answered/i);
  });

  it('should handle different answer options correctly', async () => {
    const testCases = [
      { selected: 'A', expected_correct: false },
      { selected: 'B', expected_correct: true },
      { selected: 'C', expected_correct: false },
      { selected: 'D', expected_correct: false }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      // Create a new question for each test case
      const questionResult = await db.insert(quizQuestionsTable)
        .values({
          gadget_id: testGadgetId,
          question_text: `Test question ${i}?`,
          correct_answer: 'B',
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C', 
          option_d: 'Option D',
          hint: 'Test hint'
        })
        .returning()
        .execute();

      const input = createTestInput({
        question_id: questionResult[0].id,
        selected_answer: testCase.selected
      });

      const result = await submitAnswer(input);

      expect(result.is_correct).toBe(testCase.expected_correct);
      expect(result.points_awarded).toBe(testCase.expected_correct ? 10 : 0);
      expect(result.hint).toBe(testCase.expected_correct ? null : 'Test hint');
    }
  });
});