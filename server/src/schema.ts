import { z } from 'zod';

// Gadget schema
export const gadgetSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Gadget = z.infer<typeof gadgetSchema>;

// Quiz question schema
export const quizQuestionSchema = z.object({
  id: z.number(),
  gadget_id: z.number(),
  question_text: z.string(),
  correct_answer: z.string(),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  hint: z.string().nullable(),
  created_at: z.coerce.date()
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// Game session schema
export const gameSessionSchema = z.object({
  id: z.number(),
  player_name: z.string(),
  total_score: z.number().int(),
  questions_answered: z.number().int(),
  correct_answers: z.number().int(),
  started_at: z.coerce.date(),
  ended_at: z.coerce.date().nullable()
});

export type GameSession = z.infer<typeof gameSessionSchema>;

// Quiz answer schema
export const quizAnswerSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  question_id: z.number(),
  selected_answer: z.string(),
  is_correct: z.boolean(),
  points_awarded: z.number().int(),
  answered_at: z.coerce.date()
});

export type QuizAnswer = z.infer<typeof quizAnswerSchema>;

// Input schemas
export const createGameSessionInputSchema = z.object({
  player_name: z.string().min(1, "Player name is required")
});

export type CreateGameSessionInput = z.infer<typeof createGameSessionInputSchema>;

export const submitAnswerInputSchema = z.object({
  session_id: z.number(),
  question_id: z.number(),
  selected_answer: z.string()
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerInputSchema>;

export const endGameSessionInputSchema = z.object({
  session_id: z.number()
});

export type EndGameSessionInput = z.infer<typeof endGameSessionInputSchema>;

// Response schemas
export const quizQuestionWithOptionsSchema = z.object({
  id: z.number(),
  gadget_id: z.number(),
  question_text: z.string(),
  options: z.array(z.object({
    key: z.string(),
    value: z.string()
  })),
  gadget: gadgetSchema.optional()
});

export type QuizQuestionWithOptions = z.infer<typeof quizQuestionWithOptionsSchema>;

export const answerResultSchema = z.object({
  is_correct: z.boolean(),
  points_awarded: z.number().int(),
  correct_answer: z.string(),
  hint: z.string().nullable(),
  current_score: z.number().int()
});

export type AnswerResult = z.infer<typeof answerResultSchema>;

export const gameStatsSchema = z.object({
  total_score: z.number().int(),
  questions_answered: z.number().int(),
  correct_answers: z.number().int(),
  accuracy_percentage: z.number()
});

export type GameStats = z.infer<typeof gameStatsSchema>;