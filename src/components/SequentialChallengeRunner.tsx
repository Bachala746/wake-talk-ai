import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { CheckCircle, Lock, AlertTriangle, Zap } from "lucide-react";
import {
  ChallengeSequenceItem,
  SequentialChallengeSettings,
  ChallengeDifficulty,
  challengeTypes,
  getCategoryForChallenge,
  defaultSpeakMatchSettings,
  defaultObjectVerifySettings,
  MindChallengeConfig,
} from "@/lib/alarmSettings";
import { playChallengeCompleteSound, playMilestoneSound, playEscalationAlarm, playAggressiveVoiceMessage } from "@/lib/soundEffects";
import { speakWithElevenLabs, cancelSpeech } from "@/lib/elevenLabsAudio";

const STORAGE_KEY = "sequential_challenge_progress";

interface PersistedProgress {
  currentIndex: number;
  completedIndices: number[];
  totalFailures: number;
  extraChallengesAdded: number;
  timestamp: number;
}

function saveProgress(progress: PersistedProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

function loadProgress(): PersistedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedProgress;
    // Stale after 24 hours
    if (Date.now() - p.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

function getEscalatedDifficulty(base: ChallengeDifficulty, level: number): ChallengeDifficulty {
  const levels: ChallengeDifficulty[] = ['easy', 'medium', 'hard'];
  const idx = levels.indexOf(base);
  return levels[Math.min(idx + level, levels.length - 1)];
}

interface SequentialChallengeRunnerProps {
  settings: SequentialChallengeSettings;
  // Fallback settings from alarm for challenges that need them
  globalSpeakMatchSettings?: any;
  globalRegisteredQrCode?: string;
  globalObjectVerifySettings?: any;
  globalMathSettings?: any;
  globalTypingSettings?: MindChallengeConfig;
  globalMemorySettings?: MindChallengeConfig;
  globalPatternSettings?: MindChallengeConfig;
  globalSliderSettings?: MindChallengeConfig;
  globalCaptchaSettings?: MindChallengeConfig;
  onAllComplete: () => void;
  onFail?: () => void;
  onEscalate?: (level: number) => void;
  isAlarmActive?: boolean;
}

export const SequentialChallengeRunner = ({
  settings,
  globalSpeakMatchSettings,
  globalRegisteredQrCode,
  globalObjectVerifySettings,
  onAllComplete,
  onFail,
  onEscalate,
  isAlarmActive = true,
}: SequentialChallengeRunnerProps) => {
  const { isDark } = useTheme();

  // Build full challenge list (including potential extra challenges)
  const [challenges, setChallenges] = useState<ChallengeSequenceItem[]>(() => settings.challenges);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [totalFailures, setTotalFailures] = useState(0);
  const [extraChallengesAdded, setExtraChallengesAdded] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState<string>("");

  // Generate AI voice encouragement message based on progress
  const generateEncouragementMessage = useCallback((completedCount: number, totalCount: number): string => {
    const remaining = totalCount - completedCount;
    
    if (remaining === 0) {
      return "Amazing work! You've completed all challenges! Time to wake up and conquer your day!";
    }
    
    const messages = {
      // High energy messages for the beginning
      early: [
        "Great start! You've got this!",
        "Excellent work! Keep that momentum going!",
        "Awesome! You're waking up strong!",
        "Fantastic! The day is yours for the taking!"
      ],
      // Mid-challenge messages
      mid: [
        `Great job! ${remaining} more challenge${remaining > 1 ? 's' : ''} to go!`,
        `Well done! Only ${remaining} left! You're doing amazing!`,
        `Excellent! ${remaining} more to conquer your morning!`,
        `Keep it up! Just ${remaining} challenge${remaining > 1 ? 's' : ''} remaining!`
      ],
      // Final push messages
      final: [
        "Almost there! One final challenge to wake up completely!",
        "You're so close! Last one - give it your all!",
        "One more challenge and you're fully awake! You can do this!",
        "Final stretch! Complete this and embrace your morning!"
      ],
      // Multiple failures - encouragement to keep trying
      comeback: [
        "Don't give up! You've got this!",
        "Keep pushing! Every attempt makes you stronger!",
        "Stay determined! You're closer than you think!",
        "Believe in yourself! Success is just ahead!"
      ]
    };
    
    // Select category based on progress
    let category: keyof typeof messages = 'mid';
    if (totalFailures > 2) {
      category = 'comeback';
    } else if (completedCount === 0) {
      category = 'early';
    } else if (remaining === 1) {
      category = 'final';
    } else if (completedCount <= Math.ceil(totalCount * 0.3)) {
      category = 'early';
    }
    
    const categoryMessages = messages[category];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }, [totalFailures]);

  // Load persisted progress on mount
  useEffect(() => {
    const saved = loadProgress();
    if (saved && saved.currentIndex < challenges.length) {
      setCurrentIndex(saved.currentIndex);
      setCompletedIndices(saved.completedIndices);
      setTotalFailures(saved.totalFailures);
      setExtraChallengesAdded(saved.extraChallengesAdded);
    }
    
    // Cleanup speech on unmount
    return () => {
      cancelSpeech();
    };
  }, []);

  // Persist progress on change
  useEffect(() => {
    saveProgress({
      currentIndex,
      completedIndices,
      totalFailures,
      extraChallengesAdded,
      timestamp: Date.now(),
    });
  }, [currentIndex, completedIndices, totalFailures, extraChallengesAdded]);

  const currentChallenge = challenges[currentIndex];

  const getDifficultyForIndex = useCallback((item: ChallengeSequenceItem, idx: number): ChallengeDifficulty => {
    let diff = item.difficulty;
    if (settings.dynamicDifficulty) {
      // Later challenges get harder
      const escalation = Math.floor(idx / 2);
      diff = getEscalatedDifficulty(diff, escalation);
    }
    return diff;
  }, [settings.dynamicDifficulty]);

  const handleChallengeComplete = useCallback(() => {
    const newCompleted = [...completedIndices, currentIndex];
    setCompletedIndices(newCompleted);

    if (currentIndex < challenges.length - 1) {
      // More challenges remaining
      playMilestoneSound();
      
      // Generate and speak encouragement message (if enabled)
      if (settings.voiceEncouragementEnabled !== false) {
        const message = generateEncouragementMessage(newCompleted.length, challenges.length);
        setEncouragementMessage(message);
        
        // Play AI voice encouragement
        speakWithElevenLabs(message, 'gentle', 
          () => console.log('Playing encouragement:', message),
          () => console.log('Encouragement finished')
        );
      }
      
      setShowTransition(true);
      setTimeout(() => {
        setShowTransition(false);
        setEncouragementMessage("");
        setCurrentIndex(currentIndex + 1);
      }, settings.voiceEncouragementEnabled !== false ? 2500 : 1500); // Longer when voice plays
    } else {
      // All done! Play final victory message (if enabled)
      if (settings.voiceEncouragementEnabled !== false) {
        const victoryMessage = "Congratulations! You've completed all challenges and are fully awake. Have an amazing day!";
        speakWithElevenLabs(victoryMessage, 'gentle');
      }
      
      playChallengeCompleteSound();
      clearProgress();
      onAllComplete();
    }
  }, [currentIndex, completedIndices, challenges.length, onAllComplete, generateEncouragementMessage, settings.voiceEncouragementEnabled]);

  const handleChallengeFail = useCallback(() => {
    const newFailures = totalFailures + 1;
    setTotalFailures(newFailures);

    // Add extra challenge after 3+ failures if allowed
    if (newFailures >= 3 && extraChallengesAdded < settings.maxExtraChallenges) {
      // Pick a random challenge type that's different from current
      const availableTypes = settings.challenges
        .map(c => c.type)
        .filter(t => t !== currentChallenge.type && t !== 'none');
      if (availableTypes.length > 0) {
        const extraType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const extraChallenge: ChallengeSequenceItem = {
          type: extraType,
          difficulty: 'hard',
        };
        setChallenges(prev => [...prev, extraChallenge]);
        setExtraChallengesAdded(prev => prev + 1);
        playEscalationAlarm(1);
        playAggressiveVoiceMessage(newFailures);
      }
    }

    if (settings.failureRetryBehavior === 'restart' && currentIndex > 0) {
      // Restart from beginning
      setCurrentIndex(0);
      setCompletedIndices([]);
      playEscalationAlarm(2);
    }
    // 'continue' behavior: WakeUpChallenge handles retry internally

    if (onFail) onFail();
  }, [totalFailures, extraChallengesAdded, settings, currentChallenge, currentIndex, onFail]);

  const handleEscalate = useCallback((level: number) => {
    if (onEscalate) onEscalate(level);
  }, [onEscalate]);

  if (!currentChallenge) {
    clearProgress();
    onAllComplete();
    return null;
  }

  const progressPercent = challenges.length > 0 ? (completedIndices.length / challenges.length) * 100 : 0;
  const challengeInfo = challengeTypes.find(c => c.value === currentChallenge.type);

  // Transition screen between challenges
  if (showTransition) {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <Card className={`p-8 backdrop-blur-md border shadow-glass rounded-2xl ${
          isDark ? 'bg-slate-800/80 border-slate-600/30' : 'bg-white/80 border-white/60'
        }`}>
          <div className="space-y-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${
              isDark ? 'bg-green-500/20' : 'bg-green-50'
            }`}>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Challenge Complete!</h3>
            
            {/* AI Voice Encouragement Message */}
            {encouragementMessage && (
              <div className={`p-4 rounded-xl ${
                isDark ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/10'
              }`}>
                <p className="text-sm text-muted-foreground italic">
                  "{encouragementMessage}"
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="text-xs text-primary font-medium">AI Voice</span>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-muted-foreground text-sm">
              {completedIndices.length} of {challenges.length} completed
            </p>
            <Progress value={progressPercent} className="h-3 rounded-full" />
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              Next: {challengeTypes.find(c => c.value === challenges[currentIndex + 1]?.type)?.label || 'Final'}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Progress Header */}
      <Card className={`p-3 sm:p-4 backdrop-blur-md border shadow-glass rounded-2xl ${
        isDark ? 'bg-slate-800/70 border-slate-600/30' : 'bg-white/70 border-white/60'
      }`}>
        <div className="space-y-3">
          {/* Step indicator */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                {currentIndex + 1} / {challenges.length}
              </span>
              {challengeInfo && (
                <span className="text-base shrink-0">{challengeInfo.icon}</span>
              )}
              {(() => {
                const cat = getCategoryForChallenge(currentChallenge.type);
                if (!cat) return null;
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold truncate">
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </span>
                );
              })()}
            </div>
            {totalFailures > 0 && (
              <div className="flex items-center gap-1 text-xs text-destructive font-medium shrink-0">
                <AlertTriangle className="h-3 w-3" />
                {totalFailures} fail{totalFailures !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <Progress value={progressPercent} className="h-2.5 rounded-full" />

          {/* Challenge steps dots */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {challenges.map((ch, idx) => {
              const info = challengeTypes.find(c => c.value === ch.type);
              const isCompleted = completedIndices.includes(idx);
              const isCurrent = idx === currentIndex;
              const isLocked = idx > currentIndex;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white shadow-md'
                      : isCurrent
                        ? `ring-2 ring-primary ring-offset-2 shadow-lg ${isDark ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'}`
                        : isLocked
                          ? `${isDark ? 'bg-slate-700 text-slate-500' : 'bg-muted text-muted-foreground'}`
                          : ''
                  }`}
                  title={`${info?.label || 'Challenge'} (${ch.difficulty})`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <span>{info?.icon || (idx + 1)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Current Challenge */}
      <WakeUpChallenge
        challengeType={currentChallenge.type}
        difficulty={getDifficultyForIndex(currentChallenge, currentIndex)}
        onComplete={handleChallengeComplete}
        onFail={handleChallengeFail}
        onEscalate={handleEscalate}
        speakMatchSettings={currentChallenge.speakMatchSettings || globalSpeakMatchSettings || defaultSpeakMatchSettings}
        registeredQrCode={currentChallenge.registeredQrCode || globalRegisteredQrCode}
        objectVerifySettings={currentChallenge.objectVerifySettings || globalObjectVerifySettings || defaultObjectVerifySettings}
        isAlarmActive={isAlarmActive}
      />
    </div>
  );
};