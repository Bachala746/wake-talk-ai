import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Phone, PhoneOff, Volume2, Heart, Sun } from "lucide-react";
import { toast } from "sonner";

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
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const motivationalMessages = [
    "Good morning, champion! Today is a brand new day full of endless possibilities. You have the power within you to make it absolutely amazing! Remember, every great achievement started with someone who decided to wake up and take action. That someone is you today!",
    "Rise and shine, beautiful soul! You've been given another precious day to chase your dreams and make a real difference in the world. Think about all the people whose lives you'll touch today, all the smiles you'll create, all the positive energy you'll spread!",
    "Hello there, superstar! Remember, every sunrise brings new opportunities and fresh beginnings. You've got this, and I truly believe in you! The universe has aligned perfectly for you to shine today. Your potential is limitless!",
    "Good morning, wonderful human! Today is your canvas, a blank page waiting for your unique touch. Paint it with beautiful moments, positive energy, and meaningful connections. You are the artist of your own life!",
    "Wake up, dreamer! The world is eagerly waiting for your unique gifts and incredible talents. Let's make today not just good, but truly extraordinary together! Your dreams are valid, and today is the perfect day to take one step closer to them!",
    "Rise up, warrior! You have overcome so many challenges before, and you will absolutely conquer today too. Your strength, resilience, and determination are truly inspiring! Today is another opportunity to prove to yourself just how powerful you really are!",
    "Good morning, sunshine! You are capable of incredible, amazing things that will blow your own mind! Trust yourself completely and let your brilliant light shine bright today. The world needs your unique energy and perspective!",
    "Hello, amazing soul! Each morning is a fresh start, a brand new chapter in your incredible story. Write a beautiful, inspiring story with your day today! Make it a chapter you'll be proud to look back on!",
    "Welcome to this glorious new day, champion! You woke up today with a purpose, with a mission. Even if you don't know exactly what it is yet, trust that you're exactly where you need to be. Every breath is a gift, every moment is an opportunity!",
    "Good morning, incredible human being! Today, you have 24 brand new hours, 1,440 minutes, 86,400 seconds of pure potential ahead of you. How will you use this precious gift? Make it count, make it meaningful, make it yours!",
    "Rise and conquer, unstoppable force! You have within you right now everything you need to make today successful. Your thoughts are powerful, your actions matter, and your presence makes a difference. Go out there and show the world what you're made of!",
    "Hello brilliant mind! Did you know that simply by waking up today, you've already won? You've been given another chance to learn, to grow, to love, to create. Don't waste this magnificent opportunity. Seize it with both hands and make magic happen!"
  ];

  const antiSnoozeMessages = [
    "Wait! Don't hit that snooze button! Those extra minutes won't make you feel better, but getting up NOW will set the tone for an incredible day!",
    "Hold on, champion! Snoozing is just borrowing time from your dreams. Get up now and you'll thank yourself later!",
    "Hey, I know the bed is cozy, but greatness never came from the snooze button! Your goals are waiting for you - let's go!",
    "Stop right there! Every time you snooze, you're telling yourself that sleep is more important than your dreams. Prove yourself wrong - get up NOW!",
    "Listen to me - the difference between successful people and everyone else? They don't snooze! You have it in you to be great, starting RIGHT NOW!",
    "No no no! That snooze button is a trap! The best version of you is waiting on the other side of getting up. Let's do this together!",
    "Think about it - would your future self thank you for those 5 extra minutes, or for starting the day strong? Get up, warrior!"
  ];

  const playRingtone = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const playRingtonePulse = () => {
        if (!audioContextRef.current || !isRingtonePhase) return;
        
        // Create oscillator for ringtone
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        oscillator.frequency.value = 800; // Hz
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime); // Increased volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
        
        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.3);
      };
      
      // Play ringtone pulse every 1 second
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

  // Load and select a specific voice on mount
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
      
      if (voices.length > 0) {
        // Female voice names to avoid (common across platforms)
        const femaleNames = ['samantha', 'victoria', 'karen', 'zira', 'susan', 'heather', 'moira', 'fiona', 'tessa', 'veena', 'female', 'woman', 'girl', 'siri', 'cortana', 'alexa', 'alice', 'emma', 'ava', 'mia', 'kate', 'ellen', 'princess'];
        
        // Male voice names to prefer (common across iOS, Android, Windows, Mac)
        const maleNames = ['daniel', 'david', 'fred', 'mark', 'alex', 'tom', 'aaron', 'james', 'john', 'guy', 'william', 'oliver', 'george', 'brian', 'eric', 'chris', 'liam', 'roger', 'male', 'man'];
        
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        
        // First try: Find a voice with a male name
        let preferredVoice = englishVoices.find(voice => 
          maleNames.some(name => voice.name.toLowerCase().includes(name))
        );
        
        // Second try: Find any English voice that's NOT female
        if (!preferredVoice) {
          preferredVoice = englishVoices.find(voice => 
            !femaleNames.some(name => voice.name.toLowerCase().includes(name))
          );
        }
        
        // Fallback: any English voice, then any voice
        if (!preferredVoice) {
          preferredVoice = englishVoices[0] || voices[0];
        }
        
        selectedVoiceRef.current = preferredVoice;
        console.log("Selected voice:", preferredVoice?.name);
      }
    };

    // Load voices immediately
    loadVoices();
    
    // Some browsers need this event to load voices
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    // Simulate connection
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      setIsPlaying(true);
      toast.success("AI Motivator connected! 🌅");
      playRingtone();
      // Start motivation immediately along with ringtone
      setTimeout(() => {
        speakMessage();
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(connectTimer);
      stopRingtone();
    };
  }, []);

  useEffect(() => {
    if (isConnected && elapsedTime < talkDuration * 60) {
      const timer = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          elapsedTimeRef.current = newTime;
          
          // After 30 seconds, stop ringtone but continue motivation
          if (newTime === 30 && isRingtonePhase) {
            console.log("Stopping ringtone, continuing motivation");
            setIsRingtonePhase(false);
            stopRingtone();
          }
          
          // Watchdog: If no speech in last 10 seconds and should be speaking, retry
          if (!isRingtonePhase && newTime > 35 && shouldContinueSpeaking.current) {
            const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
            if (timeSinceLastSpeech > 10000 && !speechSynthesis.speaking) {
              console.log("Watchdog: Restarting speech");
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

  const speakMessage = () => {
    if (!shouldContinueSpeaking.current) {
      console.log("Speech blocked - shouldContinueSpeaking is false");
      return;
    }
    
    if (isSpeechActiveRef.current) {
      console.log("Speech already active, skipping");
      return;
    }
    
    // Clear any pending speech timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    isSpeechActiveRef.current = true;
    intentionallyCanceledRef.current = false;
    
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setCurrentMessage(randomMessage);
    console.log("Starting speech:", randomMessage.substring(0, 30) + "...");
    
    // Use browser's speech synthesis
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Wait a moment for cancel to complete
      setTimeout(() => {
        if (!shouldContinueSpeaking.current || intentionallyCanceledRef.current) {
          isSpeechActiveRef.current = false;
          return;
        }
        
        const utterance = new SpeechSynthesisUtterance(randomMessage);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        if (selectedVoiceRef.current) {
          utterance.voice = selectedVoiceRef.current;
        }
        
        utterance.onstart = () => {
          console.log("Speech started");
          setIsPlaying(true);
          lastSpeechTimeRef.current = Date.now();
        };
        
        utterance.onend = () => {
          console.log("Speech ended normally");
          setIsPlaying(false);
          isSpeechActiveRef.current = false;
          
          // Continue speaking if still within duration and not canceled
          if (shouldContinueSpeaking.current && !intentionallyCanceledRef.current && elapsedTimeRef.current < (talkDuration * 60) - 3) {
            speechTimeoutRef.current = window.setTimeout(() => {
              speakMessage();
            }, 1500);
          }
        };
        
        utterance.onerror = (event) => {
          console.error("Speech error:", event);
          setIsPlaying(false);
          isSpeechActiveRef.current = false;
          
          // Only retry if not intentionally canceled
          if (!intentionallyCanceledRef.current && shouldContinueSpeaking.current && elapsedTimeRef.current < (talkDuration * 60) - 3) {
            speechTimeoutRef.current = window.setTimeout(() => {
              speakMessage();
            }, 2000);
          }
        };
        
        try {
          speechSynthesis.speak(utterance);
          console.log("Speech utterance queued");
        } catch (error) {
          console.error("Failed to speak:", error);
          setIsPlaying(false);
          isSpeechActiveRef.current = false;
          
          // Only retry if not intentionally canceled
          if (!intentionallyCanceledRef.current && shouldContinueSpeaking.current && elapsedTimeRef.current < (talkDuration * 60) - 3) {
            speechTimeoutRef.current = window.setTimeout(() => {
              speakMessage();
            }, 2000);
          }
        }
      }, 100);
    } else {
      console.error("Speech synthesis not supported");
      setCurrentMessage(randomMessage + " (Speech not supported in this browser)");
      isSpeechActiveRef.current = false;
    }
  };

  const handleAutoEndCall = () => {
    console.log("Auto ending call");
    shouldContinueSpeaking.current = false;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    stopRingtone();
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
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
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setIsConnected(false);
    setIsPlaying(false);
    toast.info("Call ended. Have a great day!");
    onEndCall();
  };

  const handleSnooze = () => {
    console.log("Snooze pressed");
    
    // Mark as intentionally canceled to prevent retries
    intentionallyCanceledRef.current = true;
    isSpeechActiveRef.current = false;
    
    // Stop ringtone if still playing
    if (isRingtonePhase) {
      stopRingtone();
      setIsRingtonePhase(false);
    }
    
    // Clear any pending timeouts
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    // Cancel any ongoing speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    setIsPlaying(false);
    setSnoozedCount(prev => prev + 1);
    const snoozeMessage = antiSnoozeMessages[Math.floor(Math.random() * antiSnoozeMessages.length)];
    setCurrentMessage(snoozeMessage);
    
    toast.warning(`Snooze attempt #${snoozedCount + 1} - Listen to this!`);
    
    // Wait for speech synthesis to fully reset
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        if (!shouldContinueSpeaking.current) return;
        
        // Reset canceled flag for snooze message
        intentionallyCanceledRef.current = false;
        isSpeechActiveRef.current = true;
        
        const utterance = new SpeechSynthesisUtterance(snoozeMessage);
        utterance.rate = 1.0;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        if (selectedVoiceRef.current) {
          utterance.voice = selectedVoiceRef.current;
        }
        
        utterance.onstart = () => {
          console.log("Snooze message speech started");
          setIsPlaying(true);
          lastSpeechTimeRef.current = Date.now();
        };
        
        utterance.onend = () => {
          console.log("Snooze message speech ended");
          setIsPlaying(false);
          isSpeechActiveRef.current = false;
          
          // Continue with regular messages
          speechTimeoutRef.current = window.setTimeout(() => {
            if (shouldContinueSpeaking.current) speakMessage();
          }, 1500);
        };
        
        utterance.onerror = (event) => {
          console.error("Snooze speech error:", event);
          setIsPlaying(false);
          isSpeechActiveRef.current = false;
          
          // Continue with regular messages even if snooze message fails
          speechTimeoutRef.current = window.setTimeout(() => {
            if (shouldContinueSpeaking.current) speakMessage();
          }, 2000);
        };
        
        try {
          speechSynthesis.speak(utterance);
          console.log("Snooze speech utterance queued");
        } catch (error) {
          console.error("Failed to speak snooze message:", error);
          setIsPlaying(false);
          isSpeechActiveRef.current = false;
          
          // Continue with regular messages
          speechTimeoutRef.current = window.setTimeout(() => {
            if (shouldContinueSpeaking.current) speakMessage();
          }, 2000);
        }
      }, 500);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (elapsedTime / (talkDuration * 60)) * 100;

  return (
    <div className="min-h-screen bg-gradient-dawn flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-glass border-0 shadow-glass text-center">
        <div className="mb-8">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-sunrise rounded-full flex items-center justify-center">
              <Sun className={`h-16 w-16 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
            </div>
            {isConnected && (
              <div className="absolute -inset-2 border-4 border-accent/30 rounded-full animate-ping"></div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isConnected ? "AI Motivator Active" : "Connecting..."}
          </h2>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4 text-red-500" />
            <span>Good morning call for {alarmTime}</span>
          </div>
        </div>

        {isConnected && (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {formatTime(elapsedTime)} / {formatTime(talkDuration * 60)}
                </span>
                <div className="flex items-center gap-1">
                  <Volume2 className={`h-4 w-4 text-accent ${isPlaying ? 'animate-pulse' : ''}`} />
                  <span className="text-sm text-accent">
                    {isPlaying ? 'Speaking' : 'Listening'}
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="bg-gradient-morning rounded-lg p-4 mb-6 min-h-[120px] flex items-center justify-center">
              <p className="text-sm text-foreground italic leading-relaxed text-center">
                {isRingtonePhase && `🔔 Ringtone: ${30 - elapsedTime}s remaining\n\n`}
                {currentMessage || "Connecting to your AI motivator..."}
              </p>
            </div>
          </>
        )}

        <div className="flex gap-4 justify-center">
          {!isConnected && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 animate-pulse" />
              <span>Establishing connection...</span>
            </div>
          )}
          
          {isConnected && (
            <>
              <Button
                onClick={handleSnooze}
                variant="outline"
                size="lg"
                className="px-6"
              >
                Snooze
              </Button>
              <Button
                onClick={handleManualEndCall}
                variant="destructive"
                size="lg"
                className="px-8"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call
              </Button>
            </>
          )}
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          Your AI motivator is here to help you start the day with positive energy! 🌟
        </div>
      </Card>
    </div>
  );
};