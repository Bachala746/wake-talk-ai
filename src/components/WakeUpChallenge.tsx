import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Calculator, 
  Smartphone, 
  Type, 
  Brain, 
  Puzzle, 
  Timer,
  CheckCircle,
  XCircle,
  RotateCcw,
  SlidersHorizontal,
  Text,
  ScanBarcode,
  QrCode,
  Footprints,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Volume2
} from "lucide-react";
import { 
  ChallengeType, 
  SpeakMatchSettings, 
  defaultSpeakMatchSettings, 
  speakMatchParagraphs, 
  speakMatchAccuracyLevels,
  SpeakMatchParagraphType,
  SpeakMatchParagraphLength
} from "@/lib/alarmSettings";
import { Html5Qrcode } from "html5-qrcode";
import { useElevenLabsScribe } from "@/hooks/useElevenLabsScribe";
import { 
  playStepSound, 
  playChallengeCompleteSound, 
  playWrongSound, 
  playCorrectTapSound, 
  playShakeSound,
  playScanSuccessSound,
  playMilestoneSound,
  playPressureTickSound,
  playEscalationAlarm,
  playAggressiveVoiceMessage
} from "@/lib/soundEffects";

interface WakeUpChallengeProps {
  challengeType: ChallengeType;
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: () => void;
  onFail?: () => void;
  onEscalate?: (level: number) => void;
  speakMatchSettings?: SpeakMatchSettings;
  registeredQrCode?: string;
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

// Slider puzzle generator
const generateSliderTargets = (difficulty: 'easy' | 'medium' | 'hard') => {
  const count = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
  const targets: number[] = [];
  for (let i = 0; i < count; i++) {
    targets.push(Math.floor(Math.random() * 81) + 10); // 10-90
  }
  return targets;
};

// Captcha word generator
const generateCaptchaWord = (difficulty: 'easy' | 'medium' | 'hard') => {
  const easyWords = ["wake", "rise", "dawn", "sun", "day"];
  const mediumWords = ["morning", "sunrise", "awaken", "bright"];
  const hardWords = ["daybreak", "greeting", "champion", "sunrise"];
  
  const words = difficulty === 'easy' ? easyWords : difficulty === 'medium' ? mediumWords : hardWords;
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
};

// Speak & Match: word comparison utility
const compareWords = (displayed: string, spoken: string): { matchPercent: number; wordResults: { word: string; matched: boolean }[] } => {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);
  const displayedWords = normalize(displayed);
  const spokenWords = normalize(spoken);
  
  let matched = 0;
  const wordResults = displayedWords.map((word, i) => {
    // Check if the spoken words contain this word (in sequence, allowing skips)
    const found = spokenWords.some((sw, j) => {
      // Fuzzy: allow Levenshtein distance of 1 for words > 4 chars
      if (word === sw) return true;
      if (word.length > 4 && sw.length > 4) {
        let diff = 0;
        const longer = word.length > sw.length ? word : sw;
        const shorter = word.length > sw.length ? sw : word;
        for (let k = 0; k < longer.length; k++) {
          if (shorter[k] !== longer[k]) diff++;
        }
        return diff <= 1;
      }
      return false;
    });
    if (found) matched++;
    return { word, matched: found };
  });
  
  const matchPercent = displayedWords.length > 0 ? Math.round((matched / displayedWords.length) * 100) : 0;
  return { matchPercent, wordResults };
};

// Get a random paragraph for Speak & Match
const getRandomParagraph = (type: SpeakMatchParagraphType, length: SpeakMatchParagraphLength, customText: string): string => {
  if (type === 'custom' && customText.trim()) return customText;
  const paragraphs = speakMatchParagraphs[type]?.[length] || speakMatchParagraphs.motivational[length];
  const filtered = paragraphs.filter(p => p.trim().length > 0);
  if (filtered.length === 0) return speakMatchParagraphs.motivational[length][0];
  return filtered[Math.floor(Math.random() * filtered.length)];
};

