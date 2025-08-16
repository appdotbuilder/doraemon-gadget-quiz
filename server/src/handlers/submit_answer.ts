import { db } from '../db';
import { quizQuestionsTable, gameSessionsTable, quizAnswersTable } from '../db/schema';
import { type SubmitAnswerInput, type AnswerResult } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function submitAnswer(input: SubmitAnswerInput): Promise<AnswerResult> {
  try {
    // First, verify the game session exists and is active (not ended)
    const sessionResult = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, input.session_id))
      .execute();

    if (sessionResult.length === 0) {
      throw new Error('Game session not found');
    }

    const session = sessionResult[0];
    if (session.ended_at !== null) {
      throw new Error('Game session has already ended');
    }

    // Get the question to check the correct answer
    const questionResult = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.id, input.question_id))
      .execute();

    if (questionResult.length === 0) {
      throw new Error('Question not found');
    }

    const question = questionResult[0];

    // Check if this question has already been answered in this session
    const existingAnswerResult = await db.select()
      .from(quizAnswersTable)
      .where(and(
        eq(quizAnswersTable.session_id, input.session_id),
        eq(quizAnswersTable.question_id, input.question_id)
      ))
      .execute();

    if (existingAnswerResult.length > 0) {
      throw new Error('Question has already been answered in this session');
    }

    // Check if the answer is correct
    const isCorrect = input.selected_answer === question.correct_answer;
    const pointsAwarded = isCorrect ? 10 : 0;

    // Record the answer in quiz_answers table
    await db.insert(quizAnswersTable)
      .values({
        session_id: input.session_id,
        question_id: input.question_id,
        selected_answer: input.selected_answer,
        is_correct: isCorrect,
        points_awarded: pointsAwarded
      })
      .execute();

    // Update game session stats
    const newTotalScore = session.total_score + pointsAwarded;
    const newQuestionsAnswered = session.questions_answered + 1;
    const newCorrectAnswers = session.correct_answers + (isCorrect ? 1 : 0);

    await db.update(gameSessionsTable)
      .set({
        total_score: newTotalScore,
        questions_answered: newQuestionsAnswered,
        correct_answers: newCorrectAnswers
      })
      .where(eq(gameSessionsTable.id, input.session_id))
      .execute();

    // Return the result
    return {
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      correct_answer: question.correct_answer,
      hint: isCorrect ? null : question.hint, // Only provide hint if answer is incorrect
      current_score: newTotalScore
    };

  } catch (error) {
    console.error('Submit answer failed:', error);
    throw error;
  }
}