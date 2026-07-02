import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneOff, Volume2, MessageSquare, Mic, Radio, Zap } from "lucide-react";
import { toast } from "sonner";
import { AlarmSettings, defaultAlarmSettings } from "@/lib/alarmSettings";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { SequentialChallengeRunner } from "./SequentialChallengeRunner";
import { useElevenLabsConversation } from "@/hooks/useElevenLabsConversation";
import { AudioWaveform } from "./AudioWaveform";
import { SpeakingAvatar } from "./SpeakingAvatar";
import { useTheme } from "@/hooks/useTheme";
import { SunriseAmbience } from "./SunriseAmbience";

interface RealtimeTwoWayCallProps {
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

export const RealtimeTwoWayCall = ({ 
  alarmTime, 
  talkDuration, 
  settings = defaultAlarmSettings, 
  onEndCall, 
  isTestCall = false 
}: RealtimeTwoWayCallProps) => {
  const { isDark } = useTheme();
  const [showChallenge, setShowChallenge] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<'connecting' | 'speaking' | 'listening'>('connecting');
  const [currentMessage, setCurrentMessage] = useState("Connecting to AI...");
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  
  const shouldContinueRef = useRef(true);
  const animationFrameRef = useRef<number | null>(null);

  const agentId = settings.elevenLabsAgentId || '';

  const conversation = useElevenLabsConversation({
    agentId,
    onConnect: () => {
      toast.success(isTestCall ? "🎤 Real-time test started!" : "🎤 Real-time AI connected!");
      setCurrentMode('listening');
      setCurrentMessage("I'm listening... speak to me!");
    },
    onDisconnect: () => {
      if (shouldContinueRef.current) toast.info("Conversation ended");
    },
    onMessage: (message) => {
      setConversationHistory(prev => [...prev, message]);
      if (message.role === 'assistant') setCurrentMessage(message.content);
    },
    onModeSwitch: (mode) => setCurrentMode(mode),
    onError: (error) => {
      console.error('Conversation error:', error);
      toast.error("Connection error. Please try again.");
    },
  });

  useEffect(() => {
    if (!conversation.isConnected) return;

    const updateLevels = () => {
      if (conversation.getInputVolume) {
        setInputLevel(conversation.getInputVolume() || 0);
      }
      if (conversation.getOutputVolume) {
        setOutputLevel(conversation.getOutputVolume() || 0);
      }
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [conversation.isConnected, conversation.getInputVolume, conversation.getOutputVolume]);

  useEffect(() => {
    const startCall = async () => {
      if (!agentId) {
        toast.error("No ElevenLabs Agent ID configured. Please add one in settings.");
        setTimeout(onEndCall, 2000);
        return;
      }

      await conversation.startConversation();
    };

    const timer = setTimeout(startCall, 500);

    return () => {
      clearTimeout(timer);
      shouldContinueRef.current = false;
      conversation.endConversation();
    };
  }, []);

  const handleDismiss = useCallback(() => {
    if (!isTestCall && settings.challengeType !== 'none') {
      setShowChallenge(true);
      shouldContinueRef.current = false;
      conversation.endConversation();
      return;
    }
    
    shouldContinueRef.current = false;
    conversation.endConversation();
    toast.success(isTestCall ? "Test call ended! 🎉" : "Have an amazing day! 🌟");
    setTimeout(() => onEndCall(0), 1000);
  }, [isTestCall, settings.challengeType, conversation, onEndCall]);

  const handleChallengeComplete = useCallback(() => {
    setShowChallenge(false);
    toast.success("Challenge completed! Have an amazing day! 🌟");
    setTimeout(() => onEndCall(0, 0, true), 1000);
  }, [onEndCall]);

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

  if (showChallenge) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <SunriseAmbience />
        <div className="relative z-10 w-full flex items-center justify-center">
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
          <ChallengeHost
            settings={settings}
            onComplete={handleChallengeComplete}
            onFail={handleChallengeFail}
            onEscalate={handleChallengeEscalate}
          />
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <SunriseAmbience />
      <Card className={`relative z-10 w-full max-w-md p-6 backdrop-blur-lg shadow-2xl rounded-3xl ${
        isDark ? 'bg-slate-800/95' : 'bg-white/95'
      }`}>
        <div className="text-center space-y-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              isDark ? 'text-yellow-300 bg-yellow-900/30' : 'text-yellow-600 bg-yellow-100'
            }`}>
              Real-Time AI • Zero Latency
            </span>
          </div>

          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <SpeakingAvatar type="user" isActive={currentMode === 'listening'} size="md" />
              <span className={`text-xs font-medium ${currentMode === 'listening' ? (isDark ? 'text-blue-400' : 'text-blue-600') : 'text-muted-foreground'}`}>You</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <SpeakingAvatar type="ai" isActive={currentMode === 'speaking'} size="md" />
              <span className={`text-xs font-medium ${currentMode === 'speaking' ? (isDark ? 'text-emerald-400' : 'text-green-600') : 'text-muted-foreground'}`}>AI</span>
            </div>
          </div>
            
          <h2 className="text-xl font-bold text-foreground">
            {isTestCall ? '🧪 Real-Time Test' : '⚡ AI Conversation'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentMode === 'speaking' 
              ? '🔊 AI Speaking...' 
              : currentMode === 'listening'
                ? '🎤 Listening to you...' 
                : '📡 Connecting...'}
          </p>

          {conversation.isConnected && (
            <div className="flex justify-center gap-6 py-2">
              <AudioWaveform 
                isActive={currentMode === 'listening'} 
                type="user" 
                label="You"
                volumeLevel={inputLevel}
              />
              <AudioWaveform 
                isActive={currentMode === 'speaking'} 
                type="ai" 
                label="AI"
                volumeLevel={outputLevel}
              />
            </div>
          )}

          <div className={`rounded-xl p-4 min-h-[80px] border ${
            isDark 
              ? 'bg-indigo-900/30 border-indigo-700/30' 
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
          }`}>
            <div className="flex items-start gap-2">
              <MessageSquare className={`w-5 h-5 mt-0.5 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
              <p className={`text-sm text-left ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{currentMessage}</p>
            </div>
          </div>

          {conversation.currentTranscript && (
            <div className={`rounded-xl p-4 border ${
              isDark ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-100'
            }`}>
              <div className="flex items-start gap-2">
                <Mic className={`w-5 h-5 mt-0.5 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <p className={`text-sm text-left italic ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                  "{conversation.currentTranscript}"
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              conversation.isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
            }`} />
            <span className="text-xs text-muted-foreground">
              {conversation.isConnected ? 'Connected' : conversation.isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            {isTestCall 
              ? "Real-time mode: Just speak naturally!"
              : "Complete a challenge to dismiss the alarm."}
          </p>

          <Button 
            onClick={handleDismiss} 
            variant="destructive" 
            className="w-full py-6 rounded-xl text-lg"
          >
            <PhoneOff className="w-6 h-6 mr-2" />
            {isTestCall ? 'End Test' : 'Dismiss Alarm'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