export const WakeUpChallenge = ({ 
  challengeType, 
  difficulty, 
  onComplete, 
  onFail,
  onEscalate,
  speakMatchSettings,
  registeredQrCode
}: WakeUpChallengeProps) => {
  const { isDark } = useTheme();
  // State for different challenge types
  const [mathProblem, setMathProblem] = useState(() => generateMathProblem(difficulty));
  const [userAnswer, setUserAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [globalFailures, setGlobalFailures] = useState(0);
  const [redFlash, setRedFlash] = useState(false);
  
  // Universal escalation handler for all challenge types
  const handleWrongAttempt = useCallback(() => {
    setGlobalFailures(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        const escalationLevel = Math.min(Math.floor((newCount - 2) / 2), 3);
        playEscalationAlarm(escalationLevel);
        playAggressiveVoiceMessage(newCount);
        if (onEscalate) onEscalate(escalationLevel);
        // Trigger red flash
        setRedFlash(true);
        setTimeout(() => setRedFlash(false), 800);
      } else {
        playWrongSound();
      }
      return newCount;
    });
  }, [onEscalate]);
  
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
  
  // Slider challenge state
  const [sliderTargets] = useState(() => generateSliderTargets(difficulty));
  const [sliderValues, setSliderValues] = useState<number[]>(() => sliderTargets.map(() => 50));
  
  // Captcha challenge state
  const [captchaWord, setCaptchaWord] = useState(() => generateCaptchaWord(difficulty));
  const [captchaInput, setCaptchaInput] = useState("");
  
  // Barcode/QR code scanner state
  const [scannerReady, setScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [qrWrongAttempts, setQrWrongAttempts] = useState(0);
  const [qrWrongCode, setQrWrongCode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  
  // Steps counter state
  const [stepCount, setStepCount] = useState(0);
  const [stepsRequired] = useState(difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100);
  const [stepsPermissionGranted, setStepsPermissionGranted] = useState(false);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const stepThresholdRef = useRef(12);
  const lastStepTimeRef = useRef(0);
  
  // Timer for quick math
  const [timeLeft, setTimeLeft] = useState(difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15);
  
  // Speak & Match state
  const smSettings = speakMatchSettings || defaultSpeakMatchSettings;
  const [smParagraph, setSmParagraph] = useState(() => 
    getRandomParagraph(smSettings.paragraphType, smSettings.paragraphLength, smSettings.customText)
  );
  const [smTranscript, setSmTranscript] = useState('');
  const [smPartialTranscript, setSmPartialTranscript] = useState('');
  const [smWordResults, setSmWordResults] = useState<{ word: string; matched: boolean }[]>([]);
  const [smMatchPercent, setSmMatchPercent] = useState(0);
  const [smAttempts, setSmAttempts] = useState(0);
  const [smTimeLeft, setSmTimeLeft] = useState(smSettings.timeLimit);
  const [smIsListening, setSmIsListening] = useState(false);
  const [smCompleted, setSmCompleted] = useState(false);
  const [smEscalated, setSmEscalated] = useState(false);
  const pressureTickRef = useRef<number | null>(null);
  
  const scribe = useElevenLabsScribe({
    onPartialTranscript: (text) => {
      if (challengeType === 'speakMatch') {
        setSmPartialTranscript(text);
        // Real-time word tracking: update highlights as user speaks
        const fullText = smTranscript ? `${smTranscript} ${text}` : text;
        const { matchPercent, wordResults } = compareWords(smParagraph, fullText);
        setSmMatchPercent(matchPercent);
        setSmWordResults(wordResults);
      }
    },
    onFinalTranscript: (text) => {
      if (challengeType === 'speakMatch') {
        setSmTranscript(text);
        // Evaluate match with final transcript
        const { matchPercent, wordResults } = compareWords(smParagraph, text);
        setSmMatchPercent(matchPercent);
        setSmWordResults(wordResults);
      }
    },
    autoSubmitAfterSilence: 2000,
  });
  
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
          playShakeSound();
          if (newCount >= shakeRequired) {
            playChallengeCompleteSound();
            onComplete();
          } else if (newCount % 10 === 0) {
            playMilestoneSound();
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
  
  // Barcode/QR Scanner initialization
  useEffect(() => {
    if (challengeType !== 'barcode' && challengeType !== 'qrcode') return;
    
    const initScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // For QR code challenge with a registered code, validate the scanned code
            if (challengeType === 'qrcode' && registeredQrCode) {
              if (decodedText === registeredQrCode) {
                setScannedCode(decodedText);
                setIsCorrect(true);
                playScanSuccessSound();
                html5QrCode.stop().catch(console.error);
                setTimeout(() => {
                  playChallengeCompleteSound();
                  onComplete();
                }, 500);
              } else {
                // Wrong QR code
                setQrWrongCode(decodedText);
                setQrWrongAttempts(prev => prev + 1);
                handleWrongAttempt();
                // Brief pause before allowing next scan
              }
            } else {
              // Barcode or QR without registered code - any code works
              setScannedCode(decodedText);
              setIsCorrect(true);
              playScanSuccessSound();
              html5QrCode.stop().catch(console.error);
              setTimeout(() => {
                playChallengeCompleteSound();
                onComplete();
              }, 500);
            }
          },
          () => {
            // QR code not detected - ignore
          }
        );
        
        setScannerReady(true);
      } catch (err) {
        console.error("Scanner error:", err);
        setScannerError(
          err instanceof Error ? err.message : "Failed to start camera"
        );
      }
    };
    
    initScanner();
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [challengeType, onComplete, registeredQrCode]);
  
  // Step counter using accelerometer
  useEffect(() => {
    if (challengeType !== 'steps') return;
    
    const handleMotion = (event: DeviceMotionEvent) => {
      const { accelerationIncludingGravity } = event;
      if (!accelerationIncludingGravity) return;
      
      const { x, y, z } = accelerationIncludingGravity;
      const currentX = x || 0;
      const currentY = y || 0;
      const currentZ = z || 0;
      
      // Calculate magnitude of acceleration change
      const deltaX = currentX - lastAccelRef.current.x;
      const deltaY = currentY - lastAccelRef.current.y;
      const deltaZ = currentZ - lastAccelRef.current.z;
      const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
      
      const now = Date.now();
      
      // Detect step (with debouncing to prevent double counting)
      if (magnitude > stepThresholdRef.current && now - lastStepTimeRef.current > 300) {
        lastStepTimeRef.current = now;
        setStepCount(prev => {
          const newCount = prev + 1;
          playStepSound();
          if (newCount >= stepsRequired) {
            setIsCorrect(true);
            playChallengeCompleteSound();
            setTimeout(onComplete, 500);
          } else if (newCount % 10 === 0) {
            playMilestoneSound();
          }
          return newCount;
        });
      }
      
      lastAccelRef.current = { x: currentX, y: currentY, z: currentZ };
    };
    
    // Request permission on iOS
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permission: string) => {
          if (permission === 'granted') {
            setStepsPermissionGranted(true);
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      setStepsPermissionGranted(true);
      window.addEventListener('devicemotion', handleMotion);
    }
    
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [challengeType, stepsRequired, onComplete]);
  
  // Manual step simulation for desktop
  const handleManualStep = () => {
    setStepCount(prev => {
      const newCount = prev + 1;
      playStepSound();
      if (newCount >= stepsRequired) {
        setIsCorrect(true);
        playChallengeCompleteSound();
        setTimeout(onComplete, 300);
      } else if (newCount % 10 === 0) {
        playMilestoneSound();
      }
      return newCount;
    });
  };
  
  // Request step permission manually
  const requestStepPermission = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          setStepsPermissionGranted(true);
        }
      } catch (err) {
        console.error("Motion permission error:", err);
      }
    }
  };
  
  const handleMathSubmit = () => {
    const answer = parseInt(userAnswer);
    if (answer === mathProblem.answer) {
      setIsCorrect(true);
      playChallengeCompleteSound();
      setTimeout(onComplete, 500);
    } else {
      setIsCorrect(false);
      handleWrongAttempt();
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
      handleWrongAttempt();
      setTimeout(() => {
        setUserSequence([]);
        setIsCorrect(null);
        setShowingSequence(true);
        setMemorySequence(generateMemorySequence(difficulty));
      }, 1000);
      return;
    }
    
    playCorrectTapSound();
    
    // Check if complete
    if (newSequence.length === memorySequence.length) {
      setIsCorrect(true);
      playChallengeCompleteSound();
      setTimeout(onComplete, 500);
    }
  };
  
  const handleTypingSubmit = () => {
    if (typedText.toLowerCase() === typingWord.toLowerCase()) {
      setIsCorrect(true);
      playChallengeCompleteSound();
      setTimeout(onComplete, 500);
    } else {
      setIsCorrect(false);
      handleWrongAttempt();
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
      handleWrongAttempt();
      setTimeout(() => {
        setUserPattern([]);
        setIsCorrect(null);
        setShowingPattern(true);
        setPatternData(generatePattern(difficulty));
      }, 1000);
      return;
    }
    
    playCorrectTapSound();
    
    // Check if complete
    if (newPattern.length === patternData.pattern.length) {
      setIsCorrect(true);
      playChallengeCompleteSound();
      setTimeout(onComplete, 500);
    }
  };
  
  // Manual shake simulation for desktop
  const handleManualShake = () => {
    setShakeCount(prev => {
      const newCount = prev + 1;
      playShakeSound();
      if (newCount >= shakeRequired) {
        playChallengeCompleteSound();
        setTimeout(onComplete, 300);
      } else if (newCount % 10 === 0) {
        playMilestoneSound();
      }
      return newCount;
    });
  };
  
  // Slider challenge handlers
  const handleSliderChange = (index: number, value: number[]) => {
    const newValues = [...sliderValues];
    newValues[index] = value[0];
    setSliderValues(newValues);
    
    // Check if all sliders are within tolerance
    const tolerance = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 2;
    const allCorrect = sliderTargets.every((target, i) => 
      Math.abs(newValues[i] - target) <= tolerance
    );
    
    if (allCorrect) {
      setIsCorrect(true);
      playChallengeCompleteSound();
      setTimeout(onComplete, 500);
    }
  };
  
  // Captcha challenge handler
  const handleCaptchaSubmit = () => {
    if (captchaInput.toUpperCase() === captchaWord) {
      setIsCorrect(true);
      playChallengeCompleteSound();
      setTimeout(onComplete, 500);
    } else {
      setIsCorrect(false);
      handleWrongAttempt();
      setCaptchaInput("");
      setCaptchaWord(generateCaptchaWord(difficulty));
      setTimeout(() => setIsCorrect(null), 500);
    }
  };
  
  // Speak & Match timer
  useEffect(() => {
    if (challengeType !== 'speakMatch' || smCompleted) return;
    
    const timer = setInterval(() => {
      setSmTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up - count as failed attempt
          if (smIsListening) {
            scribe.stopListening();
            setSmIsListening(false);
          }
          handleSmTimeUp();
          return 0;
        }
        // Play pressure tick in last 10 seconds
        if (prev <= 11 && prev > 1) {
          playPressureTickSound();
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [challengeType, smCompleted, smIsListening]);
  
  const handleSmStart = async () => {
    const started = await scribe.startListening();
    if (started) {
      setSmIsListening(true);
      setSmTranscript('');
      setSmPartialTranscript('');
      setSmWordResults([]);
      setSmMatchPercent(0);
    }
  };
  
  const handleSmStop = () => {
    scribe.stopListening();
    setSmIsListening(false);
    
    // Evaluate final result
    const fullTranscript = smTranscript || smPartialTranscript;
    if (fullTranscript) {
      const { matchPercent, wordResults } = compareWords(smParagraph, fullTranscript);
      setSmMatchPercent(matchPercent);
      setSmWordResults(wordResults);
      setSmTranscript(fullTranscript);
      
      const threshold = speakMatchAccuracyLevels.find(l => l.value === smSettings.accuracy)?.threshold || 85;
      
      if (matchPercent >= threshold) {
        setSmCompleted(true);
        setIsCorrect(true);
        playChallengeCompleteSound();
        setTimeout(onComplete, 500);
      } else {
        setIsCorrect(false);
        handleWrongAttempt();
        handleSmRetry();
      }
    }
  };
  
  const handleSmRetry = () => {
    const newAttempts = smAttempts + 1;
    setSmAttempts(newAttempts);
    
    // Check retry limit (0 = unlimited)
    if (smSettings.retryLimit > 0 && newAttempts >= smSettings.retryLimit) {
      // Anti-snooze: escalate difficulty
      setSmEscalated(true);
      // Generate a longer paragraph
      const escalatedLength = smSettings.paragraphLength === 'short' ? 'medium' : 'long';
      setSmParagraph(getRandomParagraph(smSettings.paragraphType, escalatedLength, smSettings.customText));
      setSmAttempts(0); // Reset attempts with harder text
    }
    
    // Reset for next attempt
    setTimeout(() => {
      setIsCorrect(null);
      setSmTranscript('');
      setSmPartialTranscript('');
      setSmWordResults([]);
      setSmMatchPercent(0);
      setSmTimeLeft(smSettings.timeLimit);
    }, 1500);
  };
  
  const handleSmTimeUp = () => {
    setIsCorrect(false);
    handleWrongAttempt();
    handleSmRetry();
  };
  
  const getChallengeIcon = () => {
    switch (challengeType) {
      case 'math': return <Calculator className="h-6 w-6" />;
      case 'shake': return <Smartphone className="h-6 w-6" />;
      case 'typing': return <Type className="h-6 w-6" />;
      case 'memory': return <Brain className="h-6 w-6" />;
      case 'pattern': return <Puzzle className="h-6 w-6" />;
      case 'slider': return <SlidersHorizontal className="h-6 w-6" />;
      case 'captcha': return <Text className="h-6 w-6" />;
      case 'barcode': return <ScanBarcode className="h-6 w-6" />;
      case 'qrcode': return <QrCode className="h-6 w-6" />;
      case 'steps': return <Footprints className="h-6 w-6" />;
      case 'speakMatch': return <Mic className="h-6 w-6" />;
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
      case 'slider': return 'Match the Values';
      case 'captcha': return 'Read and Type';
      case 'barcode': return 'Scan Any Barcode';
      case 'qrcode': return registeredQrCode ? 'Scan Your QR Code' : 'Scan Any QR Code';
      case 'steps': return 'Walk to Dismiss';
      case 'speakMatch': return smEscalated ? '🔥 Speak & Match (Harder!)' : 'Speak & Match';
      default: return 'Complete the Challenge';
    }
  };

  return (
    <div className="relative max-w-md w-full mx-3 sm:mx-0">
      {/* Red screen flash overlay */}
      {redFlash && (
        <div className="fixed inset-0 z-[9999] pointer-events-none animate-[redFlash_0.8s_ease-out_forwards] bg-red-600/60" />
      )}
      {/* Persistent red vignette when escalated */}
      {globalFailures >= 3 && (
        <div className="fixed inset-0 z-[9998] pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(220, 38, 38, 0.25) 100%)',
          }}
        />
      )}
    <Card className={`p-4 sm:p-6 backdrop-blur-lg shadow-2xl border-0 rounded-2xl sm:rounded-3xl w-full ${
      isDark ? 'bg-slate-800/95' : 'bg-white/95'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${
          isCorrect === true ? 'bg-green-500' : 
          isCorrect === false ? 'bg-red-500' : 
          isDark ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 to-amber-500'
        } text-white transition-colors`}>
          {isCorrect === true ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" /> :
           isCorrect === false ? <XCircle className="h-5 w-5 sm:h-6 sm:w-6" /> :
           getChallengeIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{getChallengeTitle()}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground capitalize">{difficulty} difficulty</p>
        </div>
      </div>

      {/* Global escalation warning */}
      {globalFailures >= 3 && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 animate-pulse">
          <p className="text-sm font-bold text-destructive text-center">
            ⚠️ {globalFailures} failed attempts — Volume escalating! Complete the challenge NOW!
          </p>
        </div>
      )}
      
      {/* Challenge Content */}
      {challengeType === 'math' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-500">Time left</span>
            <span className={`text-xs sm:text-sm font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
              {timeLeft}s
            </span>
          </div>
          <Progress value={(timeLeft / (difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15)) * 100} className="h-2" />
          
          <div className="text-center py-4 sm:py-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl">
            <p className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 break-all px-2">{mathProblem.problem} = ?</p>
            {attempts > 0 && (
              <p className="text-xs sm:text-sm text-red-500">Wrong! Try again ({3 - attempts} left)</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMathSubmit()}
              placeholder="Your answer"
              className="text-center text-lg sm:text-xl font-bold flex-1 min-w-0"
              autoFocus
            />
            <Button onClick={handleMathSubmit} className="bg-orange-500 hover:bg-orange-600 shrink-0 px-4 sm:px-6">
              Submit
            </Button>
          </div>
        </div>
      )}
      
      {challengeType === 'shake' && (
        <div className="space-y-3 sm:space-y-4 text-center">
          <div className="py-6 sm:py-8">
            <div className={`inline-block p-4 sm:p-6 rounded-full ${
              shakeCount >= shakeRequired ? 'bg-green-500' : 'bg-gradient-to-br from-orange-400 to-amber-500'
            } transition-colors animate-pulse`}>
              <Smartphone className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          
          <Progress value={(shakeCount / shakeRequired) * 100} className="h-2.5 sm:h-3" />
          
          <p className="text-base sm:text-lg font-bold text-gray-800">
            {shakeCount} / {shakeRequired} shakes
          </p>
          <p className="text-xs sm:text-sm text-gray-500">Shake your phone vigorously!</p>
          
          {/* Desktop fallback - tap button */}
          <Button 
            onClick={handleManualShake}
            className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white py-5 sm:py-6 text-sm sm:text-base"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin shrink-0" />
            <span>Tap Rapidly (Desktop Mode)</span>
          </Button>
        </div>
      )}
      
      {challengeType === 'typing' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="text-center py-4 sm:py-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl">
            <p className="text-xs sm:text-sm text-gray-500 mb-2">Type this word:</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-800 tracking-wide uppercase break-all px-2">{typingWord}</p>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTypingSubmit()}
              placeholder="Type here..."
              className={`text-center text-lg sm:text-xl font-mono flex-1 min-w-0 ${
                isCorrect === false ? 'border-red-500 bg-red-50' : ''
              }`}
              autoFocus
            />
            <Button onClick={handleTypingSubmit} className="bg-orange-500 hover:bg-orange-600 shrink-0 px-4 sm:px-6">
              Submit
            </Button>
          </div>
        </div>
      )}
      
      {challengeType === 'memory' && (
        <div className="space-y-3 sm:space-y-4">
          {showingSequence ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Remember this sequence:</p>
              <div className="inline-block p-6 sm:p-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl sm:rounded-2xl">
                <span className="text-4xl sm:text-5xl font-bold text-white">
                  {memorySequence[currentShowIndex]}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                {currentShowIndex + 1} of {memorySequence.length}
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                Enter the sequence ({userSequence.length}/{memorySequence.length})
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <Button
                    key={num}
                    onClick={() => handleMemoryInput(num)}
                    className="h-12 sm:h-14 text-lg sm:text-xl font-bold bg-gray-100 hover:bg-orange-100 text-gray-800"
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <div className="flex justify-center gap-1 mt-3 sm:mt-4">
                {memorySequence.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
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
        <div className="space-y-3 sm:space-y-4">
          {showingPattern ? (
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Watch the pattern:</p>
              <div className={`grid gap-1.5 sm:gap-2 mx-auto`} style={{ 
                gridTemplateColumns: `repeat(${patternData.gridSize}, minmax(0, 1fr))`,
                maxWidth: Math.min(patternData.gridSize * 48, 240) + 'px'
              }}>
                {Array.from({ length: patternData.gridSize * patternData.gridSize }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-md sm:rounded-lg transition-all duration-200 ${
                      patternData.pattern[currentPatternIndex] === i
                        ? 'bg-orange-500 scale-110'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                {currentPatternIndex + 1} of {patternData.pattern.length}
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                Tap the cells in order ({userPattern.length}/{patternData.pattern.length})
              </p>
              <div className={`grid gap-1.5 sm:gap-2 mx-auto`} style={{ 
                gridTemplateColumns: `repeat(${patternData.gridSize}, minmax(0, 1fr))`,
                maxWidth: Math.min(patternData.gridSize * 48, 240) + 'px'
              }}>
                {Array.from({ length: patternData.gridSize * patternData.gridSize }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePatternClick(i)}
                    className={`aspect-square rounded-md sm:rounded-lg transition-all duration-150 ${
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
      
      {challengeType === 'slider' && (
        <div className="space-y-4 sm:space-y-6">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            Drag each slider to match the target (±{difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 2})
          </p>
          
          {sliderTargets.map((target, index) => {
            const tolerance = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 2;
            const isMatch = Math.abs(sliderValues[index] - target) <= tolerance;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Slider {index + 1}</span>
                  <span className={`font-bold ${isMatch ? 'text-green-500' : 'text-gray-700'}`}>
                    {sliderValues[index]} → {target}
                  </span>
                </div>
                <Slider
                  value={[sliderValues[index]]}
                  onValueChange={(value) => handleSliderChange(index, value)}
                  max={100}
                  min={0}
                  step={1}
                  className={isMatch ? '[&>span]:bg-green-500' : ''}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {challengeType === 'captcha' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="text-center py-4 sm:py-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl">
            <p className="text-xs sm:text-sm text-gray-500 mb-2">Type the word below:</p>
            <p 
              className="text-2xl sm:text-3xl font-bold tracking-[0.2em] sm:tracking-[0.3em] select-none px-2 break-all"
              style={{ 
                fontFamily: 'monospace',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                background: `linear-gradient(${Math.random() * 30 - 15}deg, #ea580c, #d97706)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transform: `skewX(${Math.random() * 10 - 5}deg) rotate(${Math.random() * 4 - 2}deg)`,
              }}
            >
              {captchaWord}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCaptchaSubmit()}
              placeholder="Type here..."
              className={`text-center text-lg sm:text-xl font-mono uppercase flex-1 min-w-0 ${
                isCorrect === false ? 'border-red-500 bg-red-50' : ''
              }`}
              autoFocus
            />
            <Button onClick={handleCaptchaSubmit} className="bg-orange-500 hover:bg-orange-600 shrink-0 px-4 sm:px-6">
              Submit
            </Button>
          </div>
        </div>
      )}
      
      {(challengeType === 'barcode' || challengeType === 'qrcode') && (
        <div className="space-y-3 sm:space-y-4">
          {scannerError ? (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-block p-4 sm:p-6 bg-red-100 rounded-full mb-4">
                <CameraOff className="h-8 w-8 sm:h-12 sm:w-12 text-red-500" />
              </div>
              <p className="text-sm sm:text-base text-red-600 font-medium mb-2">
                📷 Camera Access Required
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {scannerError}
              </p>
              <p className="text-xs text-red-500 mb-4 font-semibold animate-pulse">
                ⚠️ Camera is required to complete this challenge. The alarm will keep ringing.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Retry Camera Access
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  If blocked, open browser settings → Site Settings → Camera → Allow
                </p>
              </div>
            </div>
          ) : scannedCode ? (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-block p-4 sm:p-6 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
              </div>
              <p className="text-sm sm:text-base text-green-600 font-medium">
                {registeredQrCode ? 'Correct QR Code!' : 'Code Scanned!'}
              </p>
              <p className="text-xs text-muted-foreground mt-2 break-all px-4">{scannedCode.slice(0, 50)}...</p>
            </div>
          ) : (
            <>
              {/* Wrong QR code feedback */}
              {qrWrongCode && challengeType === 'qrcode' && registeredQrCode && (
                <div className={`text-center p-3 rounded-xl ${
                  isDark ? 'bg-red-900/40 border border-red-800/50' : 'bg-red-50 border border-red-200'
                }`}>
                  <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-red-500">Wrong QR Code!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Go find your registered QR code and scan it.
                  </p>
                  {qrWrongAttempts > 0 && (
                    <p className="text-xs text-red-400 mt-1 font-semibold">
                      {qrWrongAttempts} failed attempt{qrWrongAttempts !== 1 ? 's' : ''}
                      {qrWrongAttempts >= 3 && (
                        <span className="block text-red-500 mt-0.5 animate-pulse">
                          ⚠️ Volume escalating! Find your QR code NOW!
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}

              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {challengeType === 'barcode' 
                    ? 'Point your camera at any barcode' 
                    : registeredQrCode 
                      ? '📍 Go scan the QR code you registered!'
                      : 'Point your camera at any QR code'}
                </p>
              </div>
              
              <div 
                id="qr-reader" 
                ref={scannerContainerRef}
                className="w-full rounded-xl overflow-hidden bg-gray-900"
                style={{ minHeight: '250px' }}
              />
              
              {!scannerReady && (
                <div className="text-center">
                  <div className="inline-block animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">Initializing camera...</p>
                </div>
              )}
              
              <p className="text-center text-xs text-muted-foreground">
                {challengeType === 'barcode' 
                  ? 'Find any product with a barcode (food, books, etc.)' 
                  : registeredQrCode
                    ? 'Only your registered QR code will dismiss this alarm'
                    : 'Find any QR code to scan'}
              </p>
            </>
          )}
        </div>
      )}
      
      {challengeType === 'steps' && (
        <div className="space-y-3 sm:space-y-4 text-center">
          <div className="py-6 sm:py-8">
            <div className={`inline-block p-4 sm:p-6 rounded-full ${
              stepCount >= stepsRequired ? 'bg-green-500' : 'bg-gradient-to-br from-orange-400 to-amber-500'
            } transition-colors`}>
              <Footprints className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          
          <Progress value={(stepCount / stepsRequired) * 100} className="h-2.5 sm:h-3" />
          
          <p className="text-base sm:text-lg font-bold text-gray-800">
            {stepCount} / {stepsRequired} steps
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Walk around to count your steps!
          </p>
          
          {!stepsPermissionGranted && (
            <Button 
              onClick={requestStepPermission}
              className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white py-4"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Enable Motion Sensor
            </Button>
          )}
          
          {/* Desktop fallback - tap button */}
          <Button 
            onClick={handleManualStep}
            className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white py-5 sm:py-6 text-sm sm:text-base"
          >
            <Footprints className="h-4 w-4 sm:h-5 sm:w-5 mr-2 shrink-0" />
            <span>Tap to Simulate Steps (Desktop Mode)</span>
          </Button>
        </div>
      )}
      
      {challengeType === 'speakMatch' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Timer bar */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-sm text-muted-foreground">Time left</span>
            <span className={`text-xs sm:text-sm font-bold ${smTimeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
              {smTimeLeft}s
            </span>
          </div>
          <Progress 
            value={(smTimeLeft / smSettings.timeLimit) * 100} 
            className={`h-2 ${smTimeLeft <= 10 ? '[&>div]:bg-red-500' : ''}`} 
          />
          
          {/* Escalation warning */}
          {smEscalated && (
            <div className={`text-center text-xs font-bold py-1.5 rounded-lg ${
              isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-600'
            }`}>
              🔥 Difficulty increased! Read the new paragraph carefully.
            </div>
          )}
          
          {/* Paragraph to read */}
          <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl ${
            isDark ? 'bg-slate-700/50' : 'bg-gradient-to-br from-orange-50 to-amber-50'
          }`}>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5" />
              Read this aloud:
            </p>
            <p className="text-sm sm:text-base leading-relaxed">
              {smWordResults.length > 0 ? (
                smWordResults.map((wr, i) => (
                  <span 
                    key={i} 
                    className={`inline-block transition-all duration-300 mr-1 ${
                      wr.matched 
                        ? 'text-green-600 font-semibold scale-105' 
                        : smIsListening 
                          ? 'text-muted-foreground' 
                          : 'text-red-500 font-semibold underline decoration-wavy'
                    }`}
                    style={wr.matched ? { 
                      textShadow: '0 0 8px rgba(34, 197, 94, 0.3)',
                    } : undefined}
                  >
                    {wr.word}
                  </span>
                ))
              ) : (
                <span className="text-foreground">{smParagraph}</span>
              )}
            </p>
          </div>
          
          {/* Match percentage */}
          {smMatchPercent > 0 && (
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                smMatchPercent >= (speakMatchAccuracyLevels.find(l => l.value === smSettings.accuracy)?.threshold || 85)
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {smMatchPercent}% match
                {smMatchPercent >= (speakMatchAccuracyLevels.find(l => l.value === smSettings.accuracy)?.threshold || 85)
                  ? <CheckCircle className="h-4 w-4" />
                  : <XCircle className="h-4 w-4" />
                }
              </div>
            </div>
          )}
          
          {/* Live transcript */}
          {(smTranscript || smPartialTranscript) && (
            <div className={`p-3 rounded-lg text-xs sm:text-sm ${
              isDark ? 'bg-slate-600/50' : 'bg-gray-100'
            }`}>
              <p className="text-muted-foreground text-xs mb-1">Your speech:</p>
              <p className="text-foreground">
                {smTranscript}
                {smPartialTranscript && (
                  <span className="text-muted-foreground italic"> {smPartialTranscript}</span>
                )}
              </p>
            </div>
          )}
          
          {/* Attempt counter */}
          {smAttempts > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Attempt {smAttempts + 1}
              {smSettings.retryLimit > 0 ? ` of ${smSettings.retryLimit}` : ''}
            </p>
          )}
          
          {/* Control buttons */}
          <div className="flex gap-2">
            {!smIsListening ? (
              <Button 
                onClick={handleSmStart} 
                disabled={smCompleted || smTimeLeft <= 0}
                className={`flex-1 py-5 text-sm sm:text-base ${
                  isDark 
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                <Mic className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Start Speaking
              </Button>
            ) : (
              <Button 
                onClick={handleSmStop}
                className="flex-1 py-5 text-sm sm:text-base bg-red-500 hover:bg-red-600 text-white"
              >
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-pulse" />
                Stop & Check
              </Button>
            )}
          </div>
          
          {/* Accuracy requirement info */}
          <p className="text-center text-xs text-muted-foreground">
            Required accuracy: {speakMatchAccuracyLevels.find(l => l.value === smSettings.accuracy)?.label}
          </p>
        </div>
      )}
      
      {challengeType === 'none' && (
        <div className="text-center py-6 sm:py-8">
          <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No challenge required</p>
          <Button onClick={onComplete} className="bg-orange-500 hover:bg-orange-600 px-6 sm:px-8">
            Dismiss Alarm
          </Button>
        </div>
      )}
    </Card>
    </div>
  );
};