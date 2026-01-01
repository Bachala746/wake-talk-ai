import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Phone, PhoneOff, Volume2, Heart, Sun } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCallProps {
  alarmTime: string;
  talkDuration: number;
  onEndCall: () => void;
}

export const VoiceCall = ({ alarmTime, talkDuration, onEndCall }: VoiceCallProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [snoozedCount, setSnoozedCount] = useState(0);
  const [isRingtonePhase, setIsRingtonePhase] = useState(true);
  const shouldContinueSpeaking = useRef(true);
  const elapsedTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef(0);
  const isSpeechActiveRef = useRef(false);
  const intentionallyCanceledRef = useRef(false);
  const usedMessageIndicesRef = useRef<Set<number>>(new Set());
  const hasGreetedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const greetingMessage = "Good morning! Rise and shine, champion! Today is a brand new day full of endless possibilities. You have the power within you to make it absolutely amazing!";

  const motivationalMessages = [
    "You've been given another precious day to chase your dreams and make a real difference in the world. Make it count!",
    "Remember, every sunrise brings new opportunities and fresh beginnings. You've got this, and I truly believe in you!",
    "Today is your canvas, a blank page waiting for your unique touch. Paint it with beautiful moments and positive energy!",
    "The world is eagerly waiting for your unique gifts and incredible talents. Let's make today truly extraordinary together!",
    "You have overcome so many challenges before, and you will absolutely conquer today too. Your strength is inspiring!",
    "You are capable of incredible, amazing things. Trust yourself completely and let your brilliant light shine bright!",
    "Each new day is a fresh start, a brand new chapter in your incredible story. Write something beautiful today!",
    "You woke up today with a purpose. Every breath is a gift, every moment is an opportunity waiting to be seized!",
    "Today, you have 24 brand new hours of pure potential ahead of you. Make every single one of them count!",
    "Your thoughts are powerful, your actions matter, and your presence makes a real difference in this world!",
    "Simply by waking up today, you've already won. Seize this magnificent opportunity with both hands and run with it!",
    "Believe in yourself today. You have everything you need to succeed. Now go out there and show the world what you're made of!"
  ];

  const antiSnoozeMessages = [
    "Wait! Don't hit that snooze button! Those extra minutes won't make you feel better, but getting up NOW will set the tone for an incredible day!",
    "Hold on, champion! Snoozing is just borrowing time from your dreams. Get up now and you'll thank yourself later!",
    "Hey, I know the bed is cozy, but greatness never came from the snooze button! Your goals are waiting for you!",
    "Stop right there! Every time you snooze, you're telling yourself that sleep is more important than your dreams!",
    "The difference between successful people and everyone else? They don't snooze! You have it in you to be great!",
    "No no no! That snooze button is a trap! The best version of you is waiting on the other side of getting up!",
    "Think about it - would your future self thank you for those 5 extra minutes, or for starting the day strong?"
  ];

  const playRingtone = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const playRingtonePulse = () => {
        if (!audioContextRef.current || !isRingtonePhase) return;
        
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
        
        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.3);
      };
      
      playRingtonePulse();
      ringtoneIntervalRef.current = window.setInterval(playRingtonePulse, 1000);
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
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
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
      // First message: use the greeting
      messageToSpeak = greetingMessage;
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
    
    try {
      setIsPlaying(true);
      lastSpeechTimeRef.current = Date.now();
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: messageToSpeak }
      });
      
      if (error) {
        console.error("ElevenLabs API error:", error);
        throw error;
      }
      
      if (!data?.audioContent) {
        throw new Error("No audio content received");
      }
      
      if (intentionallyCanceledRef.current || !shouldContinueSpeaking.current) {
        isSpeechActiveRef.current = false;
        setIsPlaying(false);
        return;
      }
      
      // Convert base64 to audio and play
      const audioData = atob(data.audioContent);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        console.log("ElevenLabs audio ended");
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        isSpeechActiveRef.current = false;
        currentAudioRef.current = null;
        
        if (shouldContinueSpeaking.current && !intentionallyCanceledRef.current && elapsedTimeRef.current < (talkDuration * 60) - 3) {
          speechTimeoutRef.current = window.setTimeout(() => {
            speakMessage();
          }, 500);
        }
      };
      
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        isSpeechActiveRef.current = false;
        currentAudioRef.current = null;
        
        if (!intentionallyCanceledRef.current && shouldContinueSpeaking.current) {
          speechTimeoutRef.current = window.setTimeout(() => {
            speakMessage();
          }, 1000);
        }
      };
      
      await audio.play();
      console.log("ElevenLabs audio playing");
      
    } catch (error) {
      console.error("Speech error:", error);
      setIsPlaying(false);
      isSpeechActiveRef.current = false;
      
      if (!intentionallyCanceledRef.current && shouldContinueSpeaking.current) {
        speechTimeoutRef.current = window.setTimeout(() => {
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

  const handleSnooze = () => {
    console.log("Snooze pressed");
    
    intentionallyCanceledRef.current = true;
    isSpeechActiveRef.current = false;
    
    if (isRingtonePhase) {
      stopRingtone();
      setIsRingtonePhase(false);
    }
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    stopCurrentAudio();
    
    setIsPlaying(false);
    setSnoozedCount(prev => prev + 1);
    const snoozeMessage = antiSnoozeMessages[Math.floor(Math.random() * antiSnoozeMessages.length)];
    setCurrentMessage(snoozeMessage);
    
    toast.warning(`Snooze attempt #${snoozedCount + 1} - Listen to this!`);
    
    setTimeout(() => {
      if (!shouldContinueSpeaking.current) return;
      intentionallyCanceledRef.current = false;
      speakMessage(snoozeMessage);
    }, 500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (elapsedTime / (talkDuration * 60)) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated sunrise background */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300">
        {/* Sun rays animation */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-32 rounded-full bg-yellow-200 animate-pulse shadow-2xl" 
               style={{ boxShadow: '0 0 100px 50px rgba(255, 200, 100, 0.6)' }} />
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-md p-8 bg-white/90 backdrop-blur-lg shadow-2xl border-0 rounded-3xl">
        <div className="text-center space-y-6">
          {/* Header with speaking animation */}
          <div className="flex flex-col items-center gap-4">
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
              <div className={`relative p-4 rounded-full transition-all duration-300 ${
                isPlaying 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 animate-speaking-glow' 
                  : 'bg-gradient-to-br from-orange-400 to-amber-500 animate-pulse'
              }`}>
                <Phone className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-800">AI Motivator</h2>
              <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                {isConnected ? (
                  <>
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-green-400'} animate-pulse`} />
                    Connected • ElevenLabs Voice
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Connecting...
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
            <div className="text-4xl font-mono font-bold text-gray-800">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-sm text-gray-700 font-medium">Time remaining: {formatTime((talkDuration * 60) - elapsedTime)}</p>
            <Progress value={progress} className="h-2 bg-gray-200" />
          </div>

          {/* Status indicators */}
          <div className="flex justify-center gap-4">
            {isRingtonePhase && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Ringtone</span>
              </div>
            )}
            {isPlaying && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 animate-pulse">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Speaking</span>
              </div>
            )}
          </div>

          {/* Current message with animation */}
          <div className={`p-4 rounded-2xl transition-all duration-500 ${
            isPlaying 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg' 
              : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200'
          }`}>
            <p className={`italic leading-relaxed transition-colors duration-300 ${
              isPlaying ? 'text-green-800' : 'text-gray-700'
            }`}>
              "{currentMessage || "Preparing your morning motivation..."}"
            </p>
          </div>

          {/* Snooze counter */}
          {snoozedCount > 0 && (
            <p className="text-sm text-orange-600 font-medium">
              Snooze attempts: {snoozedCount} - Stay strong! 💪
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleSnooze}
              className="flex-1 py-6 text-orange-600 border-orange-300 hover:bg-orange-50 rounded-xl"
              disabled={!isConnected}
            >
              <Sun className="w-5 h-5 mr-2" />
              Snooze
            </Button>
            <Button
              variant="destructive"
              onClick={handleManualEndCall}
              className="flex-1 py-6 bg-red-500 hover:bg-red-600 rounded-xl"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
