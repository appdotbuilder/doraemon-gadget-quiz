import { db } from '../db';
import { quizQuestionsTable, gadgetsTable, quizAnswersTable } from '../db/schema';
import { type QuizQuestionWithOptions } from '../schema';
import { eq, notInArray, sql } from 'drizzle-orm';

export async function getRandomQuestion(sessionId: number): Promise<QuizQuestionWithOptions | null> {
  try {
    // First, get all question IDs that have already been answered in this session
    const answeredQuestions = await db.select({ question_id: quizAnswersTable.question_id })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.session_id, sessionId))
      .execute();

    const answeredQuestionIds = answeredQuestions.map(aq => aq.question_id);

    // Build the query to get a random unanswered question with gadget info
    const baseQuery = db.select()
      .from(quizQuestionsTable)
      .innerJoin(gadgetsTable, eq(quizQuestionsTable.gadget_id, gadgetsTable.id));

    // Apply where clause conditionally, then order and limit
    const query = answeredQuestionIds.length > 0
      ? baseQuery.where(notInArray(quizQuestionsTable.id, answeredQuestionIds)).orderBy(sql`RANDOM()`).limit(1)
      : baseQuery.orderBy(sql`RANDOM()`).limit(1);

    const results = await query.execute();

    if (results.length === 0) {
      return null; // No more unanswered questions
    }

    const result = results[0];
    const question = result.quiz_questions;
    const gadget = result.gadgets;

    // Format the response with options array
    return {
      id: question.id,
      gadget_id: question.gadget_id,
      question_text: question.question_text,
      options: [
        { key: "A", value: question.option_a },
        { key: "B", value: question.option_b },
        { key: "C", value: question.option_c },
        { key: "D", value: question.option_d }
      ],
      gadget: {
        id: gadget.id,
        name: gadget.name,
        description: gadget.description,
        image_url: gadget.image_url,
        created_at: gadget.created_at
      }
    };
  } catch (error) {
    console.error('Failed to get random question:', error);
    throw error;
  }
}