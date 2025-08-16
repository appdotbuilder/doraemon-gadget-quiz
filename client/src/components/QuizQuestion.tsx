import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QuizQuestionWithOptions, AnswerResult } from '../../../server/src/schema';

interface QuizQuestionProps {
  question: QuizQuestionWithOptions;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  onSubmit: () => void;
  answerResult: AnswerResult | null;
  showResult: boolean;
  onNextQuestion: () => void;
  onEndGame: () => void;
  isLoading: boolean;
  currentScore: number;
}

export function QuizQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
  onSubmit,
  answerResult,
  showResult,
  onNextQuestion,
  onEndGame,
  isLoading,
  currentScore
}: QuizQuestionProps) {
  return (
    <Card className="border-2 border-green-300 shadow-lg card-hover quiz-card-enter">
      <CardHeader className="bg-green-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-green-800">
            🎲 Question Time!
          </CardTitle>
          <Badge variant="secondary" className="text-lg px-3 py-1 score-bounce">
            Score: {currentScore} 🌟
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!showResult ? (
          <div className="space-y-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-lg font-medium text-gray-800 mb-4">
                {question.question_text}
              </p>
              {question.gadget?.description && (
                <p className="text-gray-600 italic">
                  💡 {question.gadget.description}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option) => (
                <button
                  key={option.key}
                  onClick={() => onAnswerSelect(option.key)}
                  className={`p-4 text-left rounded-lg border-2 transition-all quiz-option-hover ${
                    selectedAnswer === option.key
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-bold text-blue-600">{option.key})</span>{' '}
                  {option.value}
                </button>
              ))}
            </div>

            <Button 
              onClick={onSubmit}
              disabled={!selectedAnswer || isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-4 btn-primary-glow"
            >
              {isLoading ? '⏳ Checking Answer...' : '✅ Submit Answer'}
            </Button>
          </div>
        ) : answerResult && (
          <div className="space-y-6">
            <div className={`p-6 rounded-lg text-center transition-all duration-500 ${
              answerResult.is_correct 
                ? 'correct-answer' 
                : 'incorrect-answer'
            }`}>
              <div className="text-4xl mb-2">
                {answerResult.is_correct ? '🎉' : '😅'}
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                answerResult.is_correct ? 'text-green-800' : 'text-red-800'
              }`}>
                {answerResult.is_correct ? 'Correct!' : 'Not quite right!'}
              </h3>
              <p className="text-lg">
                {answerResult.is_correct 
                  ? `Great job! You earned ${answerResult.points_awarded} points!` 
                  : `The correct answer was: ${answerResult.correct_answer}`
                }
              </p>
              {answerResult.hint && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800">
                    💡 <strong>Hint:</strong> {answerResult.hint}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={onNextQuestion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 btn-primary-glow"
                disabled={isLoading}
              >
                ➡️ Next Question
              </Button>
              <Button 
                onClick={onEndGame}
                variant="outline"
                className="flex-1 hover:bg-gray-50"
                disabled={isLoading}
              >
                🏁 Finish Game
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}