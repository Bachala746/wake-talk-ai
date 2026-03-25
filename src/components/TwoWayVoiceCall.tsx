import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Volume2, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlarmSettings, defaultAlarmSettings } from "@/lib/alarmSettings";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { speakWithElevenLabs, cancelSpeech } from "@/lib/elevenLabsAudio";
import { useElevenLabsScribe } from "@/hooks/useElevenLabsScribe";
import { AudioWaveform } from "./AudioWaveform";
import { SpeakingAvatar } from "./SpeakingAvatar";
import { useTheme } from "@/hooks/useTheme";

interface TwoWayVoiceCallProps {
  alarmTime: string;
  talkDuration: number;
  settings?: AlarmSettings;
  onEndCall: () => void;
  isTestCall?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const motivationalMessages = [
  "Hey! Are you still there? Come on, it's time to wake up!",
  "I know it's hard, but you can do this! Just say something!",
  "Rise and shine! Your amazing day is waiting for you!",
  "Don't go back to sleep! Take a deep breath and talk to me!",
  "You set this alarm for a reason. Let's make today count!",
  "The world needs you awake! Come on, just one word!",
  "I'm not giving up on you! Wake up, champion!",
  "Your goals are calling! Time to answer!",
  "Every great day starts with waking up. You got this!",
  "I'll keep talking until you respond! Good morning!",
];

export const TwoWayVoiceCall = ({ 
  alarmTime, talkDuration, settings = defaultAlarmSettings, onEndCall, isTestCall = false,
}: TwoWayVoiceCallProps) => {
  const { isDark } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [showChallenge, setShowChallenge] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userHasResponded, setUserHasResponded] = useState(false);
  const [noResponseCount, setNoResponseCount] = useState(0);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  
  const shouldContinueRef = useRef(true);
  const pendingTranscriptRef = useRef("");
  const responseTimeoutRef = useRef<number | null>(null);
  const isWaitingRef = useRef(false);

