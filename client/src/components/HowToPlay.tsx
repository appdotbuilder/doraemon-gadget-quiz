import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HowToPlay() {
  return (
    <Card className="border-2 border-cyan-300 shadow-lg card-hover">
      <CardHeader className="bg-cyan-50">
        <CardTitle className="text-cyan-800">
          🎮 How to Play
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">🤖</span>
            <p className="text-sm text-cyan-700">
              Answer questions about Doraemon's amazing gadgets
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">✅</span>
            <p className="text-sm text-cyan-700">
              Correct answers earn you <strong>10 points</strong>
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">❌</span>
            <p className="text-sm text-cyan-700">
              Wrong answers show helpful hints
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">🏆</span>
            <p className="text-sm text-cyan-700">
              Climb the leaderboard with high scores!
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">🎯</span>
            <p className="text-sm text-cyan-700">
              Answer as many questions as you can
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 text-center font-medium">
            💡 Tip: Read the gadget descriptions carefully - they often contain clues!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}