import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Phone, Settings, Sun, Moon, Trash2, Edit, Sparkles, Flame, Zap, Volume2, Mic, Bell, MessageSquare, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlarmSettings,
  VoiceStyle,
  GreetingStyle,
  MessageTheme,
  RingtoneStyle,
  SnoozeLevel,
  ChallengeType,
  ChallengeDifficulty,
  InteractionMode,
  voiceStyles,
  greetingStyles,
  messageThemes,
  ringtoneStyles,
  snoozeLevels,
  challengeTypes,
  challengeDifficulties,
  interactionModes,
  defaultAlarmSettings,
} from "@/lib/alarmSettings";

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
  settings: AlarmSettings;
}

interface AlarmClockProps {
  onStartCall: (alarmTime: string, talkDuration: number, settings: AlarmSettings) => void;
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
  
  // Customization states
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(defaultAlarmSettings.interactionMode);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>(defaultAlarmSettings.voiceStyle);
  const [greetingStyle, setGreetingStyle] = useState<GreetingStyle>(defaultAlarmSettings.greetingStyle);
  const [userName, setUserName] = useState(defaultAlarmSettings.userName);
  const [messageTheme, setMessageTheme] = useState<MessageTheme>(defaultAlarmSettings.messageTheme);
  const [ringtoneStyle, setRingtoneStyle] = useState<RingtoneStyle>(defaultAlarmSettings.ringtoneStyle);
  const [snoozeLevel, setSnoozeLevel] = useState<SnoozeLevel>(defaultAlarmSettings.snoozeLevel);
  const [challengeType, setChallengeType] = useState<ChallengeType>(defaultAlarmSettings.challengeType);
  const [challengeDifficulty, setChallengeDifficulty] = useState<ChallengeDifficulty>(defaultAlarmSettings.challengeDifficulty);
  const [gradualVolume, setGradualVolume] = useState(defaultAlarmSettings.gradualVolume);

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
      const parsed = JSON.parse(savedAlarms);
      // Migration: add default settings to old alarms
      const migratedAlarms = parsed.map((alarm: any) => ({
        ...alarm,
        settings: alarm.settings || defaultAlarmSettings
      }));
      setAlarms(migratedAlarms);
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
    onStartCall(alarm.time, alarm.duration, alarm.settings);
  };

  const handleSaveAlarm = () => {
    const settings: AlarmSettings = {
      interactionMode,
      voiceStyle,
      greetingStyle,
      userName,
      messageTheme,
      ringtoneStyle,
      snoozeLevel,
      gradualVolume,
      challengeType,
      challengeDifficulty,
    };

    if (editingAlarmId) {
      // Update existing alarm
      setAlarms(prev => prev.map(a => 
        a.id === editingAlarmId 
          ? { ...a, time: alarmTime, label: alarmLabel, duration: talkDuration[0], days: selectedDays, settings }
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
        isActive: true,
        settings
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
    // Load settings
    setInteractionMode(alarm.settings.interactionMode || defaultAlarmSettings.interactionMode);
    setVoiceStyle(alarm.settings.voiceStyle);
    setGreetingStyle(alarm.settings.greetingStyle);
    setUserName(alarm.settings.userName);
    setMessageTheme(alarm.settings.messageTheme);
    setRingtoneStyle(alarm.settings.ringtoneStyle);
    setSnoozeLevel(alarm.settings.snoozeLevel);
    setGradualVolume(alarm.settings.gradualVolume);
    setChallengeType(alarm.settings.challengeType || defaultAlarmSettings.challengeType);
    setChallengeDifficulty(alarm.settings.challengeDifficulty || defaultAlarmSettings.challengeDifficulty);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingAlarmId(null);
    setAlarmTime("07:00");
    setAlarmLabel("Wake up");
    setTalkDuration([5]);
    setSelectedDays([]);
    // Reset to defaults
    setInteractionMode(defaultAlarmSettings.interactionMode);
    setVoiceStyle(defaultAlarmSettings.voiceStyle);
    setGreetingStyle(defaultAlarmSettings.greetingStyle);
    setUserName(defaultAlarmSettings.userName);
    setMessageTheme(defaultAlarmSettings.messageTheme);
    setRingtoneStyle(defaultAlarmSettings.ringtoneStyle);
    setSnoozeLevel(defaultAlarmSettings.snoozeLevel);
    setGradualVolume(defaultAlarmSettings.gradualVolume);
    setChallengeType(defaultAlarmSettings.challengeType);
    setChallengeDifficulty(defaultAlarmSettings.challengeDifficulty);
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-3 sm:px-4 py-12 sm:py-16 overflow-hidden">
        {/* Light warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-orange-200 to-amber-200" />
        
        {/* Subtle dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle, #78350f 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-white/30 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-40 right-1/4 w-80 h-80 bg-yellow-200/40 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-2">
          {/* Icon */}
          <div className="mb-6 sm:mb-8 animate-float">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/50 shadow-lg animate-glow-pulse">
              <Sun className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600" />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-slate-800 mb-4 sm:mb-6 tracking-tight leading-tight">
            Good Morning,
            <br />
            <span className="text-orange-600">
              Rise & Shine
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-700 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed px-2">
            Your AI-powered morning companion that wakes you up gently and starts your day with meaningful conversations.
          </p>

          {/* CTA Button */}
          <Button
            onClick={openNewDialog}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-5 sm:py-6 rounded-xl text-base sm:text-lg shadow-xl hover:shadow-orange-400/40 transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto"
          >
            <Clock className="h-5 w-5 mr-2 shrink-0" />
            <span className="truncate">Set Your Wake-up Time</span>
          </Button>

          {/* Feature highlights */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-slate-600 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Daily wake-up calls</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>AI conversations to energize you</span>
            </div>
          </div>

          {/* Motivational Quote in Hero */}
          <div className="mt-8 sm:mt-10 max-w-xl mx-auto">
            <div className="p-4 sm:p-5 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 sm:p-2.5 shrink-0 shadow-md">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-h-[50px] sm:min-h-[60px] flex flex-col justify-center min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-medium text-slate-700 italic leading-relaxed break-words">
                    "{motivationalQuotes[currentQuoteIndex].quote}"
                  </p>
                  <p className="text-xs sm:text-sm text-orange-600 font-semibold mt-2 truncate">
                    — {motivationalQuotes[currentQuoteIndex].author}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="relative py-10 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-amber-200 via-amber-200 to-amber-100 min-h-screen">
        <div className="max-w-lg mx-auto w-full">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-warm mb-4 shadow-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Setup Your Morning Routine</h2>
          </div>

          {/* Current Time Display */}
          <Card className="p-4 sm:p-6 mb-6 sm:mb-8 bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-gradient-warm p-2 sm:p-2.5 rounded-xl shadow-md shrink-0">
                  <GreetingIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-semibold text-foreground">{greeting.text}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{formatTime(currentTime)}</div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </Card>

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
                  className="p-3 sm:p-4 bg-white/60 backdrop-blur-sm border border-white/50 shadow-md hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col gap-3">
                    {/* Top row: Time and controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className={`text-2xl sm:text-3xl font-bold shrink-0 ${alarm.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {alarm.time}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-primary/10 h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => openEditDialog(alarm)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-destructive/10 h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => deleteAlarm(alarm.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant={alarm.isActive ? "default" : "outline"}
                          size="sm"
                          className={`h-8 px-3 text-xs sm:text-sm ${alarm.isActive ? "bg-gradient-warm border-0 shadow-md" : ""}`}
                          onClick={() => toggleAlarm(alarm.id)}
                        >
                          {alarm.isActive ? "ON" : "OFF"}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Bottom row: Details */}
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-base sm:text-lg truncate">{alarm.label}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {alarm.duration} min talk
                        {alarm.days.length > 0 && ` • ${alarm.days.join(', ')}`}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <span className={`px-1.5 py-0.5 rounded shrink-0 ${alarm.settings.interactionMode === 'two-way' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {alarm.settings.interactionMode === 'two-way' ? '💬 Two-Way' : '📢 One-Way'}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span>{messageThemes.find(t => t.value === alarm.settings.messageTheme)?.icon}</span>
                          <span className="capitalize">{alarm.settings.messageTheme}</span>
                        </span>
                      </div>
                      {alarm.isActive && (
                        <div className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-semibold mt-2 px-2 py-1 rounded-full">
                          <Zap className="h-3 w-3 shrink-0" />
                          <span className="truncate">{getTimeUntilAlarm(alarm)} remaining</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button 
              onClick={openNewDialog}
              className="flex-1 bg-gradient-warm hover:opacity-90 text-white py-5 sm:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base min-w-0"
              size="lg"
            >
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">Add Alarm</span>
            </Button>
            
            <Button 
              onClick={() => onStartCall("now", 5, defaultAlarmSettings)}
              variant="outline"
              className="flex-1 py-5 sm:py-6 rounded-xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 text-sm sm:text-base min-w-0"
              size="lg"
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-primary shrink-0" />
              <span className="truncate">Test Call</span>
            </Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto mx-2 w-[calc(100%-1rem)] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <span className="truncate">{editingAlarmId ? "Edit Alarm" : "New AI Alarm"}</span>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 h-auto p-1">
              <TabsTrigger value="basic" className="text-[10px] sm:text-xs px-1 py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Basic</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="text-[10px] sm:text-xs px-1 py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Voice</span>
              </TabsTrigger>
              <TabsTrigger value="sound" className="text-[10px] sm:text-xs px-1 py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Sound</span>
              </TabsTrigger>
              <TabsTrigger value="challenge" className="text-[10px] sm:text-xs px-1 py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                <Gamepad2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Challenge</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Interaction Mode Selector */}
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
                  Interaction Mode
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {interactionModes.map((mode) => (
                    <Button
                      key={mode.value}
                      type="button"
                      variant={interactionMode === mode.value ? "default" : "outline"}
                      className={`h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 ${
                        interactionMode === mode.value ? 'ring-2 ring-primary ring-offset-1' : ''
                      }`}
                      onClick={() => setInteractionMode(mode.value)}
                    >
                      <span className="text-xl sm:text-2xl">{mode.icon}</span>
                      <span className="font-semibold text-xs sm:text-sm">{mode.label}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight line-clamp-2">{mode.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

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
                <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
                  Repeat Days
                </Label>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={selectedDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day)}
                      className="px-2 sm:px-3 h-8 text-xs sm:text-sm"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block flex items-center gap-2">
                  <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Voice Style
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {voiceStyles.map((style) => (
                    <Button
                      key={style.value}
                      type="button"
                      variant={voiceStyle === style.value ? "default" : "outline"}
                      onClick={() => setVoiceStyle(style.value)}
                      className="flex flex-col h-auto py-2.5 sm:py-3 px-2 sm:px-4 min-w-0"
                    >
                      <span className="font-semibold text-xs sm:text-sm truncate w-full">{style.label}</span>
                      <span className="text-[10px] sm:text-xs opacity-70 truncate w-full">{style.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Greeting Style
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {greetingStyles.map((style) => (
                    <Button
                      key={style.value}
                      type="button"
                      variant={greetingStyle === style.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGreetingStyle(style.value)}
                    >
                      {style.label}
                    </Button>
                  ))}
                </div>
                {greetingStyle === 'personalized' && (
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Message Theme
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {messageThemes.map((theme) => (
                    <Button
                      key={theme.value}
                      type="button"
                      variant={messageTheme === theme.value ? "default" : "outline"}
                      onClick={() => setMessageTheme(theme.value)}
                      className="flex items-center gap-1.5 sm:gap-2 justify-start py-2.5 px-2 sm:px-3 h-auto min-w-0"
                    >
                      <span className="shrink-0">{theme.icon}</span>
                      <span className="font-semibold text-xs sm:text-sm truncate">{theme.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sound" className="space-y-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Ringtone Style
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ringtoneStyles.map((style) => (
                    <Button
                      key={style.value}
                      type="button"
                      variant={ringtoneStyle === style.value ? "default" : "outline"}
                      onClick={() => setRingtoneStyle(style.value)}
                      className="flex flex-col h-auto py-2.5 sm:py-3 px-2 min-w-0"
                    >
                      <span className="font-semibold text-xs sm:text-sm truncate w-full">{style.label}</span>
                      <span className="text-[10px] sm:text-xs opacity-70 truncate w-full">{style.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border bg-muted/50">
                <div className="min-w-0 flex-1">
                  <Label className="text-xs sm:text-sm font-medium">Gradual Volume</Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Start soft and increase</p>
                </div>
                <Switch
                  checked={gradualVolume}
                  onCheckedChange={setGradualVolume}
                  className="shrink-0"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Snooze Intensity
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {snoozeLevels.map((level) => (
                    <Button
                      key={level.value}
                      type="button"
                      variant={snoozeLevel === level.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSnoozeLevel(level.value)}
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {snoozeLevels.find(l => l.value === snoozeLevel)?.description}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="challenge" className="space-y-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block flex items-center gap-2">
                  <Gamepad2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Wake-up Challenge
                </Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
                  Must complete this challenge to dismiss the alarm
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {challengeTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={challengeType === type.value ? "default" : "outline"}
                      onClick={() => setChallengeType(type.value)}
                      className="flex items-center gap-1.5 sm:gap-2 justify-start h-auto py-2.5 sm:py-3 px-2 sm:px-3 min-w-0"
                    >
                      <span className="text-base sm:text-lg shrink-0">{type.icon}</span>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-semibold text-xs sm:text-sm truncate">{type.label}</div>
                        <div className="text-[10px] sm:text-xs opacity-70 truncate">{type.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {challengeType !== 'none' && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Challenge Difficulty
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {challengeDifficulties.map((diff) => (
                      <Button
                        key={diff.value}
                        type="button"
                        variant={challengeDifficulty === diff.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChallengeDifficulty(diff.value)}
                      >
                        {diff.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {challengeDifficulties.find(d => d.value === challengeDifficulty)?.description}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAlarm}
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">{editingAlarmId ? "Update Alarm" : "Save Alarm"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