  // Clear any pending timeout
  const clearResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  // Speak a message and wait for completion
  const speakMessage = useCallback(async (message: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsSpeaking(true);
      setCurrentMessage(message);
      speakWithElevenLabs(
        message, 
        settings.voiceStyle, 
        undefined, 
        () => { setIsSpeaking(false); resolve(); }, 
        () => { setIsSpeaking(false); resolve(); }
      );
    });
  }, [settings.voiceStyle]);

  // Process user response with AI
  const processUserResponse = useCallback(async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;
    
    clearResponseTimeout();
    setIsProcessing(true);
    setUserHasResponded(true);
    setWaitingForResponse(false);
    isWaitingRef.current = false;
    setNoResponseCount(0);
    
    const userMessage = transcript.trim();
    const newHistory: Message[] = [...conversationHistory, { role: 'user', content: userMessage }];
    setConversationHistory(newHistory);
    
    try {
      const { data } = await supabase.functions.invoke('conversation-ai', {
        body: { 
          userMessage, 
          conversationHistory, 
          theme: settings.messageTheme, 
          isTestCall,
          context: 'two-way-alarm'
        }
      });
      const aiResponse = data?.response || (isTestCall ? "I heard you! The test is working great." : "That's wonderful! Let's make today amazing together.");
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      
      await speakMessage(aiResponse);
      
      // After AI responds, start listening again
      if (shouldContinueRef.current) {
        startWaitingForResponse();
      }
    } catch (e) {
      console.error("AI error:", e);
      await speakMessage("I had a little trouble there. Can you say that again?");
      if (shouldContinueRef.current) {
        startWaitingForResponse();
      }
    }
    setIsProcessing(false);
  }, [conversationHistory, settings.messageTheme, isTestCall, isProcessing, clearResponseTimeout]);

  // Initialize scribe for speech recognition - faster silence detection
  const scribe = useElevenLabsScribe({
    autoSubmitAfterSilence: 1500, // Faster silence detection for quicker response
    onFinalTranscript: (text) => { 
      pendingTranscriptRef.current = text; 
    },
    onEnd: () => {
      if (pendingTranscriptRef.current.trim() && !isProcessing) {
        processUserResponse(pendingTranscriptRef.current);
        pendingTranscriptRef.current = "";
      }
    },
    onError: () => toast.error("Speech recognition error. Tap mic to retry."),
  });

  // Speak motivational message when user doesn't respond
  const speakMotivationalMessage = useCallback(async () => {
    if (!shouldContinueRef.current || isSpeaking || isProcessing) return;
    
    scribe.stopListening();
    setWaitingForResponse(false);
    
    const messageIndex = noResponseCount % motivationalMessages.length;
    const message = motivationalMessages[messageIndex];
    
    setNoResponseCount(prev => prev + 1);
    setConversationHistory(prev => [...prev, { role: 'assistant', content: message }]);
    
    await speakMessage(message);
    
    // After speaking, start waiting for response again
    if (shouldContinueRef.current) {
      startWaitingForResponse();
    }
  }, [noResponseCount, isSpeaking, isProcessing, scribe, speakMessage]);

  // Start waiting for user response with timeout - faster timeout
  const startWaitingForResponse = useCallback(() => {
    if (!shouldContinueRef.current || isWaitingRef.current) return;
    
    isWaitingRef.current = true;
    setWaitingForResponse(true);
    clearResponseTimeout();
    
    // Start listening
    scribe.startListening();
    
    // Set timeout - reduced from 10/15 seconds to 8/12 seconds for faster re-engagement
    const timeoutDuration = isTestCall ? 8000 : 12000;
    responseTimeoutRef.current = window.setTimeout(() => {
      isWaitingRef.current = false;
      if (shouldContinueRef.current && !isSpeaking && !isProcessing) {
        speakMotivationalMessage();
      }
    }, timeoutDuration);
  }, [scribe, clearResponseTimeout, isTestCall, isSpeaking, isProcessing, speakMotivationalMessage]);

  // Opening messages
  const openingMessages = isTestCall 
    ? ["Hello! This is a two-way test call. Can you hear me? Try saying something to test your microphone!"]
    : [
        "Good morning! Did you sleep well last night? Tell me how you're feeling!",
        "Rise and shine! It's a brand new day full of possibilities. How are you doing?",
        "Wake up, wake up! I'm here to make sure you start your day right. Talk to me!",
      ];

  // Handle dismissal with challenges
  const handleDismiss = useCallback(() => {
    // Always require challenge for non-test calls
    if (!isTestCall && settings.challengeType !== 'none') {
      setShowChallenge(true);
      shouldContinueRef.current = false;
      clearResponseTimeout();
      cancelSpeech();
      scribe.stopListening();
      return;
    }
    
    // For test calls or if no challenge, end directly
    shouldContinueRef.current = false;
    clearResponseTimeout();
    cancelSpeech();
    scribe.stopListening();
    setIsConnected(false);
    toast.success(isTestCall ? "Test call ended! 🎉" : "Have an amazing day! 🌟");
    setTimeout(onEndCall, 1000);
  }, [isTestCall, settings.challengeType, clearResponseTimeout, scribe, onEndCall]);

  // Handle challenge completion
  const handleChallengeComplete = useCallback(() => {
    setShowChallenge(false);
    setIsConnected(false);
    toast.success("Challenge completed! Have an amazing day! 🌟");
    setTimeout(onEndCall, 1000);
  }, [onEndCall]);

  // Handle challenge failure
  const handleChallengeFail = useCallback(() => {
    toast.error("Wrong! Try again to dismiss the alarm!");
  }, []);

  const handleChallengeEscalate = useCallback((level: number) => {
    toast.warning(
      level >= 3 
        ? "🔊 MAXIMUM VOLUME! Go find your QR code!" 
        : `⚠️ Volume increased! (Level ${level})`
    );
  }, []);

  // Initialize conversation
  useEffect(() => {
    setIsConnected(true);
    toast.success(isTestCall ? "Two-way test call started! 🎤" : "AI Conversation started! 🌅");
    
    const initTimer = setTimeout(async () => {
      const greeting = openingMessages[Math.floor(Math.random() * openingMessages.length)];
      setConversationHistory([{ role: 'assistant', content: greeting }]);
      
      await speakMessage(greeting);
      
      // Start waiting for user response
      if (shouldContinueRef.current) {
        startWaitingForResponse();
      }
    }, isTestCall ? 500 : 1500);

    return () => { 
      clearTimeout(initTimer); 
      clearResponseTimeout();
      cancelSpeech(); 
      scribe.stopListening(); 
      shouldContinueRef.current = false;
    };
  }, []);

  // Manual mic button handler
  const handleMicClick = useCallback(() => {
    if (scribe.isListening) {
      scribe.stopListening();
      clearResponseTimeout();
      setWaitingForResponse(false);
      isWaitingRef.current = false;
    } else {
      startWaitingForResponse();
    }
  }, [scribe, clearResponseTimeout, startWaitingForResponse]);

  if (showChallenge) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDark 
          ? 'bg-gradient-to-t from-indigo-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300'
      }`}>
        <WakeUpChallenge 
          challengeType={settings.challengeType} 
          difficulty={settings.challengeDifficulty} 
          onComplete={handleChallengeComplete} 
          onFail={handleChallengeFail}
          onEscalate={handleChallengeEscalate}
          speakMatchSettings={settings.speakMatchSettings}
          registeredQrCode={settings.registeredQrCode}
          objectVerifySettings={settings.objectVerifySettings}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark 
        ? 'bg-gradient-to-t from-indigo-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300'
    }`}>
      <Card className={`w-full max-w-md p-6 backdrop-blur-lg shadow-2xl rounded-3xl ${
        isDark ? 'bg-slate-800/90' : 'bg-white/90'
      }`}>
        <div className="text-center space-y-5">
          {/* Avatars showing who is active */}
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <SpeakingAvatar type="user" isActive={scribe.isListening} size="md" />
              <span className={`text-xs font-medium ${scribe.isListening ? (isDark ? 'text-blue-400' : 'text-blue-600') : 'text-muted-foreground'}`}>You</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <SpeakingAvatar type="ai" isActive={isSpeaking} size="md" />
              <span className={`text-xs font-medium ${isSpeaking ? (isDark ? 'text-emerald-400' : 'text-green-600') : 'text-muted-foreground'}`}>AI</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground">{isTestCall ? '🧪 Two-Way Test' : '💬 AI Conversation'}</h2>
          <p className="text-sm text-muted-foreground">
            {isSpeaking 
              ? '🔊 AI Speaking...' 
              : scribe.isListening 
                ? '🎤 Listening to you...' 
                : isProcessing 
                  ? '🤔 Processing...' 
                  : '⏳ Waiting...'}
          </p>

          {/* Audio Waveform Visualization */}
          <div className="flex justify-center gap-6 py-2">
            <AudioWaveform 
              isActive={scribe.isListening} 
              type="user" 
              label="You"
            />
            <AudioWaveform 
              isActive={isSpeaking} 
              type="ai" 
              label="AI"
            />
          </div>

          {/* No response indicator */}
          {noResponseCount > 0 && !userHasResponded && (
            <div className={`border rounded-xl p-3 flex items-center gap-2 ${
              isDark ? 'bg-amber-900/20 border-amber-700/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertCircle className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                I'll keep talking until you respond! ({noResponseCount} attempts)
              </p>
            </div>
          )}

          {/* AI message display */}
          <div className={`rounded-xl p-4 min-h-[80px] transition-all duration-300 ${
            isSpeaking 
              ? isDark ? 'bg-emerald-900/30 border-2 border-emerald-700/50 shadow-lg' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg shadow-green-100' 
              : isDark ? 'bg-indigo-900/30' : 'bg-orange-50'
          }`}>
            <div className="flex items-start gap-2">
              <Volume2 className={`w-5 h-5 mt-0.5 shrink-0 transition-colors ${
                isSpeaking ? (isDark ? 'text-emerald-400' : 'text-green-500') : (isDark ? 'text-indigo-400' : 'text-orange-500')
              }`} />
              <p className={`text-sm text-left ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{currentMessage || "Connecting..."}</p>
            </div>
          </div>

          {/* User transcript display */}
          {(scribe.isListening || scribe.transcript) && (
            <div className={`rounded-xl p-4 transition-all duration-300 ${
              scribe.isListening 
                ? isDark ? 'bg-blue-900/30 border-2 border-blue-700/50 shadow-lg' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg shadow-blue-100' 
                : isDark ? 'bg-blue-900/20' : 'bg-blue-50'
            }`}>
              <div className="flex items-start gap-2">
                <Mic className={`w-5 h-5 mt-0.5 shrink-0 transition-colors ${
                  scribe.isListening ? (isDark ? 'text-blue-400 animate-pulse' : 'text-blue-500 animate-pulse') : (isDark ? 'text-blue-500' : 'text-blue-400')
                }`} />
                <p className={`text-sm text-left ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                  {scribe.transcript || "Listening... say something!"}
                </p>
              </div>
            </div>
          )}

          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            {isTestCall 
              ? "This is a test. Tap the red button to end anytime."
              : "Complete a challenge to dismiss the alarm."}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleMicClick} 
              disabled={isSpeaking || isProcessing} 
              className={`flex-1 py-6 rounded-xl transition-all ${
                scribe.isListening 
                  ? 'bg-blue-500 hover:bg-blue-600 animate-pulse' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : scribe.isListening ? (
                <>
                  <MicOff className="w-6 h-6 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 mr-2" />
                  Speak
                </>
              )}
            </Button>
            <Button 
              onClick={handleDismiss} 
              variant="destructive" 
              className="py-6 px-6 rounded-xl"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
