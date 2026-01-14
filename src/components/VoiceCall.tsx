import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Phone, PhoneOff, Volume2, Heart, Sun } from "lucide-react";
import { toast } from "sonner";
import {
  AlarmSettings,
  themeMessages,
  snoozeMessages,
  ringtoneStyles,
  defaultAlarmSettings,
} from "@/lib/alarmSettings";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { speakWithElevenLabs, cancelSpeech } from "@/lib/elevenLabsAudio";
interface VoiceCallProps {
  alarmTime: string;
  talkDuration: number;
  settings?: AlarmSettings;
  onEndCall: () => void;
}

export const VoiceCall = ({ alarmTime, talkDuration, settings = defaultAlarmSettings, onEndCall }: VoiceCallProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [snoozedCount, setSnoozedCount] = useState(0);
  const [isRingtonePhase, setIsRingtonePhase] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const shouldContinueSpeaking = useRef(true);
  const elapsedTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef(0);
  const isSpeechActiveRef = useRef(false);
  const intentionallyCanceledRef = useRef(false);
  const usedMessageIndicesRef = useRef<Set<number>>(new Set());
  const hasGreetedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneVolumeRef = useRef(0.1);

  // Get themed messages based on settings
  const themeContent = themeMessages[settings.messageTheme];
  
  const getGreetingMessage = () => {
    const { greetingStyle, userName, messageTheme } = settings;
    const baseGreeting = themeContent.greeting;
    
    if (greetingStyle === 'personalized' && userName) {
      // Replace generic greeting with personalized one
      const timeOfDay = new Date().getHours() < 12 ? 'morning' : 'day';
      return `Good ${timeOfDay}, ${userName}! ${baseGreeting.split('!').slice(1).join('!')}`;
    } else if (greetingStyle === 'formal') {
      return `Good morning. I hope you rested well. ${baseGreeting.split('!').slice(1).join('!')}`;
    }
    return baseGreeting;
  };

  const motivationalMessages = themeContent.messages;
  const antiSnoozeMessages = snoozeMessages[settings.snoozeLevel];

  const playRingtone = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const ringtoneConfig = ringtoneStyles.find(r => r.value === settings.ringtoneStyle) || ringtoneStyles[0];
      const maxVolume = (ringtoneConfig as any).volume || 0.6;
      
      const playRingtonePulse = () => {
        if (!audioContextRef.current || !isRingtonePhase) return;
        
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        oscillator.frequency.value = ringtoneConfig.frequency;
        oscillator.type = ringtoneConfig.type;
        
        // Gradual volume increase if enabled, using ringtone's max volume
        const volume = settings.gradualVolume 
          ? Math.min(ringtoneVolumeRef.current, maxVolume) 
          : maxVolume;
        gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.4);
        
        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.4);
        
        // Increase volume gradually toward max
        if (settings.gradualVolume && ringtoneVolumeRef.current < maxVolume) {
          ringtoneVolumeRef.current = Math.min(maxVolume, ringtoneVolumeRef.current + 0.08);
        }
      };
      
      playRingtonePulse();
      ringtoneIntervalRef.current = window.setInterval(playRingtonePulse, 800);
    } catch (error) {
      console.error("Error playing ringtone:", error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
      } catch (e) {
        console.log("Error stopping audio:", e);
      }
      currentAudioRef.current = null;
    }
    // Cancel speech synthesis
    cancelSpeech();
  };

  useEffect(() => {
    // Start speaking immediately - no delays
    setIsConnected(true);
    setIsPlaying(true);
    toast.success("AI Motivator connected! 🌅");
    playRingtone();
    speakMessage();

    return () => {
      stopRingtone();
      stopCurrentAudio();
    };
  }, []);

  useEffect(() => {
    if (isConnected && elapsedTime < talkDuration * 60) {
      const timer = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          elapsedTimeRef.current = newTime;
          
          if (newTime === 30 && isRingtonePhase) {
            console.log("Stopping ringtone, continuing motivation");
            setIsRingtonePhase(false);
            stopRingtone();
          }
          
          // Watchdog: If no speech in last 8 seconds and should be speaking, retry
          if (!isRingtonePhase && newTime > 35 && shouldContinueSpeaking.current) {
            const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
            if (timeSinceLastSpeech > 8000) {
              console.log("Watchdog: Forcing reset and restarting speech");
              isSpeechActiveRef.current = false;
              speakMessage();
            }
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (elapsedTime >= talkDuration * 60) {
      shouldContinueSpeaking.current = false;
      handleAutoEndCall();
    }
  }, [isConnected, elapsedTime, talkDuration, isRingtonePhase]);

  const speakMessage = async (customMessage?: string) => {
    if (!shouldContinueSpeaking.current) {
      console.log("Speech blocked - shouldContinueSpeaking is false");
      return;
    }
    
    if (isSpeechActiveRef.current) {
      console.log("Speech already active, skipping");
      return;
    }
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    isSpeechActiveRef.current = true;
    intentionallyCanceledRef.current = false;
    
    let messageToSpeak: string;
    
    if (customMessage) {
      messageToSpeak = customMessage;
    } else if (!hasGreetedRef.current) {
      // First message: use the themed greeting
      messageToSpeak = getGreetingMessage();
      hasGreetedRef.current = true;
    } else {
      // Get unused message index
      const availableIndices = motivationalMessages
        .map((_, i) => i)
        .filter(i => !usedMessageIndicesRef.current.has(i));
      
      // Reset if all messages used
      if (availableIndices.length === 0) {
        usedMessageIndicesRef.current.clear();
        availableIndices.push(...motivationalMessages.map((_, i) => i));
      }
      
      const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      usedMessageIndicesRef.current.add(randomIdx);
      messageToSpeak = motivationalMessages[randomIdx];
    }
    
    setCurrentMessage(messageToSpeak);
    console.log("Starting ElevenLabs speech:", messageToSpeak.substring(0, 30) + "...");
    console.log("Voice style:", settings.voiceStyle);
    
    try {
      setIsPlaying(true);
      lastSpeechTimeRef.current = Date.now();
      
      console.log("Using ElevenLabs TTS");
      
      await speakWithElevenLabs(
        messageToSpeak,
        settings.voiceStyle,
        () => {
          // onStart
          console.log("ElevenLabs speech started");
        },
        () => {
          // onEnd
          console.log("ElevenLabs speech ended");
          setIsPlaying(false);
          isSpeechActiveRef.current = false;
          
          if (shouldContinueSpeaking.current && !intentionallyCanceledRef.current && elapsedTimeRef.current < (talkDuration * 60) - 3) {
            speechTimeoutRef.current = setTimeout(() => {
              speakMessage();
            }, 500);
          }
        },
        (error) => {
          // onError
          console.error("ElevenLabs speech error:", error);
        }
      );
      
    } catch (error) {
      console.error("Speech error:", error);
      setIsPlaying(false);
      isSpeechActiveRef.current = false;
      
      if (!intentionallyCanceledRef.current && shouldContinueSpeaking.current) {
        speechTimeoutRef.current = setTimeout(() => {
          speakMessage();
        }, 1000);
      }
    }
  };

  const handleAutoEndCall = () => {
    console.log("Auto ending call");
    shouldContinueSpeaking.current = false;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    stopRingtone();
    stopCurrentAudio();
    setIsConnected(false);
    setIsPlaying(false);
    toast.success("Have an amazing day ahead! 🌟");
    setTimeout(() => {
      onEndCall();
    }, 2000);
  };

  const handleManualEndCall = () => {
    // If challenge is enabled and not completed, show challenge
    if (settings.challengeType && settings.challengeType !== 'none' && !showChallenge) {
      shouldContinueSpeaking.current = false;
      stopRingtone();
      stopCurrentAudio();
      setIsPlaying(false);
      setShowChallenge(true);
      toast.info("Complete the challenge to dismiss the alarm!");
      return;
    }
    
    console.log("Manual ending call");
    shouldContinueSpeaking.current = false;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    stopRingtone();
    stopCurrentAudio();
    setIsConnected(false);
    setIsPlaying(false);
    toast.info("Call ended. Have a great day!");
    onEndCall();
  };

  const handleChallengeComplete = () => {
    console.log("Challenge completed!");
    setShowChallenge(false);
    shouldContinueSpeaking.current = false;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    stopRingtone();
    stopCurrentAudio();
    setIsConnected(false);
    setIsPlaying(false);
    toast.success("Challenge completed! Have an amazing day! 🎉");
    onEndCall();
  };

  const handleChallengeFail = () => {
    toast.error("Wrong answer! Try again!");
  };

  const handleSnooze = () => {
    console.log("Snooze pressed");
    
    // Immediately stop all audio and speech
    intentionallyCanceledRef.current = true;
    isSpeechActiveRef.current = false;
    
    // Cancel any pending speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (isRingtonePhase) {
      stopRingtone();
      setIsRingtonePhase(false);
    }
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    // Stop current audio completely and wait for it to clear
    stopCurrentAudio();
    
    setIsPlaying(false);
    setSnoozedCount(prev => prev + 1);
    const snoozeMessage = antiSnoozeMessages[Math.floor(Math.random() * antiSnoozeMessages.length)];
    setCurrentMessage(snoozeMessage);
    
    toast.warning(`Snooze attempt #${snoozedCount + 1} - Listen to this!`);
    
    // Wait longer before starting new speech to ensure previous audio is fully stopped
    setTimeout(() => {
      if (!shouldContinueSpeaking.current) return;
      isSpeechActiveRef.current = false; // Reset speech lock
      intentionallyCanceledRef.current = false;
      speakMessage(snoozeMessage);
    }, 800);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (elapsedTime / (talkDuration * 60)) * 100;

  // Show challenge modal if active
  if (showChallenge) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300">
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 rounded-full bg-yellow-200 animate-pulse shadow-2xl" 
                 style={{ boxShadow: '0 0 100px 50px rgba(255, 200, 100, 0.6)' }} />
          </div>
        </div>
        <div className="relative z-10">
          <WakeUpChallenge
            challengeType={settings.challengeType}
            difficulty={settings.challengeDifficulty}
            onComplete={handleChallengeComplete}
            onFail={handleChallengeFail}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-3 sm:p-4">
      {/* Animated sunrise background */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300">
        {/* Sun rays animation */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-yellow-200 animate-pulse shadow-2xl" 
               style={{ boxShadow: '0 0 100px 50px rgba(255, 200, 100, 0.6)' }} />
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-md p-4 sm:p-8 bg-white/90 backdrop-blur-lg shadow-2xl border-0 rounded-2xl sm:rounded-3xl">
        <div className="text-center space-y-4 sm:space-y-6">
          {/* Header with speaking animation */}
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            {/* Animated speaker icon with sound waves */}
            <div className="relative">
              {/* Sound wave rings when speaking */}
              {isPlaying && (
                <>
                  <div className="absolute inset-0 rounded-full bg-green-400/30 animate-sound-wave" />
                  <div className="absolute inset-0 rounded-full bg-green-400/20 animate-sound-wave-delayed" />
                  <div className="absolute inset-0 rounded-full bg-green-400/10 animate-sound-wave-delayed-2" />
                </>
              )}
              <div className={`relative p-3 sm:p-4 rounded-full transition-all duration-300 ${
                isPlaying 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 animate-speaking-glow' 
                  : 'bg-gradient-to-br from-orange-400 to-amber-500 animate-pulse'
              }`}>
                <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">AI Motivator</h2>
              <p className="text-xs sm:text-sm text-gray-600 flex items-center justify-center gap-1">
                {isConnected ? (
                  <>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isPlaying ? 'bg-green-500' : 'bg-green-400'} animate-pulse`} />
                    <span className="truncate">Connected • {settings.voiceStyle.charAt(0).toUpperCase() + settings.voiceStyle.slice(1)} Voice</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shrink-0" />
                    <span>Connecting...</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Voice visualizer bars when speaking */}
          {isPlaying && (
            <div className="flex items-center justify-center gap-1 h-8">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-green-500 to-emerald-400 rounded-full animate-voice-bar"
                  style={{
                    height: '100%',
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.6 + Math.random() * 0.4}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Timer */}
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-gray-800">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-xs sm:text-sm text-gray-700 font-medium">Time remaining: {formatTime((talkDuration * 60) - elapsedTime)}</p>
            <Progress value={progress} className="h-2 bg-gray-200" />
          </div>

          {/* Status indicators */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {isRingtonePhase && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-100 text-orange-700">
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Ringtone</span>
              </div>
            )}
            {isPlaying && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-100 text-green-700 animate-pulse">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Speaking</span>
              </div>
            )}
          </div>

          {/* Current message with animation */}
          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 ${
            isPlaying 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg' 
              : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200'
          }`}>
            <p className={`italic leading-relaxed transition-colors duration-300 text-sm sm:text-base break-words ${
              isPlaying ? 'text-green-800' : 'text-gray-700'
            }`}>
              "{currentMessage || "Preparing your morning motivation..."}"
            </p>
          </div>

          {/* Snooze counter */}
          {snoozedCount > 0 && (
            <p className="text-xs sm:text-sm text-orange-600 font-medium">
              Snooze attempts: {snoozedCount} - Stay strong! 💪
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 sm:gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleSnooze}
              className="flex-1 py-5 sm:py-6 text-orange-600 border-orange-300 hover:bg-orange-50 rounded-xl text-sm sm:text-base"
              disabled={!isConnected}
            >
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" />
              <span>Snooze</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleManualEndCall}
              className="flex-1 py-5 sm:py-6 bg-red-500 hover:bg-red-600 rounded-xl text-sm sm:text-base"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" />
              <span>End Call</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
