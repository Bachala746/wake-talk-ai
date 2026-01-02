import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Calculator, 
  Smartphone, 
  Type, 
  Brain, 
  Puzzle, 
  Timer,
  CheckCircle,
  XCircle,
  RotateCcw
} from "lucide-react";
import { ChallengeType } from "@/lib/alarmSettings";

interface WakeUpChallengeProps {
  challengeType: ChallengeType;
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: () => void;
  onFail?: () => void;
}

// Math problem generator
const generateMathProblem = (difficulty: 'easy' | 'medium' | 'hard') => {
  let a: number, b: number, c: number, operation: string, answer: number;
  
  switch (difficulty) {
    case 'easy':
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      operation = Math.random() > 0.5 ? '+' : '-';
      answer = operation === '+' ? a + b : a - b;
      return { problem: `${a} ${operation} ${b}`, answer };
    case 'medium':
      a = Math.floor(Math.random() * 20) + 5;
      b = Math.floor(Math.random() * 10) + 1;
      const ops = ['+', '-', '×'];
      operation = ops[Math.floor(Math.random() * ops.length)];
      if (operation === '×') {
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
      } else {
        answer = operation === '+' ? a + b : a - b;
      }
      return { problem: `${a} ${operation} ${b}`, answer };
    case 'hard':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 30) + 5;
      c = Math.floor(Math.random() * 10) + 1;
      answer = a + b - c;
      return { problem: `${a} + ${b} - ${c}`, answer };
  }
};

// Memory sequence generator
const generateMemorySequence = (difficulty: 'easy' | 'medium' | 'hard') => {
  const length = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * 9) + 1);
  }
  return sequence;
};

// Word typing generator
const generateTypingWord = (difficulty: 'easy' | 'medium' | 'hard') => {
  const easyWords = ["sunshine", "morning", "awake", "energy", "fresh", "bright"];
  const mediumWords = ["motivation", "achievement", "productivity", "excellence", "inspiration"];
  const hardWords = ["phenomenal", "extraordinary", "unstoppable", "magnificent", "accomplished"];
  
  const words = difficulty === 'easy' ? easyWords : difficulty === 'medium' ? mediumWords : hardWords;
  return words[Math.floor(Math.random() * words.length)];
};

// Pattern matching generator
const generatePattern = (difficulty: 'easy' | 'medium' | 'hard') => {
  const gridSize = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
  const patternLength = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
  const pattern: number[] = [];
  
  for (let i = 0; i < patternLength; i++) {
    let cell;
    do {
      cell = Math.floor(Math.random() * (gridSize * gridSize));
    } while (pattern.includes(cell));
    pattern.push(cell);
  }
  
  return { gridSize, pattern };
};

