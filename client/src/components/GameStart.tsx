import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameStartProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStartGame: () => void;
  isLoading: boolean;
}

export function GameStart({ 
  playerName, 
  onPlayerNameChange, 
  onStartGame, 
  isLoading 
}: GameStartProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && playerName.trim() && !isLoading) {
      onStartGame();
    }
  };

  return (
    <Card className="border-2 border-blue-300 shadow-lg card-hover">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-center text-blue-800">
          🚀 Ready to Start Your Adventure?
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600 text-lg">
              Welcome to the ultimate Doraemon gadgets quiz! 🤖
            </p>
            <p className="text-gray-500">
              Test your knowledge of Doraemon's amazing secret inventions and gadgets.
              Answer correctly to earn points and climb the leaderboard!
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Enter your name to begin:
              </label>
              <Input
                value={playerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onPlayerNameChange(e.target.value)
                }
                placeholder="Your name here..."
                className="text-lg py-3"
                onKeyPress={handleKeyPress}
                maxLength={20}
                autoFocus
              />
            </div>
            
            <Button 
              onClick={onStartGame}
              disabled={!playerName.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 btn-primary-glow"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2">⏳</div>
                  Starting Game...
                </>
              ) : (
                '🎯 Start Quiz!'
              )}
            </Button>
          </div>

          <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
            <h4 className="font-bold text-cyan-800 mb-2">🎮 How to Play:</h4>
            <ul className="space-y-1 text-sm text-cyan-700">
              <li>🤖 Answer questions about Doraemon's gadgets</li>
              <li>✅ Correct answers earn you 10 points</li>
              <li>❌ Wrong answers will show you hints</li>
              <li>🏆 Try to get the highest score on the leaderboard!</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}