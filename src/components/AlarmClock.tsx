import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Clock, Phone, Settings, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

interface AlarmClockProps {
  onStartCall: (alarmTime: string, talkDuration: number) => void;
}

export const AlarmClock = ({ onStartCall }: AlarmClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarmTime, setAlarmTime] = useState("07:00");
  const [talkDuration, setTalkDuration] = useState([5]);
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  const [timeUntilAlarm, setTimeUntilAlarm] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAlarmSet) {
      const now = new Date();
      const [hours, minutes] = alarmTime.split(':').map(Number);
      const alarmDate = new Date();
      alarmDate.setHours(hours, minutes, 0, 0);
      
      // If alarm time is earlier than now, set it for tomorrow
      if (alarmDate <= now) {
        alarmDate.setDate(alarmDate.getDate() + 1);
      }
      
      const timeDiff = alarmDate.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilAlarm(`${hoursLeft}h ${minutesLeft}m`);
      
      // Check if it's time for the alarm
      if (timeDiff <= 1000 && timeDiff > -1000) {
        handleAlarmTrigger();
      }
    }
  }, [currentTime, alarmTime, isAlarmSet]);

  const handleAlarmTrigger = () => {
    setIsAlarmSet(false);
    toast.success("Good morning! Your AI motivator is calling you!");
    onStartCall(alarmTime, talkDuration[0]);
  };

  const handleSetAlarm = () => {
    setIsAlarmSet(true);
    toast.success(`Alarm set for ${alarmTime} with ${talkDuration[0]} minute motivation session!`);
  };

  const handleCancelAlarm = () => {
    setIsAlarmSet(false);
    toast.info("Alarm cancelled");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: "Good Morning", icon: Sun };
    if (hour < 17) return { text: "Good Afternoon", icon: Sun };
    return { text: "Good Evening", icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <div className="min-h-screen bg-gradient-dawn flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 bg-white/80 backdrop-blur-glass border-0 shadow-glass">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GreetingIcon className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">{greeting.text}</h1>
          </div>
          
          <div className="bg-gradient-sunrise rounded-2xl p-6 mb-6">
            <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-4xl font-bold text-foreground mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-muted-foreground">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="alarm-time" className="text-sm font-medium text-foreground mb-2 block">
              Set Wake-up Time
            </Label>
            <Input
              id="alarm-time"
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              className="text-lg p-3 bg-white/50 border-accent/30"
              disabled={isAlarmSet}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-3 block">
              AI Talk Duration: {talkDuration[0]} minutes
            </Label>
            <Slider
              value={talkDuration}
              onValueChange={setTalkDuration}
              max={10}
              min={1}
              step={1}
              className="py-4"
              disabled={isAlarmSet}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 min</span>
              <span>10 min</span>
            </div>
          </div>

          {isAlarmSet && (
            <div className="bg-gradient-morning rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground">Alarm set for</div>
              <div className="text-xl font-bold text-foreground">{alarmTime}</div>
              <div className="text-sm font-semibold text-primary">Time remaining: {timeUntilAlarm}</div>
            </div>
          )}

          <div className="flex gap-3">
            {!isAlarmSet ? (
              <Button 
                onClick={handleSetAlarm}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                size="lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Set Alarm
              </Button>
            ) : (
              <Button 
                onClick={handleCancelAlarm}
                variant="destructive"
                className="flex-1 py-3"
                size="lg"
              >
                Cancel Alarm
              </Button>
            )}
            
            <Button 
              onClick={() => onStartCall(alarmTime, talkDuration[0])}
              variant="secondary"
              className="flex-1 py-3"
              size="lg"
            >
              <Phone className="h-4 w-4 mr-2" />
              Test Call
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};