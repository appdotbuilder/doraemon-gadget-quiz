import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { GameSession } from '../../../server/src/schema';

interface GameStatsProps {
  session: GameSession;
}

export function GameStats({ session }: GameStatsProps) {
  const accuracy = session.questions_answered > 0 
    ? (session.correct_answers / session.questions_answered) * 100 
    : 0;

  return (
    <Card className="border-2 border-orange-300 shadow-lg card-hover">
      <CardHeader className="bg-orange-50">
        <CardTitle className="text-orange-800">
          📊 Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Player:</span>
            <span className="font-bold text-orange-700">{session.player_name}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span>Score:</span>
            <span className="font-bold text-blue-600">{session.total_score} 🌟</span>
          </div>
          <div className="flex justify-between">
            <span>Answered:</span>
            <span className="font-bold">{session.questions_answered}</span>
          </div>
          <div className="flex justify-between">
            <span>Correct:</span>
            <span className="font-bold text-green-600">{session.correct_answers}</span>
          </div>
          {session.questions_answered > 0 && (
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Accuracy:</span>
                <span className={`text-sm font-bold ${
                  accuracy >= 80 ? 'text-green-600' : 
                  accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {accuracy.toFixed(1)}%
                </span>
              </div>
              <div className="progress-glow">
                <Progress 
                  value={accuracy} 
                  className="h-2"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}