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
            globalMathSettings={settings.mathSettings}
            globalTypingSettings={settings.typingSettings}
            globalMemorySettings={settings.memorySettings}
            globalPatternSettings={settings.patternSettings}
            globalSliderSettings={settings.sliderSettings}
            globalCaptchaSettings={settings.captchaSettings}
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
            mathSettings={settings.mathSettings}
            typingSettings={settings.typingSettings}
            memorySettings={settings.memorySettings}
            patternSettings={settings.patternSettings}
            sliderSettings={settings.sliderSettings}
            captchaSettings={settings.captchaSettings}
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
        ? 'bg-[radial-gradient(ellipse_at_top,hsl(260,50%,18%)_0%,hsl(240,40%,10%)_55%,hsl(20,40%,12%)_100%)]'
        : 'bg-[radial-gradient(ellipse_at_top,hsl(45,100%,90%)_0%,hsl(20,100%,82%)_45%,hsl(340,90%,86%)_100%)]'
    }`}>
      {/* Aurora sweep */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-50 mix-blend-screen ${
          isDark
            ? 'bg-[conic-gradient(from_180deg_at_50%_120%,transparent,hsl(260,80%,40%)/0.4,transparent_40%,hsl(20,90%,50%)/0.4,transparent)]'
            : 'bg-[conic-gradient(from_180deg_at_50%_120%,transparent,hsl(45,100%,75%)/0.5,transparent_40%,hsl(340,90%,80%)/0.5,transparent)]'
        }`}
        style={{ animation: 'aurora-spin 30s linear infinite' }}
      />
      {/* Ambient sunrise orbs */}
      <div className={`pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-50 ${
        isDark ? 'bg-orange-500/30' : 'bg-amber-300/60'
      }`} style={{ animation: 'float-slow 8s ease-in-out infinite' }} />
      <div className={`pointer-events-none absolute -bottom-28 -right-20 w-96 h-96 rounded-full blur-3xl opacity-40 ${
        isDark ? 'bg-pink-500/20' : 'bg-rose-300/50'
      }`} style={{ animation: 'float-slow 10s ease-in-out infinite reverse' }} />
      <div className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-25 ${
        isDark ? 'bg-indigo-500/20' : 'bg-yellow-200/60'
      }`} style={{ animation: 'float-slow 12s ease-in-out infinite' }} />

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

          <div>
            <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isTestCall ? '🧪 Two-Way Test' : '💬 AI Conversation'}
            </h2>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {stateMeta.hint}
            </p>
          </div>

          {/* State pill — clear, animated, single source of truth */}
          <div
            className={`inline-flex items-center gap-2 mx-auto px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ${
              voiceState === 'listening'
                ? (isDark ? 'bg-rose-500/15 border-rose-400/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700')
                : voiceState === 'processing'
                  ? (isDark ? 'bg-blue-500/15 border-blue-400/40 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700')
                  : voiceState === 'speaking'
                    ? (isDark ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                    : (isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600')
            }`}
          >
            {voiceState === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
            {voiceState !== 'processing' && <span className="text-base leading-none">{stateMeta.emoji}</span>}
            <span>{stateMeta.label}</span>
          </div>

          {/* Audio Waveform Visualization */}
          <div className="flex justify-center gap-6 py-1">
            <AudioWaveform isActive={scribe.isListening} type="user" label="You" />
            <AudioWaveform isActive={isSpeaking} type="ai" label="AI" />
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
          <div className={`rounded-2xl p-4 min-h-[80px] transition-all duration-300 ${
            isSpeaking 
              ? isDark ? 'bg-emerald-500/10 border-2 border-emerald-400/40 shadow-lg' : 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-lg shadow-emerald-100' 
              : isDark ? 'bg-white/5 border border-white/10' : 'bg-orange-50/70 border border-orange-100'
          }`}>
            <div className="flex items-start gap-2">
              <Volume2 className={`w-5 h-5 mt-0.5 shrink-0 transition-colors ${
                isSpeaking ? (isDark ? 'text-emerald-300' : 'text-emerald-600') : (isDark ? 'text-orange-300' : 'text-orange-500')
              }`} />
              <p className={`text-sm text-left leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                {currentMessage || "Connecting…"}
              </p>
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

          {/* Big central mic VoiceButton */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Conic progress / energy ring (volume-reactive when listening) */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full opacity-90"
                style={{
                  background:
                    voiceState === 'listening'
                      ? 'conic-gradient(from 0deg, hsl(0,90%,60%), hsl(340,95%,65%), hsl(20,100%,60%), hsl(0,90%,60%))'
                      : voiceState === 'speaking'
                        ? 'conic-gradient(from 0deg, hsl(150,80%,45%), hsl(170,80%,50%), hsl(140,75%,50%), hsl(150,80%,45%))'
                        : voiceState === 'processing'
                          ? 'conic-gradient(from 0deg, hsl(220,90%,60%), hsl(260,85%,65%), hsl(220,90%,60%))'
                          : 'conic-gradient(from 0deg, hsl(35,100%,60%), hsl(20,100%,55%), hsl(340,90%,60%), hsl(35,100%,60%))',
                  filter: 'blur(1px)',
                  animation: 'spin-slow 6s linear infinite',
                  transform: voiceState === 'listening' ? `scale(${1 + scribe.volumeLevel * 0.18})` : 'scale(1)',
                  transition: 'transform 120ms ease-out',
                }}
              />
              {/* Inner masked disk to make the ring read as a stroke */}
              <span
                aria-hidden
                className={`absolute inset-[6px] rounded-full backdrop-blur-md ${
                  isDark ? 'bg-slate-900/85' : 'bg-white/85'
                }`}
              />
              {/* Pulsing rings when listening */}
              {voiceState === 'listening' && (
                <>
                  <span className="absolute inset-0 rounded-full bg-rose-500/25 animate-ping" style={{ animationDuration: '1.4s' }} />
                  <span className="absolute -inset-3 rounded-full bg-rose-500/15 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
                </>
              )}
              {voiceState === 'speaking' && (
                <span className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping" style={{ animationDuration: '1.6s' }} />
              )}
              <button
                onClick={handleMicClick}
                disabled={isSpeaking || isProcessing || !scribe.isSupported}
                aria-label={scribe.isListening ? 'Stop listening' : 'Tap to speak'}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl ring-4 ring-white/15
                            transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                            ${voiceState === 'listening'
                              ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/60 scale-105'
                              : voiceState === 'processing'
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/50'
                                : voiceState === 'speaking'
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/50'
                                  : 'bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 shadow-orange-500/50 hover:scale-105'
                            }`}
              >
                {voiceState === 'processing' ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : voiceState === 'listening' ? (
                  <MicOff className="w-10 h-10" />
                ) : voiceState === 'speaking' ? (
                  <Volume2 className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>
            <p className={`text-xs font-semibold tracking-wide ${stateMeta.color}`}>
              {voiceState === 'idle' ? 'Tap to Speak' : stateMeta.label}
            </p>

            {/* End call (small, less prominent) */}
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className={`mt-1 gap-2 rounded-full ${
                isDark ? 'text-rose-300 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </Button>
          </div>

          <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {isTestCall
              ? 'This is a test. Tap End Call anytime.'
              : 'Complete a challenge to dismiss the alarm.'}
          </p>
        </div>
      </Card>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(20px, -16px) scale(1.06); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes aurora-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
