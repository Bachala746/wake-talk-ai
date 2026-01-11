import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Phone, PhoneOff, Mic, MicOff, Volume2, MessageSquare, Sun } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlarmSettings,
  ringtoneStyles,
  defaultAlarmSettings,
} from "@/lib/alarmSettings";
import { WakeUpChallenge } from "./WakeUpChallenge";

interface TwoWayVoiceCallProps {
  alarmTime: string;
  talkDuration: number;
  settings?: AlarmSettings;
  onEndCall: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const TwoWayVoiceCall = ({ 
  alarmTime, 
  talkDuration, 
  settings = defaultAlarmSettings, 
  onEndCall 
}: TwoWayVoiceCallProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);
  const [isRingtonePhase, setIsRingtonePhase] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldContinueRef = useRef(true);
  const ringtoneVolumeRef = useRef(0.1);
  const elapsedTimeRef = useRef(0);

  const openingMessages = [
    "Good morning! Did you sleep well last night?",
    "Rise and shine! How are you feeling this morning?",
    "Good morning, beautiful soul! Ready to start the day?",
    "Hey there! How did you sleep?",
  ];

  // Play ringtone
  const playRingtone = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const ringtoneConfig = ringtoneStyles.find(r => r.value === settings.ringtoneStyle) || ringtoneStyles[0];
      const maxVolume = ringtoneConfig.volume || 0.6;
      
