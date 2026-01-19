import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneOff, Volume2, MessageSquare, Mic, Radio, Zap } from "lucide-react";
import { toast } from "sonner";
import { AlarmSettings, defaultAlarmSettings } from "@/lib/alarmSettings";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { useElevenLabsConversation } from "@/hooks/useElevenLabsConversation";

interface RealtimeTwoWayCallProps {
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

export const RealtimeTwoWayCall = ({ 
  alarmTime, 
  talkDuration, 
  settings = defaultAlarmSettings, 
  onEndCall, 
  isTestCall = false 
}: RealtimeTwoWayCallProps) => {
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
      console.log('Real-time conversation connected');
      toast.success(isTestCall ? "🎤 Real-time test started!" : "🎤 Real-time AI connected!");
      setCurrentMode('listening');
      setCurrentMessage("I'm listening... speak to me!");
    },
    onDisconnect: () => {
      console.log('Real-time conversation disconnected');
      if (shouldContinueRef.current) {
        toast.info("Conversation ended");
      }
    },
    onMessage: (message) => {
      setConversationHistory(prev => [...prev, message]);
      if (message.role === 'assistant') {
        setCurrentMessage(message.content);
      }
    },
    onModeSwitch: (mode) => {
      setCurrentMode(mode);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast.error("Connection error. Please try again.");
    },
  });

  // Audio level visualization
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

  // Start conversation on mount
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

  // Handle dismissal with challenges
  const handleDismiss = useCallback(() => {
    // Always require challenge for non-test calls
    if (!isTestCall && settings.challengeType !== 'none') {
      setShowChallenge(true);
      shouldContinueRef.current = false;
      conversation.endConversation();
      return;
    }
    
    // For test calls or if no challenge, end directly
    shouldContinueRef.current = false;
    conversation.endConversation();
    toast.success(isTestCall ? "Test call ended! 🎉" : "Have an amazing day! 🌟");
    setTimeout(onEndCall, 1000);
  }, [isTestCall, settings.challengeType, conversation, onEndCall]);

  // Handle challenge completion
  const handleChallengeComplete = useCallback(() => {
    setShowChallenge(false);
    toast.success("Challenge completed! Have an amazing day! 🌟");
    setTimeout(onEndCall, 1000);
  }, [onEndCall]);

  // Handle challenge failure
  const handleChallengeFail = useCallback(() => {
    toast.error("Wrong! Try again to dismiss the alarm!");
  }, []);

  // Generate audio bars based on level
  const generateBars = (level: number, count: number = 5) => {
    return Array.from({ length: count }, (_, i) => {
      const barHeight = Math.max(4, Math.min(32, level * 40 * (0.5 + Math.random() * 0.5)));
      return (
        <div
          key={i}
          className="w-1.5 bg-current rounded-full transition-all duration-75"
          style={{ height: `${barHeight}px` }}
        />
      );
    });
  };

  if (showChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300">
        <WakeUpChallenge 
          challengeType={settings.challengeType} 
          difficulty={settings.challengeDifficulty} 
          onComplete={handleChallengeComplete} 
          onFail={handleChallengeFail} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-t from-purple-600 via-indigo-500 to-blue-400">
      <Card className="w-full max-w-md p-6 bg-white/95 backdrop-blur-lg shadow-2xl rounded-3xl">
        <div className="text-center space-y-5">
          {/* Real-time indicator */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
              Real-Time AI • Zero Latency
            </span>
          </div>

          {/* Status indicator */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {/* Pulsing rings for active state */}
              {conversation.isConnected && (
                <>
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                    currentMode === 'speaking' ? 'bg-green-400' : 'bg-blue-400'
                  }`} style={{ animationDuration: '1.5s' }} />
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                    currentMode === 'speaking' ? 'bg-green-400' : 'bg-blue-400'
                  }`} style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                </>
              )}
              <div className={`relative p-4 rounded-full transition-all duration-300 ${
                currentMode === 'speaking' 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                  : currentMode === 'listening'
                    ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                {currentMode === 'speaking' ? (
                  <Volume2 className="w-8 h-8 text-white" />
                ) : currentMode === 'listening' ? (
                  <Mic className="w-8 h-8 text-white" />
                ) : (
                  <Radio className="w-8 h-8 text-white animate-pulse" />
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold">
              {isTestCall ? '🧪 Real-Time Test' : '⚡ AI Conversation'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentMode === 'speaking' 
                ? '🔊 AI Speaking...' 
                : currentMode === 'listening'
                  ? '🎤 Listening to you...' 
                  : '📡 Connecting...'}
            </p>
          </div>

          {/* Audio visualization */}
          {conversation.isConnected && (
            <div className="flex justify-center gap-8">
              {/* Input (user) visualization */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-0.5 h-8 text-blue-500">
                  {generateBars(inputLevel)}
                </div>
                <span className="text-xs text-gray-500">You</span>
              </div>
              
              {/* Output (AI) visualization */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-0.5 h-8 text-green-500">
                  {generateBars(outputLevel)}
                </div>
                <span className="text-xs text-gray-500">AI</span>
              </div>
            </div>
          )}

          {/* AI message display */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 min-h-[80px] border border-indigo-100">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-gray-700 text-sm text-left">{currentMessage}</p>
            </div>
          </div>

          {/* Recent transcript */}
          {conversation.currentTranscript && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <Mic className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-gray-700 text-sm text-left italic">
                  "{conversation.currentTranscript}"
                </p>
              </div>
            </div>
          )}

          {/* Connection status */}
          <div className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              conversation.isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-500">
              {conversation.isConnected ? 'Connected' : conversation.isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-500">
            {isTestCall 
              ? "Real-time mode: Just speak naturally!"
              : "Complete a challenge to dismiss the alarm."}
          </p>

          {/* Dismiss button */}
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
