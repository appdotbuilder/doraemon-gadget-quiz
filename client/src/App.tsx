import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { GameStart } from '@/components/GameStart';
import { QuizQuestion } from '@/components/QuizQuestion';
import { GameComplete } from '@/components/GameComplete';
import { GameStats } from '@/components/GameStats';
import { Leaderboard } from '@/components/Leaderboard';
import { HowToPlay } from '@/components/HowToPlay';
import type { 
  GameSession, 
  QuizQuestionWithOptions, 
  AnswerResult, 
  GameStats as GameStatsType,
  CreateGameSessionInput 
} from '../../server/src/schema';

type GameState = 'start' | 'playing' | 'result' | 'finished';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [playerName, setPlayerName] = useState('');
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestionWithOptions | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [gameStats, setGameStats] = useState<GameStatsType | null>(null);
  const [leaderboard, setLeaderboard] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Load leaderboard on app start
  const loadLeaderboard = useCallback(async () => {
    try {
      const result = await trpc.getLeaderboard.query({ limit: 5 });
      setLeaderboard(result);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const startGame = async () => {
    if (!playerName.trim()) return;
    
    setIsLoading(true);
    try {
      const sessionInput: CreateGameSessionInput = { player_name: playerName.trim() };
      const session = await trpc.createGameSession.mutate(sessionInput);
      setCurrentSession(session);
      setGameState('playing');
      await loadNextQuestion(session.id);
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextQuestion = async (sessionId: number) => {
    setIsLoading(true);
    setSelectedAnswer('');
    setAnswerResult(null);
    setShowResult(false);
    
    try {
      const question = await trpc.getRandomQuestion.query({ sessionId });
      if (question) {
        setCurrentQuestion(question);
      } else {
        // No more questions available - end game
        await endGame();
      }
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentSession || !currentQuestion) return;
    
    setIsLoading(true);
    try {
      const result = await trpc.submitAnswer.mutate({
        session_id: currentSession.id,
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer
      });
      setAnswerResult(result);
      setShowResult(true);
      
      // Update current session score for display
      setCurrentSession(prev => prev ? {
        ...prev,
        total_score: result.current_score,
        questions_answered: prev.questions_answered + 1,
        correct_answers: prev.correct_answers + (result.is_correct ? 1 : 0)
      } : null);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentSession) {
      loadNextQuestion(currentSession.id);
    }
  };

  const endGame = async () => {
    if (!currentSession) return;
    
    setIsLoading(true);
    try {
      await trpc.endGameSession.mutate({ session_id: currentSession.id });
      const stats = await trpc.getGameStats.query({ sessionId: currentSession.id });
      setGameStats(stats);
      setGameState('finished');
      // Reload leaderboard to show updated rankings
      await loadLeaderboard();
    } catch (error) {
      console.error('Failed to end game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setGameState('start');
    setPlayerName('');
    setCurrentSession(null);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setAnswerResult(null);
    setGameStats(null);
    setShowResult(false);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-rose-50 to-red-200 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-800 mb-2">
            🤖 Doraemon's Secret Gadgets Quiz! 🎮
          </h1>
          <p className="text-red-600">Test your knowledge of Doraemon's amazing inventions!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            {gameState === 'start' && (
              <GameStart
                playerName={playerName}
                onPlayerNameChange={setPlayerName}
                onStartGame={startGame}
                isLoading={isLoading}
              />
            )}

            {gameState === 'playing' && currentQuestion && currentSession && (
              <QuizQuestion
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={setSelectedAnswer}
                onSubmit={submitAnswer}
                answerResult={answerResult}
                showResult={showResult}
                onNextQuestion={nextQuestion}
                onEndGame={endGame}
                isLoading={isLoading}
                currentScore={currentSession.total_score}
              />
            )}

            {gameState === 'finished' && gameStats && (
              <GameComplete
                stats={gameStats}
                playerName={playerName}
                onPlayAgain={resetGame}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Game Stats */}
            {currentSession && gameState === 'playing' && (
              <GameStats session={currentSession} />
            )}

            {/* Leaderboard */}
            <Leaderboard sessions={leaderboard} />

            {/* How to Play */}
            <HowToPlay />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;