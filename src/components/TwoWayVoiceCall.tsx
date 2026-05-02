import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Volume2, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlarmSettings, defaultAlarmSettings } from "@/lib/alarmSettings";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { SequentialChallengeRunner } from "./SequentialChallengeRunner";
import { speakWithElevenLabs, cancelSpeech } from "@/lib/elevenLabsAudio";
import { useElevenLabsScribe } from "@/hooks/useElevenLabsScribe";
import { AudioWaveform } from "./AudioWaveform";
import { SpeakingAvatar } from "./SpeakingAvatar";
import { ListeningIndicator } from "./ListeningIndicator";
import { useTheme } from "@/hooks/useTheme";

interface TwoWayVoiceCallProps {
  alarmTime: string;
  talkDuration: number;
  settings?: AlarmSettings;
  onEndCall: (snoozes?: number, challengeFails?: number, challengeSuccess?: boolean) => void;
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

    // Send only the last 4 messages for context — reduces payload + AI latency.
    const recentHistory = conversationHistory.slice(-4);

    try {
      const { data } = await supabase.functions.invoke('conversation-ai', {
        body: {
          userMessage,
          conversationHistory: recentHistory,
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
    autoSubmitAfterSilence: 1000, // Snappier auto-submit after user stops talking
    onFinalTranscript: (text) => {
      pendingTranscriptRef.current = text;
    },
    onEnd: () => {
      const text = pendingTranscriptRef.current.trim();
      if (text && !isProcessing) {
        pendingTranscriptRef.current = "";
        processUserResponse(text);
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
    setTimeout(() => onEndCall(0), 1000);
  }, [isTestCall, settings.challengeType, clearResponseTimeout, scribe, onEndCall]);

  // Handle challenge completion
  const handleChallengeComplete = useCallback(() => {
    setShowChallenge(false);
    setIsConnected(false);
    toast.success("Challenge completed! Have an amazing day! 🌟");
    setTimeout(() => onEndCall(0, 0, true), 1000);
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

  // Manual mic button handler — properly async to preserve user-gesture context for getUserMedia
  const handleMicClick = useCallback(async () => {
    console.log('[TwoWayVoiceCall] Speak button clicked. isListening:', scribe.isListening);
    if (scribe.isListening) {
      scribe.stopListening();
      clearResponseTimeout();
      setWaitingForResponse(false);
      isWaitingRef.current = false;
      return;
    }

    // Cancel any pending AI speech / motivational timer so the mic can take over immediately
    cancelSpeech();
    clearResponseTimeout();
    isWaitingRef.current = true;
    setWaitingForResponse(true);

    // Call startListening DIRECTLY (no intermediate sync wrapper) so the user gesture
    // is preserved through the await chain into getUserMedia.
    const started = await scribe.startListening();
    if (!started) {
      console.error('[TwoWayVoiceCall] startListening returned false');
      isWaitingRef.current = false;
      setWaitingForResponse(false);
      toast.error('Could not start the microphone. Please check permissions and try again.');
    }
  }, [scribe, clearResponseTimeout]);

  if (showChallenge) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDark 
          ? 'bg-gradient-to-t from-indigo-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300'
      }`}>
        {settings.sequentialChallengeSettings?.enabled ? (
          <SequentialChallengeRunner
            settings={settings.sequentialChallengeSettings}
            globalSpeakMatchSettings={settings.speakMatchSettings}
            globalRegisteredQrCode={settings.registeredQrCode}
            globalObjectVerifySettings={settings.objectVerifySettings}
            onAllComplete={handleChallengeComplete}
            onFail={handleChallengeFail}
            onEscalate={handleChallengeEscalate}
          />
        ) : (
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
        )}
      </div>
    );
  }

  // Derive a single voice state for the UI
  const voiceState: 'idle' | 'listening' | 'processing' | 'speaking' =
    isProcessing ? 'processing'
    : isSpeaking ? 'speaking'
    : scribe.isListening ? 'listening'
    : 'idle';

  const stateMeta = {
    idle:       { label: 'Tap to Speak',       hint: 'Wait for AI, then speak',  emoji: '🎙️', color: isDark ? 'text-slate-300' : 'text-slate-600' },
    listening:  { label: 'Listening…',         hint: 'I can hear you — keep going', emoji: '🎤', color: isDark ? 'text-rose-300' : 'text-rose-600' },
    processing: { label: 'Processing…',        hint: 'Thinking about your reply',   emoji: '🤔', color: isDark ? 'text-blue-300' : 'text-blue-600' },
    speaking:   { label: 'AI Speaking…',       hint: 'Wait for the beep, then speak', emoji: '🔊', color: isDark ? 'text-emerald-300' : 'text-emerald-600' },
  }[voiceState];

  return (
    <div className={`relative min-h-screen flex items-center justify-center p-4 overflow-hidden ${
      isDark
        ? 'bg-gradient-to-br from-[hsl(240,30%,10%)] via-[hsl(260,35%,16%)] to-[hsl(20,40%,16%)]'
        : 'bg-gradient-to-br from-[hsl(35,100%,88%)] via-[hsl(20,100%,82%)] to-[hsl(340,90%,88%)]'
    }`}>
      {/* Ambient sunrise orbs */}
      <div className={`pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-50 ${
        isDark ? 'bg-orange-500/30' : 'bg-amber-300/60'
      }`} style={{ animation: 'float-slow 8s ease-in-out infinite' }} />
      <div className={`pointer-events-none absolute -bottom-28 -right-20 w-96 h-96 rounded-full blur-3xl opacity-40 ${
        isDark ? 'bg-pink-500/20' : 'bg-rose-300/50'
      }`} style={{ animation: 'float-slow 10s ease-in-out infinite reverse' }} />

      <Card className={`relative w-full max-w-md p-6 backdrop-blur-xl shadow-2xl rounded-3xl border ${
        isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white/80 border-white/60'
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
          <p className="text-sm text-muted-foreground font-medium">
            {isSpeaking
              ? '🔊 AI Speaking...'
              : isProcessing
                ? '🤔 Processing...'
                : scribe.isListening
                  ? '🎤 Listening — speak now!'
                  : waitingForResponse
                    ? '⏳ Tap Speak to talk'
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

          {/* Browser-support / error banner */}
          {!scribe.isSupported && (
            <div className={`rounded-xl p-3 border flex items-start gap-2 ${
              isDark ? 'bg-red-900/20 border-red-700/40' : 'bg-red-50 border-red-200'
            }`}>
              <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              <p className={`text-xs text-left ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                Your browser doesn't support speech recognition. Please use Google Chrome on desktop.
              </p>
            </div>
          )}

          {scribe.errorMessage && (
            <div className={`rounded-xl p-3 border flex items-start gap-2 ${
              isDark ? 'bg-red-900/20 border-red-700/40' : 'bg-red-50 border-red-200'
            }`}>
              <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              <p className={`text-xs text-left ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                {scribe.errorMessage}
              </p>
            </div>
          )}

          {/* Big pulsing mic + sound bars — appears instantly on listening */}
          <ListeningIndicator
            active={scribe.isListening}
            isDark={isDark}
            volumeLevel={scribe.volumeLevel}
          />

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
                <div className="flex-1 text-left">
                  {scribe.isListening && !scribe.transcript && (
                    <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                      🎤 Listening...
                    </p>
                  )}
                  <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {scribe.transcript || "Say something — I'm listening!"}
                  </p>
                </div>
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
              disabled={isSpeaking || isProcessing || !scribe.isSupported} 
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
