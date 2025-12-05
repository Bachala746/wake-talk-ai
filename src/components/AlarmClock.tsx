import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Phone, Settings, Sun, Moon, Trash2, Edit, Sparkles, Flame, Zap } from "lucide-react";
import { toast } from "sonner";

const motivationalQuotes = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
  { quote: "Dream it. Wish it. Do it.", author: "Unknown" },
  { quote: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { quote: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { quote: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { quote: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
];

interface Alarm {
  id: string;
  time: string;
  label: string;
  duration: number;
  days: string[];
  isActive: boolean;
}

interface AlarmClockProps {
  onStartCall: (alarmTime: string, talkDuration: number) => void;
}

export const AlarmClock = ({ onStartCall }: AlarmClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  
  // Form states
  const [alarmTime, setAlarmTime] = useState("07:00");
  const [alarmLabel, setAlarmLabel] = useState("Wake up");
  const [talkDuration, setTalkDuration] = useState([5]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Rotate motivational quotes
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % motivationalQuotes.length);
    }, 8000);
    return () => clearInterval(quoteTimer);
  }, []);

  // Load alarms from localStorage
  useEffect(() => {
    const savedAlarms = localStorage.getItem('alarms');
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms));
    }
  }, []);

  // Save alarms to localStorage
  useEffect(() => {
    if (alarms.length > 0) {
      localStorage.setItem('alarms', JSON.stringify(alarms));
    }
  }, [alarms]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check all active alarms
  useEffect(() => {
    const now = new Date();
    
    alarms.forEach((alarm) => {
      if (!alarm.isActive) return;
      
      const [hours, minutes] = alarm.time.split(':').map(Number);
      const alarmDate = new Date();
      alarmDate.setHours(hours, minutes, 0, 0);
      
      if (alarmDate <= now) {
        alarmDate.setDate(alarmDate.getDate() + 1);
      }
      
      const timeDiff = alarmDate.getTime() - now.getTime();
      
      // Trigger alarm if within 1 second window
      if (timeDiff <= 1000 && timeDiff > -1000) {
        handleAlarmTrigger(alarm);
      }
    });
  }, [currentTime, alarms]);

  const handleAlarmTrigger = (alarm: Alarm) => {
    setAlarms(prev => prev.map(a => 
      a.id === alarm.id ? { ...a, isActive: false } : a
    ));
    toast.success(`Good morning! "${alarm.label}" - Your AI motivator is calling you!`);
    onStartCall(alarm.time, alarm.duration);
  };

  const handleSaveAlarm = () => {
    if (editingAlarmId) {
      // Update existing alarm
      setAlarms(prev => prev.map(a => 
        a.id === editingAlarmId 
          ? { ...a, time: alarmTime, label: alarmLabel, duration: talkDuration[0], days: selectedDays }
          : a
      ));
      toast.success(`Alarm "${alarmLabel}" updated!`);
    } else {
      // Create new alarm
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        time: alarmTime,
        label: alarmLabel,
        duration: talkDuration[0],
        days: selectedDays,
        isActive: true
      };
      setAlarms(prev => [...prev, newAlarm]);
      const daysText = selectedDays.length > 0 ? ` on ${selectedDays.join(', ')}` : '';
      toast.success(`Alarm "${alarmLabel}" set for ${alarmTime}${daysText}!`);
    }
    closeDialog();
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
    toast.info("Alarm deleted");
  };

  const openEditDialog = (alarm: Alarm) => {
    setEditingAlarmId(alarm.id);
    setAlarmTime(alarm.time);
    setAlarmLabel(alarm.label);
    setTalkDuration([alarm.duration]);
    setSelectedDays(alarm.days);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingAlarmId(null);
    setAlarmTime("07:00");
    setAlarmLabel("Wake up");
    setTalkDuration([5]);
    setSelectedDays([]);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAlarmId(null);
  };

  const getTimeUntilAlarm = (alarm: Alarm) => {
    const now = new Date();
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const alarmDate = new Date();
    alarmDate.setHours(hours, minutes, 0, 0);
    
    if (alarmDate <= now) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }
    
    const timeDiff = alarmDate.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursLeft}h ${minutesLeft}m`;
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
    <div className="min-h-screen bg-gradient-dawn flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-glow opacity-50" />
      </div>

      <Card className="w-full max-w-lg p-8 bg-white/85 backdrop-blur-xl border border-white/50 shadow-glass relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          {/* Greeting with icon */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-warm p-3 rounded-2xl shadow-lg animate-float">
              <GreetingIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {greeting.text}
            </h1>
          </div>
          
          {/* Time display */}
          <div className="bg-gradient-sunrise rounded-3xl p-8 mb-6 relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
            <div className="relative">
              <div className="inline-flex items-center justify-center bg-white/50 rounded-full p-3 mb-4 shadow-inner">
                <Clock className="h-8 w-8 text-primary animate-pulse-soft" />
              </div>
              <div className="text-5xl font-bold text-foreground mb-2 tracking-tight">
                {formatTime(currentTime)}
              </div>
              <div className="text-muted-foreground font-medium">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-2xl p-5 relative overflow-hidden border border-primary/10 shadow-sm transition-all duration-500">
            <div className="absolute top-3 right-3">
              <Sparkles className="h-5 w-5 text-accent animate-pulse-soft" />
            </div>
            <div className="absolute bottom-3 left-3">
              <Zap className="h-4 w-4 text-primary/30" />
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-gradient-warm rounded-xl p-2.5 shrink-0 shadow-md">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div className="min-h-[70px] flex flex-col justify-center text-left">
                <p className="text-base font-medium text-foreground italic leading-relaxed">
                  "{motivationalQuotes[currentQuoteIndex].quote}"
                </p>
                <p className="text-sm text-primary font-semibold mt-2">
                  — {motivationalQuotes[currentQuoteIndex].author}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Alarms List */}
          <div className="space-y-3">
            {alarms.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="bg-gradient-warm w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg animate-float">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <p className="text-xl font-bold text-foreground mb-2">Ready to start your day right?</p>
                <p className="text-muted-foreground">Add your first AI-powered motivational alarm!</p>
              </div>
            ) : (
              alarms.map((alarm, index) => (
                <Card 
                  key={alarm.id} 
                  className="p-5 bg-white/60 backdrop-blur-sm border border-white/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className={`text-4xl font-bold ${alarm.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          {alarm.time}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-lg">{alarm.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {alarm.duration} min talk
                            {alarm.days.length > 0 && ` • ${alarm.days.join(', ')}`}
                          </div>
                          {alarm.isActive && (
                            <div className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-semibold mt-2 px-2 py-1 rounded-full">
                              <Zap className="h-3 w-3" />
                              {getTimeUntilAlarm(alarm)} remaining
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-primary/10"
                        onClick={() => openEditDialog(alarm)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive/10"
                        onClick={() => deleteAlarm(alarm.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant={alarm.isActive ? "default" : "outline"}
                        size="sm"
                        className={alarm.isActive ? "bg-gradient-warm border-0 shadow-md" : ""}
                        onClick={() => toggleAlarm(alarm.id)}
                      >
                        {alarm.isActive ? "ON" : "OFF"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={openNewDialog}
              className="flex-1 bg-gradient-warm hover:opacity-90 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              size="lg"
            >
              <Clock className="h-5 w-5 mr-2" />
              Add Alarm
            </Button>
            
            <Button 
              onClick={() => onStartCall("now", 5)}
              variant="outline"
              className="flex-1 py-6 rounded-xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
              size="lg"
            >
              <Phone className="h-5 w-5 mr-2 text-primary" />
              Test Call
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {editingAlarmId ? "Edit Alarm" : "New AI Alarm"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="dialog-alarm-time" className="text-sm font-medium mb-2 block">
                Time
              </Label>
              <Input
                id="dialog-alarm-time"
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="text-lg p-3"
              />
            </div>

            <div>
              <Label htmlFor="alarm-label" className="text-sm font-medium mb-2 block">
                Label
              </Label>
              <Input
                id="alarm-label"
                type="text"
                value={alarmLabel}
                onChange={(e) => setAlarmLabel(e.target.value)}
                placeholder="Wake up"
                className="p-3"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">
                AI Talk Duration: {talkDuration[0]} minutes
              </Label>
              <Slider
                value={talkDuration}
                onValueChange={setTalkDuration}
                max={10}
                min={1}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 min</span>
                <span>10 min</span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Repeat Days
              </Label>
              <div className="flex gap-2 flex-wrap">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={selectedDays.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day)}
                    className="px-4"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAlarm}
              className="flex-1 sm:flex-none"
            >
              <Settings className="h-4 w-4 mr-2" />
              {editingAlarmId ? "Update Alarm" : "Save Alarm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};