      const playPulse = () => {
        if (!audioContextRef.current || !isRingtonePhase) return;
        
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        oscillator.frequency.value = ringtoneConfig.frequency;
        oscillator.type = ringtoneConfig.type;
        
        const volume = settings.gradualVolume 
          ? Math.min(ringtoneVolumeRef.current, maxVolume) 
          : maxVolume;
        gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.4);
        
        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.4);
        
        if (settings.gradualVolume && ringtoneVolumeRef.current < maxVolume) {
          ringtoneVolumeRef.current = Math.min(maxVolume, ringtoneVolumeRef.current + 0.08);
        }
      };
      
      playPulse();
      ringtoneIntervalRef.current = window.setInterval(playPulse, 800);
    } catch (error) {
      console.error("Ringtone error:", error);
    }
  }, [settings.ringtoneStyle, settings.gradualVolume, isRingtonePhase]);

  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Speak a message using browser TTS
  const speakMessage = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        setCurrentMessage(text);
        setTimeout(resolve, 3000);
        return;
      }

      setIsSpeaking(true);
      setCurrentMessage(text);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      if (englishVoices.length > 0) {
        const preferredVoice = englishVoices.find(v => 
          v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Enhanced')
        ) || englishVoices[0];
        utterance.voice = preferredVoice;
      }
      
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setUserTranscript("");
    };
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setUserTranscript(transcript);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        toast.info("I didn't hear anything. Tap the mic to try again!");
      }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Get AI response
  const getAIResponse = useCallback(async (userMessage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('conversation-ai', {
        body: {
          userMessage,
          conversationHistory,
          theme: settings.messageTheme
        }
      });

      if (error) {
        console.error("AI response error:", error);
        return "That's great! Let's make today amazing together.";
      }

      return data?.response || "I hear you. Let's make this a wonderful day!";
    } catch (e) {
      console.error("AI fetch error:", e);
      return "Thanks for sharing. Now let's get this day started!";
    }
  }, [conversationHistory, settings.messageTheme]);

  // Handle user submission
  const handleUserSubmit = useCallback(async () => {
    if (!userTranscript.trim()) {
      toast.info("Please speak your response first!");
      return;
    }

    stopListening();
    
    const userMessage = userTranscript.trim();
    const newHistory: Message[] = [...conversationHistory, { role: 'user', content: userMessage }];
    setConversationHistory(newHistory);
    setUserTranscript("");
    
    // Get AI response
    const aiResponse = await getAIResponse(userMessage);
    setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
    setExchangeCount(prev => prev + 1);
    
    // Speak the response
    await speakMessage(aiResponse);
    
    // Check if conversation should end
    if (exchangeCount >= 3 || elapsedTimeRef.current >= (talkDuration * 60) - 10) {
      await speakMessage("You're doing great! Have an amazing day ahead!");
      handleEndCall(false);
    } else {
      // Ready for next input
      toast.info("Tap the mic when you're ready to respond!");
    }
  }, [userTranscript, conversationHistory, getAIResponse, speakMessage, exchangeCount, talkDuration, stopListening]);

  // Initialize call
  useEffect(() => {
    setIsConnected(true);
    toast.success("AI Conversation started! 🌅");
    playRingtone();

    // Initial greeting after short delay
    const initTimer = setTimeout(async () => {
      const greeting = openingMessages[Math.floor(Math.random() * openingMessages.length)];
      setConversationHistory([{ role: 'assistant', content: greeting }]);
      await speakMessage(greeting);
      toast.info("Tap the microphone to respond!");
    }, 1500);

    return () => {
      clearTimeout(initTimer);
      stopRingtone();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isConnected && elapsedTime < talkDuration * 60) {
      const timer = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          elapsedTimeRef.current = newTime;
          
          if (newTime === 20 && isRingtonePhase) {
            setIsRingtonePhase(false);
            stopRingtone();
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (elapsedTime >= talkDuration * 60) {
      handleEndCall(false);
    }
  }, [isConnected, elapsedTime, talkDuration, isRingtonePhase, stopRingtone]);

  const handleEndCall = (showChallengeFirst: boolean = true) => {
    if (showChallengeFirst && settings.challengeType && settings.challengeType !== 'none' && !showChallenge) {
      shouldContinueRef.current = false;
      stopRingtone();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setShowChallenge(true);
      toast.info("Complete the challenge to dismiss!");
      return;
    }
    
    shouldContinueRef.current = false;
    stopRingtone();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsConnected(false);
    toast.success("Have an amazing day! 🌟");
    setTimeout(onEndCall, 1000);
  };

  const handleChallengeComplete = () => {
    setShowChallenge(false);
    handleEndCall(false);
  };

  const handleChallengeFail = () => {
    toast.error("Wrong! Try again!");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (elapsedTime / (talkDuration * 60)) * 100;

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
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-yellow-200 animate-pulse shadow-2xl" 
               style={{ boxShadow: '0 0 100px 50px rgba(255, 200, 100, 0.6)' }} />
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-md p-4 sm:p-6 bg-white/90 backdrop-blur-lg shadow-2xl border-0 rounded-2xl sm:rounded-3xl">
        <div className="text-center space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <div className="relative">
              {isSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-green-400/20 animate-pulse" />
                </>
              )}
              <div className={`relative p-3 sm:p-4 rounded-full transition-all duration-300 ${
                isSpeaking 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                  : 'bg-gradient-to-br from-orange-400 to-amber-500'
              }`}>
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 w-full">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">AI Conversation</h2>
              <p className="text-xs sm:text-sm text-gray-600 flex items-center justify-center gap-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isSpeaking ? 'bg-green-500' : isListening ? 'bg-blue-500' : 'bg-gray-400'} animate-pulse`} />
                <span className="truncate">{isSpeaking ? 'AI Speaking...' : isListening ? 'Listening...' : 'Your Turn'}</span>
              </p>
            </div>
          </div>

          {/* Current AI Message */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 min-h-[70px] sm:min-h-[80px]">
            <div className="flex items-start gap-2">
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed text-left break-words">
                {currentMessage || "Connecting..."}
              </p>
            </div>
          </div>

          {/* User Transcript */}
          {(isListening || userTranscript) && (
            <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 min-h-[50px] sm:min-h-[60px]">
              <div className="flex items-start gap-2">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed text-left break-words">
                  {userTranscript || "Listening..."}
                </p>
              </div>
            </div>
          )}

          {/* Timer */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600">
              <span>{formatTime(elapsedTime)}</span>
              <span>-{formatTime(talkDuration * 60 - elapsedTime)}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Exchange Counter */}
          <div className="flex justify-center gap-1.5 sm:gap-2">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                  i < exchangeCount ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2">
            {/* Mic Button */}
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking}
              className={`flex-1 py-5 sm:py-6 rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base ${
                isListening 
                  ? 'bg-blue-500 hover:bg-blue-600 animate-pulse' 
                  : 'bg-blue-400 hover:bg-blue-500'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2 shrink-0" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2 shrink-0" />}
              <span>{isListening ? 'Stop' : 'Speak'}</span>
            </Button>

            {/* Submit Button */}
            {userTranscript && !isListening && (
              <Button
                onClick={handleUserSubmit}
                disabled={isSpeaking}
                className="flex-1 py-5 sm:py-6 rounded-xl sm:rounded-2xl bg-green-500 hover:bg-green-600 text-sm sm:text-base"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2 shrink-0" />
                <span>Send</span>
              </Button>
            )}

            {/* End Call */}
            <Button
              onClick={() => handleEndCall(true)}
              variant="destructive"
              className="py-5 sm:py-6 px-4 sm:px-6 rounded-xl sm:rounded-2xl"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>

          {/* Status */}
          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
            {isRingtonePhase && "🔔 "}
            Exchange {exchangeCount + 1}/4 • {settings.messageTheme} mode
          </p>
        </div>
      </Card>
    </div>
  );
};
