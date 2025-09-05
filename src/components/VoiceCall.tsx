import { useState, useEffect } from "react";
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

  const motivationalMessages = [
    "Good morning, champion! Today is a brand new day full of endless possibilities. You have the power to make it amazing!",
    "Rise and shine! You've been given another precious day to chase your dreams and make a difference in the world.",
    "Hello there, superstar! Remember, every sunrise brings new opportunities. You've got this, and I believe in you!",
    "Good morning, wonderful human! Today is your canvas - paint it with beautiful moments and positive energy.",
    "Wake up, dreamer! The world is waiting for your unique gifts and talents. Let's make today extraordinary together!",
    "Rise up, warrior! You have overcome challenges before, and you will conquer today too. Your strength is inspiring!",
    "Good morning, sunshine! You are capable of incredible things. Trust yourself and let your light shine bright today.",
    "Hello, amazing soul! Each morning is a fresh start, a new chapter. Write a beautiful story with your day today!"
  ];

  useEffect(() => {
    // Simulate connection
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      setIsPlaying(true);
      toast.success("AI Motivator connected! 🌅");
      speakMessage();
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (isConnected && elapsedTime < talkDuration * 60) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (elapsedTime >= talkDuration * 60) {
      handleAutoEndCall();
    }
  }, [isConnected, elapsedTime, talkDuration]);

  const speakMessage = () => {
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setCurrentMessage(randomMessage);
    
    // Use browser's speech synthesis as a fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(randomMessage);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        // Speak another message after a short pause if still in call
        if (elapsedTime < (talkDuration * 60) - 30) {
          setTimeout(() => {
            if (isConnected) speakMessage();
          }, 3000);
        }
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleAutoEndCall = () => {
    setIsConnected(false);
    setIsPlaying(false);
    toast.success("Have an amazing day ahead! 🌟");
    setTimeout(() => {
      onEndCall();
    }, 2000);
  };

  const handleManualEndCall = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setIsConnected(false);
    setIsPlaying(false);
    toast.info("Call ended. Have a great day!");
    onEndCall();
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

            <div className="bg-gradient-morning rounded-lg p-4 mb-6 min-h-[120px] flex items-center">
              <p className="text-sm text-foreground italic leading-relaxed">
                {currentMessage || "Preparing your morning motivation..."}
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
            <Button
              onClick={handleManualEndCall}
              variant="destructive"
              size="lg"
              className="px-8"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          )}
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          Your AI motivator is here to help you start the day with positive energy! 🌟
        </div>
      </Card>
    </div>
  );
};