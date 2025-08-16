import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createGameSessionInputSchema,
  submitAnswerInputSchema,
  endGameSessionInputSchema
} from './schema';

// Import handlers
import { createGameSession } from './handlers/create_game_session';
import { getRandomQuestion } from './handlers/get_random_question';
import { submitAnswer } from './handlers/submit_answer';
import { getGameStats } from './handlers/get_game_stats';
import { endGameSession } from './handlers/end_game_session';
import { getLeaderboard } from './handlers/get_leaderboard';
import { getAllGadgets } from './handlers/get_all_gadgets';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Game session management
  createGameSession: publicProcedure
    .input(createGameSessionInputSchema)
    .mutation(({ input }) => createGameSession(input)),

  endGameSession: publicProcedure
    .input(endGameSessionInputSchema)
    .mutation(({ input }) => endGameSession(input)),

  // Quiz gameplay
  getRandomQuestion: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getRandomQuestion(input.sessionId)),

  submitAnswer: publicProcedure
    .input(submitAnswerInputSchema)
    .mutation(({ input }) => submitAnswer(input)),

  // Game statistics and leaderboard
  getGameStats: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getGameStats(input.sessionId)),

  getLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(10) }))
    .query(({ input }) => getLeaderboard(input.limit)),

  // Reference data
  getAllGadgets: publicProcedure
    .query(() => getAllGadgets()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();