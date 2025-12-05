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

          {/* Motivational Quote */}
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-4 mb-2 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Sparkles className="h-4 w-4 text-primary/40" />
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 rounded-full p-2 shrink-0">
                <Flame className="h-4 w-4 text-primary" />
              </div>
              <div className="min-h-[60px] flex flex-col justify-center">
                <p className="text-sm font-medium text-foreground italic leading-relaxed">
                  "{motivationalQuotes[currentQuoteIndex].quote}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  — {motivationalQuotes[currentQuoteIndex].author}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Alarms List */}
          <div className="space-y-3">
            {alarms.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-3 text-primary/60" />
                <p className="text-lg font-medium text-foreground mb-1">Ready to start your day right?</p>
                <p className="text-sm text-muted-foreground">Add your first AI-powered motivational alarm!</p>
              </div>
            ) : (
              alarms.map((alarm) => (
                <Card key={alarm.id} className="p-4 bg-white/50 border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-bold text-foreground">
                          {alarm.time}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{alarm.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {alarm.duration} min talk
                            {alarm.days.length > 0 && ` • ${alarm.days.join(', ')}`}
                          </div>
                          {alarm.isActive && (
                            <div className="text-xs text-primary font-medium mt-1">
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
                        onClick={() => openEditDialog(alarm)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlarm(alarm.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant={alarm.isActive ? "default" : "outline"}
                        size="sm"
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
          <div className="flex gap-3">
            <Button 
              onClick={openNewDialog}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3"
              size="lg"
            >
              <Clock className="h-4 w-4 mr-2" />
              Add Alarm
            </Button>
            
            <Button 
              onClick={() => onStartCall("now", 5)}
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