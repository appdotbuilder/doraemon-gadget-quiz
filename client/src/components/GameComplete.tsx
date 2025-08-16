import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { GameStats } from '../../../server/src/schema';

interface GameCompleteProps {
  stats: GameStats;
  playerName: string;
  onPlayAgain: () => void;
}

export function GameComplete({ stats, playerName, onPlayAgain }: GameCompleteProps) {
  const getPerformanceMessage = () => {
    if (stats.accuracy_percentage >= 90) {
      return {
        emoji: '🌟',
        title: 'Incredible!',
        message: "You're a true Doraemon expert! Almost perfect score!",
        color: 'text-yellow-600'
      };
    } else if (stats.accuracy_percentage >= 80) {
      return {
        emoji: '🎉',
        title: 'Excellent!',
        message: "Amazing knowledge of Doraemon's gadgets!",
        color: 'text-green-600'
      };
    } else if (stats.accuracy_percentage >= 60) {
      return {
        emoji: '👏',
        title: 'Good Job!',
        message: "You know quite a bit about Doraemon's inventions!",
        color: 'text-blue-600'
      };
    } else {
      return {
        emoji: '📚',
        title: 'Keep Learning!',
        message: "Time to rewatch some Doraemon episodes!",
        color: 'text-purple-600'
      };
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const performance = getPerformanceMessage();

  return (
    <Card className="border-2 border-purple-300 shadow-lg card-hover quiz-card-enter">
      <CardHeader className="bg-purple-50">
        <CardTitle className="text-center text-purple-800">
          🏆 Game Complete!
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="text-6xl animate-bounce">
            {performance.emoji}
          </div>
          
          <div>
            <h2 className={`text-3xl font-bold mb-2 ${performance.color}`}>
              {performance.title}
            </h2>
            <p className="text-gray-600 text-lg mb-1">
              Well done, {playerName}!
            </p>
            <p className="text-gray-500">
              {performance.message}
            </p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-2xl font-bold text-purple-800 mb-4">
              Final Score: {stats.total_score} points! 🌟
            </h3>
            
            <div className="grid grid-cols-2 gap-6 text-lg mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {stats.questions_answered}
                </div>
                <div className="text-sm text-gray-500">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.correct_answers}
                </div>
                <div className="text-sm text-gray-500">Correct</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Accuracy Rate</span>
                <span className={`font-bold text-xl ${getAccuracyColor(stats.accuracy_percentage)}`}>
                  {stats.accuracy_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="progress-glow">
                <Progress 
                  value={stats.accuracy_percentage} 
                  className="h-4"
                />
              </div>
            </div>
            
            {stats.accuracy_percentage === 100 && stats.questions_answered > 0 && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                <p className="text-yellow-800 font-bold text-center">
                  🎊 Perfect Score! You're a Doraemon master! 🎊
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onPlayAgain}
              className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6 btn-primary-glow"
            >
              🚀 Play Again!
            </Button>
            
            <p className="text-sm text-gray-500">
              Challenge yourself to beat this score! 💪
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}