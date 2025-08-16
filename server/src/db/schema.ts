import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Gadgets table - stores information about Doraemon's gadgets
export const gadgetsTable = pgTable('gadgets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  image_url: text('image_url'), // Nullable by default, for optional gadget images
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quiz questions table - stores questions about gadgets with multiple choice options
export const quizQuestionsTable = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  gadget_id: integer('gadget_id').notNull(), // Foreign key to gadgets
  question_text: text('question_text').notNull(),
  correct_answer: text('correct_answer').notNull(), // A, B, C, or D
  option_a: text('option_a').notNull(),
  option_b: text('option_b').notNull(),
  option_c: text('option_c').notNull(),
  option_d: text('option_d').notNull(),
  hint: text('hint'), // Nullable, optional hint for wrong answers
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Game sessions table - tracks individual game sessions
export const gameSessionsTable = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  player_name: text('player_name').notNull(),
  total_score: integer('total_score').notNull().default(0),
  questions_answered: integer('questions_answered').notNull().default(0),
  correct_answers: integer('correct_answers').notNull().default(0),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'), // Nullable, set when game ends
});

// Quiz answers table - tracks individual answers within game sessions
export const quizAnswersTable = pgTable('quiz_answers', {
  id: serial('id').primaryKey(),
  session_id: integer('session_id').notNull(), // Foreign key to game_sessions
  question_id: integer('question_id').notNull(), // Foreign key to quiz_questions
  selected_answer: text('selected_answer').notNull(), // A, B, C, or D
  is_correct: boolean('is_correct').notNull(),
  points_awarded: integer('points_awarded').notNull().default(0),
  answered_at: timestamp('answered_at').defaultNow().notNull(),
});

// Define relations between tables
export const gadgetsRelations = relations(gadgetsTable, ({ many }) => ({
  questions: many(quizQuestionsTable),
}));

export const quizQuestionsRelations = relations(quizQuestionsTable, ({ one, many }) => ({
  gadget: one(gadgetsTable, {
    fields: [quizQuestionsTable.gadget_id],
    references: [gadgetsTable.id],
  }),
  answers: many(quizAnswersTable),
}));

export const gameSessionsRelations = relations(gameSessionsTable, ({ many }) => ({
  answers: many(quizAnswersTable),
}));

export const quizAnswersRelations = relations(quizAnswersTable, ({ one }) => ({
  session: one(gameSessionsTable, {
    fields: [quizAnswersTable.session_id],
    references: [gameSessionsTable.id],
  }),
  question: one(quizQuestionsTable, {
    fields: [quizAnswersTable.question_id],
    references: [quizQuestionsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Gadget = typeof gadgetsTable.$inferSelect;
export type NewGadget = typeof gadgetsTable.$inferInsert;

export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;
export type NewQuizQuestion = typeof quizQuestionsTable.$inferInsert;

export type GameSession = typeof gameSessionsTable.$inferSelect;
export type NewGameSession = typeof gameSessionsTable.$inferInsert;

export type QuizAnswer = typeof quizAnswersTable.$inferSelect;
export type NewQuizAnswer = typeof quizAnswersTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  gadgets: gadgetsTable,
  quizQuestions: quizQuestionsTable,
  gameSessions: gameSessionsTable,
  quizAnswers: quizAnswersTable,
};