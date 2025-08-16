import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameSession } from '../../../server/src/schema';

interface LeaderboardProps {
  sessions: GameSession[];
}

export function Leaderboard({ sessions }: LeaderboardProps) {
  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈'; 
      case 2: return '🥉';
      default: return '🏅';
    }
  };

  const getAccuracyColor = (session: GameSession) => {
    if (session.questions_answered === 0) return 'text-gray-500';
    const accuracy = (session.correct_answers / session.questions_answered) * 100;
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracy = (session: GameSession) => {
    if (session.questions_answered === 0) return '0';
    return ((session.correct_answers / session.questions_answered) * 100).toFixed(1);
  };

  return (
    <Card className="border-2 border-yellow-300 shadow-lg card-hover">
      <CardHeader className="bg-yellow-50">
        <CardTitle className="text-yellow-800">
          🏆 Top Players
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {sessions.length > 0 ? (
          <div className="space-y-1">
            {sessions.map((session, index) => (
              <div 
                key={session.id} 
                className="leaderboard-item"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">
                      {getRankEmoji(index)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {session.player_name}
                      </div>
                      <div className={`text-xs ${getAccuracyColor(session)}`}>
                        {getAccuracy(session)}% accuracy
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-blue-600">
                      {session.total_score}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.questions_answered}Q
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No games completed yet!
            <br />
            <span className="text-2xl">🎯</span>
            <br />
            Be the first!
          </p>
        )}
      </CardContent>
    </Card>
  );
}