export const WakeUpChallenge = ({ 
  challengeType, 
  difficulty, 
  onComplete, 
  onFail 
}: WakeUpChallengeProps) => {
  // State for different challenge types
  const [mathProblem, setMathProblem] = useState(() => generateMathProblem(difficulty));
  const [userAnswer, setUserAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Shake challenge state
  const [shakeCount, setShakeCount] = useState(0);
  const [shakeRequired] = useState(difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 50);
  
  // Memory challenge state
  const [memorySequence, setMemorySequence] = useState(() => generateMemorySequence(difficulty));
  const [showingSequence, setShowingSequence] = useState(true);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  
  // Typing challenge state
  const [typingWord, setTypingWord] = useState(() => generateTypingWord(difficulty));
  const [typedText, setTypedText] = useState("");
  
  // Pattern challenge state
  const [patternData, setPatternData] = useState(() => generatePattern(difficulty));
  const [showingPattern, setShowingPattern] = useState(true);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  
  // Timer for quick math
  const [timeLeft, setTimeLeft] = useState(difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15);
  
  // Shake detection
  useEffect(() => {
    if (challengeType !== 'shake') return;
    
    let lastX = 0, lastY = 0, lastZ = 0;
    const threshold = 15;
    
    const handleMotion = (event: DeviceMotionEvent) => {
      const { accelerationIncludingGravity } = event;
      if (!accelerationIncludingGravity) return;
      
      const { x, y, z } = accelerationIncludingGravity;
      const deltaX = Math.abs((x || 0) - lastX);
      const deltaY = Math.abs((y || 0) - lastY);
      const deltaZ = Math.abs((z || 0) - lastZ);
      
      if (deltaX + deltaY + deltaZ > threshold) {
        setShakeCount(prev => {
          const newCount = prev + 1;
          if (newCount >= shakeRequired) {
            onComplete();
          }
          return newCount;
        });
      }
      
      lastX = x || 0;
      lastY = y || 0;
      lastZ = z || 0;
    };
    
    // Request permission on iOS
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permission: string) => {
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        });
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }
    
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [challengeType, shakeRequired, onComplete]);
  
  // Memory sequence display
  useEffect(() => {
    if (challengeType !== 'memory' || !showingSequence) return;
    
    const interval = setInterval(() => {
      setCurrentShowIndex(prev => {
        if (prev >= memorySequence.length - 1) {
          setShowingSequence(false);
          return 0;
        }
        return prev + 1;
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, [challengeType, showingSequence, memorySequence.length]);
  
  // Pattern display
  useEffect(() => {
    if (challengeType !== 'pattern' || !showingPattern) return;
    
    const interval = setInterval(() => {
      setCurrentPatternIndex(prev => {
        if (prev >= patternData.pattern.length - 1) {
          setShowingPattern(false);
          return 0;
        }
        return prev + 1;
      });
    }, 600);
    
    return () => clearInterval(interval);
  }, [challengeType, showingPattern, patternData.pattern.length]);
  
  // Timer countdown
  useEffect(() => {
    if (challengeType !== 'math') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onFail) onFail();
          // Reset with new problem
          setMathProblem(generateMathProblem(difficulty));
          setUserAnswer("");
          setAttempts(0);
          return difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [challengeType, difficulty, mathProblem, onFail]);
  
  const handleMathSubmit = () => {
    const answer = parseInt(userAnswer);
    if (answer === mathProblem.answer) {
      setIsCorrect(true);
      setTimeout(onComplete, 500);
    } else {
      setIsCorrect(false);
      setAttempts(prev => prev + 1);
      setUserAnswer("");
      if (attempts >= 2) {
        // After 3 wrong attempts, generate new problem
        setMathProblem(generateMathProblem(difficulty));
        setAttempts(0);
        setTimeLeft(difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15);
      }
    }
  };
  
  const handleMemoryInput = (num: number) => {
    const newSequence = [...userSequence, num];
    setUserSequence(newSequence);
    
    // Check if correct so far
    if (num !== memorySequence[userSequence.length]) {
      setIsCorrect(false);
      setTimeout(() => {
        setUserSequence([]);
        setIsCorrect(null);
        setShowingSequence(true);
        setMemorySequence(generateMemorySequence(difficulty));
      }, 1000);
      return;
    }
    
    // Check if complete
    if (newSequence.length === memorySequence.length) {
      setIsCorrect(true);
      setTimeout(onComplete, 500);
    }
  };
  
  const handleTypingSubmit = () => {
    if (typedText.toLowerCase() === typingWord.toLowerCase()) {
      setIsCorrect(true);
      setTimeout(onComplete, 500);
    } else {
      setIsCorrect(false);
      setTypedText("");
      setTimeout(() => setIsCorrect(null), 500);
    }
  };
  
  const handlePatternClick = (cellIndex: number) => {
    const newPattern = [...userPattern, cellIndex];
    setUserPattern(newPattern);
    
    // Check if correct so far
    if (cellIndex !== patternData.pattern[userPattern.length]) {
      setIsCorrect(false);
      setTimeout(() => {
        setUserPattern([]);
        setIsCorrect(null);
        setShowingPattern(true);
        setPatternData(generatePattern(difficulty));
      }, 1000);
      return;
    }
    
    // Check if complete
    if (newPattern.length === patternData.pattern.length) {
      setIsCorrect(true);
      setTimeout(onComplete, 500);
    }
  };
  
  // Manual shake simulation for desktop
  const handleManualShake = () => {
    setShakeCount(prev => {
      const newCount = prev + 1;
      if (newCount >= shakeRequired) {
        setTimeout(onComplete, 300);
      }
      return newCount;
    });
  };
  
  const getChallengeIcon = () => {
    switch (challengeType) {
      case 'math': return <Calculator className="h-6 w-6" />;
      case 'shake': return <Smartphone className="h-6 w-6" />;
      case 'typing': return <Type className="h-6 w-6" />;
      case 'memory': return <Brain className="h-6 w-6" />;
      case 'pattern': return <Puzzle className="h-6 w-6" />;
      default: return <Timer className="h-6 w-6" />;
    }
  };
  
  const getChallengeTitle = () => {
    switch (challengeType) {
      case 'math': return 'Solve the Problem';
      case 'shake': return 'Shake to Dismiss';
      case 'typing': return 'Type the Word';
      case 'memory': return 'Remember the Sequence';
      case 'pattern': return 'Repeat the Pattern';
      default: return 'Complete the Challenge';
    }
  };

  return (
    <Card className="p-6 bg-white/95 backdrop-blur-lg shadow-2xl border-0 rounded-3xl max-w-md w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${
          isCorrect === true ? 'bg-green-500' : 
          isCorrect === false ? 'bg-red-500' : 
          'bg-gradient-to-br from-orange-400 to-amber-500'
        } text-white transition-colors`}>
          {isCorrect === true ? <CheckCircle className="h-6 w-6" /> :
           isCorrect === false ? <XCircle className="h-6 w-6" /> :
           getChallengeIcon()}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">{getChallengeTitle()}</h3>
          <p className="text-sm text-gray-500 capitalize">{difficulty} difficulty</p>
        </div>
      </div>
      
      {/* Challenge Content */}
      {challengeType === 'math' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Time left</span>
            <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
              {timeLeft}s
            </span>
          </div>
          <Progress value={(timeLeft / (difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15)) * 100} className="h-2" />
          
          <div className="text-center py-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
            <p className="text-4xl font-bold text-gray-800 mb-2">{mathProblem.problem} = ?</p>
            {attempts > 0 && (
              <p className="text-sm text-red-500">Wrong! Try again ({3 - attempts} attempts left)</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMathSubmit()}
              placeholder="Your answer"
              className="text-center text-xl font-bold"
              autoFocus
            />
            <Button onClick={handleMathSubmit} className="bg-orange-500 hover:bg-orange-600">
              Submit
            </Button>
          </div>
        </div>
      )}
      
      {challengeType === 'shake' && (
        <div className="space-y-4 text-center">
          <div className="py-8">
            <div className={`inline-block p-6 rounded-full ${
              shakeCount >= shakeRequired ? 'bg-green-500' : 'bg-gradient-to-br from-orange-400 to-amber-500'
            } transition-colors animate-pulse`}>
              <Smartphone className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <Progress value={(shakeCount / shakeRequired) * 100} className="h-3" />
          
          <p className="text-lg font-bold text-gray-800">
            {shakeCount} / {shakeRequired} shakes
          </p>
          <p className="text-sm text-gray-500">Shake your phone vigorously!</p>
          
          {/* Desktop fallback - tap button */}
          <Button 
            onClick={handleManualShake}
            className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white py-6"
          >
            <RotateCcw className="h-5 w-5 mr-2 animate-spin" />
            Tap Rapidly (Desktop Mode)
          </Button>
        </div>
      )}
      
      {challengeType === 'typing' && (
        <div className="space-y-4">
          <div className="text-center py-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
            <p className="text-sm text-gray-500 mb-2">Type this word:</p>
            <p className="text-3xl font-bold text-gray-800 tracking-wide uppercase">{typingWord}</p>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTypingSubmit()}
              placeholder="Type here..."
              className={`text-center text-xl font-mono ${
                isCorrect === false ? 'border-red-500 bg-red-50' : ''
              }`}
              autoFocus
            />
            <Button onClick={handleTypingSubmit} className="bg-orange-500 hover:bg-orange-600">
              Submit
            </Button>
          </div>
        </div>
      )}
      
      {challengeType === 'memory' && (
        <div className="space-y-4">
          {showingSequence ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">Remember this sequence:</p>
              <div className="inline-block p-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl">
                <span className="text-5xl font-bold text-white">
                  {memorySequence[currentShowIndex]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {currentShowIndex + 1} of {memorySequence.length}
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-gray-500 mb-4">
                Enter the sequence ({userSequence.length}/{memorySequence.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <Button
                    key={num}
                    onClick={() => handleMemoryInput(num)}
                    className="h-14 text-xl font-bold bg-gray-100 hover:bg-orange-100 text-gray-800"
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <div className="flex justify-center gap-1 mt-4">
                {memorySequence.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < userSequence.length ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {challengeType === 'pattern' && (
        <div className="space-y-4">
          {showingPattern ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Watch the pattern:</p>
              <div className={`grid gap-2 mx-auto`} style={{ 
                gridTemplateColumns: `repeat(${patternData.gridSize}, minmax(0, 1fr))`,
                maxWidth: patternData.gridSize * 50 + 'px'
              }}>
                {Array.from({ length: patternData.gridSize * patternData.gridSize }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg transition-all duration-200 ${
                      patternData.pattern[currentPatternIndex] === i
                        ? 'bg-orange-500 scale-110'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {currentPatternIndex + 1} of {patternData.pattern.length}
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-gray-500 mb-4">
                Tap the cells in order ({userPattern.length}/{patternData.pattern.length})
              </p>
              <div className={`grid gap-2 mx-auto`} style={{ 
                gridTemplateColumns: `repeat(${patternData.gridSize}, minmax(0, 1fr))`,
                maxWidth: patternData.gridSize * 50 + 'px'
              }}>
                {Array.from({ length: patternData.gridSize * patternData.gridSize }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePatternClick(i)}
                    className={`aspect-square rounded-lg transition-all duration-150 ${
                      userPattern.includes(i)
                        ? 'bg-orange-500'
                        : 'bg-gray-200 hover:bg-gray-300 active:scale-95'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {challengeType === 'none' && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No challenge required</p>
          <Button onClick={onComplete} className="bg-orange-500 hover:bg-orange-600">
            Dismiss Alarm
          </Button>
        </div>
      )}
    </Card>
  );
};