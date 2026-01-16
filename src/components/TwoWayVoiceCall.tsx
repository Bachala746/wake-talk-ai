import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PhoneOff, Mic, MicOff, Volume2, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlarmSettings, ringtoneStyles, defaultAlarmSettings } from "@/lib/alarmSettings";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { speakWithElevenLabs, cancelSpeech } from "@/lib/elevenLabsAudio";
import { useElevenLabsScribe } from "@/hooks/useElevenLabsScribe";

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

export const TwoWayVoiceCall = ({ 
  alarmTime, talkDuration, settings = defaultAlarmSettings, onEndCall, isTestCall = false,
}: TwoWayVoiceCallProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);
  const [isRingtonePhase, setIsRingtonePhase] = useState(!isTestCall);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);
  const shouldContinueRef = useRef(true);
  const ringtoneVolumeRef = useRef(0.1);
  const elapsedTimeRef = useRef(0);
  const pendingTranscriptRef = useRef("");

  const processUserResponse = useCallback(async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;
    setIsProcessing(true);
    const userMessage = transcript.trim();
    const newHistory: Message[] = [...conversationHistory, { role: 'user', content: userMessage }];
    setConversationHistory(newHistory);
    
    try {
      const { data } = await supabase.functions.invoke('conversation-ai', {
        body: { userMessage, conversationHistory, theme: settings.messageTheme, isTestCall }
      });
      const aiResponse = data?.response || (isTestCall ? "I heard you! The test is working." : "That's great! Let's make today amazing.");
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      setExchangeCount(prev => prev + 1);
      
      await new Promise<void>((resolve) => {
        setIsSpeaking(true);
        setCurrentMessage(aiResponse);
        speakWithElevenLabs(aiResponse, settings.voiceStyle, undefined, () => { setIsSpeaking(false); resolve(); }, () => { setIsSpeaking(false); resolve(); });
      });
    } catch (e) {
      console.error("AI error:", e);
    }
    setIsProcessing(false);
  }, [conversationHistory, settings.messageTheme, settings.voiceStyle, isTestCall, isProcessing]);

  const scribe = useElevenLabsScribe({
    autoSubmitAfterSilence: 2500,
    onFinalTranscript: (text) => { pendingTranscriptRef.current = text; },
    onEnd: () => {
      if (pendingTranscriptRef.current.trim() && !isProcessing) {
        processUserResponse(pendingTranscriptRef.current);
        pendingTranscriptRef.current = "";
      }
    },
    onError: () => toast.error("Speech recognition error. Tap mic to retry."),
  });

  const openingMessages = isTestCall 
    ? ["Hello! This is a test call. Can you hear me? Try saying something!"]
    : ["Good morning! Did you sleep well last night?", "Rise and shine! How are you feeling?"];

  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  }, []);

  const handleEndCall = useCallback((showChallengeFirst = true) => {
    if (!isTestCall && showChallengeFirst && settings.challengeType !== 'none' && !showChallenge) {
      setShowChallenge(true);
      return;
    }
    shouldContinueRef.current = false;
    stopRingtone();
    cancelSpeech();
    scribe.stopListening();
    setIsConnected(false);
    toast.success(isTestCall ? "Test call ended! 🎉" : "Have an amazing day! 🌟");
    setTimeout(onEndCall, 1000);
  }, [isTestCall, settings.challengeType, showChallenge, stopRingtone, scribe, onEndCall]);

  useEffect(() => {
    setIsConnected(true);
    toast.success(isTestCall ? "Test call started! 🎤" : "AI Conversation started! 🌅");
    
    const initTimer = setTimeout(async () => {
      const greeting = openingMessages[Math.floor(Math.random() * openingMessages.length)];
      setConversationHistory([{ role: 'assistant', content: greeting }]);
      setIsSpeaking(true);
      setCurrentMessage(greeting);
      await new Promise<void>((resolve) => {
        speakWithElevenLabs(greeting, settings.voiceStyle, undefined, () => { setIsSpeaking(false); resolve(); }, () => { setIsSpeaking(false); resolve(); });
      });
      if (shouldContinueRef.current) scribe.startListening();
    }, isTestCall ? 500 : 1500);

    return () => { clearTimeout(initTimer); stopRingtone(); cancelSpeech(); scribe.stopListening(); };
  }, []);

  useEffect(() => {
    if (isConnected && elapsedTime < talkDuration * 60) {
      const timer = setInterval(() => setElapsedTime(prev => { elapsedTimeRef.current = prev + 1; return prev + 1; }), 1000);
      return () => clearInterval(timer);
    } else if (!isTestCall && elapsedTime >= talkDuration * 60) {
      handleEndCall(false);
    }
  }, [isConnected, elapsedTime, talkDuration, isTestCall, handleEndCall]);

  const progress = (elapsedTime / (talkDuration * 60)) * 100;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (showChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300">
        <WakeUpChallenge challengeType={settings.challengeType} difficulty={settings.challengeDifficulty} onComplete={() => { setShowChallenge(false); handleEndCall(false); }} onFail={() => toast.error("Wrong! Try again!")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300">
      <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl">
        <div className="text-center space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className={`p-4 rounded-full ${isSpeaking ? 'bg-green-500' : scribe.isListening ? 'bg-blue-500 animate-pulse' : 'bg-orange-500'}`}>
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">{isTestCall ? '🧪 Test Call' : 'AI Conversation'}</h2>
            <p className="text-sm text-gray-600">{isSpeaking ? 'AI Speaking...' : scribe.isListening ? '🎤 Listening...' : isProcessing ? 'Processing...' : 'Your Turn'}</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 min-h-[80px]">
            <div className="flex items-start gap-2">
              <Volume2 className="w-5 h-5 text-orange-500 mt-0.5" />
              <p className="text-gray-700 text-sm text-left">{currentMessage || "Connecting..."}</p>
            </div>
          </div>

          {(scribe.isListening || scribe.transcript) && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Mic className="w-5 h-5 text-blue-500 mt-0.5" />
                <p className="text-gray-700 text-sm text-left">{scribe.transcript || "Listening..."}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatTime(elapsedTime)}</span>
              <span>-{formatTime(talkDuration * 60 - elapsedTime)}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => scribe.isListening ? scribe.stopListening() : scribe.startListening()} disabled={isSpeaking || isProcessing} className={`flex-1 py-6 rounded-xl ${scribe.isListening ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}>
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : scribe.isListening ? <><MicOff className="w-6 h-6 mr-2" />Stop</> : <><Mic className="w-6 h-6 mr-2" />Speak</>}
            </Button>
            <Button onClick={() => handleEndCall(!isTestCall)} variant="destructive" className="py-6 px-6 rounded-xl">
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
