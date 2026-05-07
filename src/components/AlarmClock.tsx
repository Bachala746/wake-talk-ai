import { useState, useEffect, useRef } from "react";
import { CheatPenaltyIndicator } from "@/components/CheatPenaltyIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Phone, Settings, Sun, Moon, Trash2, Edit, Sparkles, Flame, Zap, Volume2, Mic, Bell, MessageSquare, Gamepad2, QrCode, Camera, CameraOff, CheckCircle, XCircle, Search, Plus, Image, BarChart3, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { ElevenLabsQuotaPanel } from "./ElevenLabsQuotaPanel";
import { PermissionCheck } from "./PermissionCheck";
import { MicrophoneTest } from "./MicrophoneTest";
import { PreAlarmCheck } from "./PreAlarmCheck";
import { SunriseAmbience } from "./SunriseAmbience";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlarmSettings,
  VoiceStyle,
  GreetingStyle,
  MessageTheme,
  RingtoneStyle,
  SnoozeLevel,
  MotivationIntensity,
  ChallengeType,
  ChallengeDifficulty,
  InteractionMode,
  SpeakMatchSettings,
  SpeakMatchParagraphLength,
  SpeakMatchAccuracy,
  SpeakMatchParagraphType,
  ObjectVerifySettings,
  StoredObject,
  ChallengeSequenceItem,
  SequentialChallengeSettings,
  FailureRetryBehavior,
  voiceStyles,
  greetingStyles,
  messageThemes,
  ringtoneStyles,
  snoozeLevels,
  motivationIntensities,
  challengeTypes,
  challengeCategories,
  getCategoryForChallenge,
  challengeDifficulties,
  interactionModes,
  failureRetryBehaviors,
  defaultAlarmSettings,
  defaultSpeakMatchSettings,
  defaultObjectVerifySettings,
  defaultSequentialChallengeSettings,
  MAX_CHALLENGES_PER_ALARM,
  speakMatchParagraphLengths,
  speakMatchAccuracyLevels,
  speakMatchTimeLimits,
  speakMatchRetryLimits,
  speakMatchParagraphTypes,
} from "@/lib/alarmSettings";
import { getStoredObjects, addStoredObject, removeStoredObject, captureImageFromVideo } from "@/lib/objectStore";
import { getExampleMessage } from "@/lib/motivationLibrary";

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
  onStartCall: (alarmTime: string, talkDuration: number, settings: AlarmSettings, isTestCall?: boolean) => void;
}

export const AlarmClock = ({ onStartCall }: AlarmClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [micTestOpen, setMicTestOpen] = useState(false);
  const [preCheckAlarm, setPreCheckAlarm] = useState<Alarm | null>(null);
  const triggeredPreChecksRef = useRef<Set<string>>(new Set());
  
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
  const [motivationIntensity, setMotivationIntensity] = useState<MotivationIntensity>(defaultAlarmSettings.motivationIntensity);
  const [challengeType, setChallengeType] = useState<ChallengeType>(defaultAlarmSettings.challengeType);
  const [challengeDifficulty, setChallengeDifficulty] = useState<ChallengeDifficulty>(defaultAlarmSettings.challengeDifficulty);
  const [gradualVolume, setGradualVolume] = useState(defaultAlarmSettings.gradualVolume);
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState(defaultAlarmSettings.elevenLabsAgentId || '');
  
  // Speak & Match states
  const [smParagraphLength, setSmParagraphLength] = useState<SpeakMatchParagraphLength>(defaultSpeakMatchSettings.paragraphLength);
  const [smAccuracy, setSmAccuracy] = useState<SpeakMatchAccuracy>(defaultSpeakMatchSettings.accuracy);
  const [smTimeLimit, setSmTimeLimit] = useState(defaultSpeakMatchSettings.timeLimit);
  const [smRetryLimit, setSmRetryLimit] = useState(defaultSpeakMatchSettings.retryLimit);
  const [smParagraphType, setSmParagraphType] = useState<SpeakMatchParagraphType>(defaultSpeakMatchSettings.paragraphType);
  const [smCustomText, setSmCustomText] = useState(defaultSpeakMatchSettings.customText);

  // QR Code registration states
  const [registeredQrCode, setRegisteredQrCode] = useState('');
  const [qrScanMode, setQrScanMode] = useState(false);
  const [qrScannerReady, setQrScannerReady] = useState(false);
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Object verification states
  const [storedObjects, setStoredObjects] = useState<StoredObject[]>(() => getStoredObjects());
  const [objCaptureMode, setObjCaptureMode] = useState(false);
  const [objLabel, setObjLabel] = useState('');
  const [objCapturedImage, setObjCapturedImage] = useState<string | null>(null);
  const objVideoRef = useRef<HTMLVideoElement | null>(null);
  const objStreamRef = useRef<MediaStream | null>(null);
  const [ovSelectedIds, setOvSelectedIds] = useState<string[]>([]);
  const [ovStrictMatch, setOvStrictMatch] = useState(defaultObjectVerifySettings.strictMatch);
  const [ovSequential, setOvSequential] = useState(defaultObjectVerifySettings.sequential);
  const [ovConfidence, setOvConfidence] = useState(defaultObjectVerifySettings.confidenceThreshold);

  // Sequential multi-challenge states
  const [multiChallengeEnabled, setMultiChallengeEnabled] = useState(false);
  const [challengeSequence, setChallengeSequence] = useState<ChallengeSequenceItem[]>([]);
  const [failureRetryBehavior, setFailureRetryBehavior] = useState<FailureRetryBehavior>('continue');
  const [dynamicDifficulty, setDynamicDifficulty] = useState(false);
  const [maxExtraChallenges, setMaxExtraChallenges] = useState(1);
  const [voiceEncouragementEnabled, setVoiceEncouragementEnabled] = useState(true);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(console.error);
      }
    };
  }, []);
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
      
      // Pre-alarm check window: 2 minutes before, fire once per occurrence
      const preCheckKey = `${alarm.id}@${alarmDate.toDateString()}-${alarm.time}`;
      if (
        timeDiff <= 2 * 60 * 1000 &&
        timeDiff > 60 * 1000 &&
        !triggeredPreChecksRef.current.has(preCheckKey) &&
        !preCheckAlarm
      ) {
        triggeredPreChecksRef.current.add(preCheckKey);
        setPreCheckAlarm(alarm);
        toast.info(`⏰ "${alarm.label}" rings in 2 min — let's verify your mic & speakers.`, { duration: 5000 });
      }

      // Trigger alarm if within 1 second window
      if (timeDiff <= 1000 && timeDiff > -1000) {
        handleAlarmTrigger(alarm);
      }
    });
  }, [currentTime, alarms, preCheckAlarm]);

  const handleAlarmTrigger = (alarm: Alarm) => {
    setAlarms(prev => prev.map(a => 
      a.id === alarm.id ? { ...a, isActive: false } : a
    ));
    // Request notification permission for visibility
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    // Show notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ ${alarm.label}`, {
          body: 'Your AI motivator is calling you!',
          icon: '/favicon.ico',
          requireInteraction: true,
        });
      } catch { /* ignore */ }
    }
    toast.success(`Good morning! "${alarm.label}" - Your AI motivator is calling you!`);
    toast.warning("⚠️ Do not uninstall or force-close the app during an active alarm. Doing so will result in penalties.", { duration: 6000 });
    onStartCall(alarm.time, alarm.duration, alarm.settings);
  };

  const handleSaveAlarm = () => {
    const speakMatchSettingsObj: SpeakMatchSettings = {
      paragraphLength: smParagraphLength,
      accuracy: smAccuracy,
      timeLimit: smTimeLimit,
      retryLimit: smRetryLimit,
      paragraphType: smParagraphType,
      customText: smCustomText,
    };

    const objectVerifySettingsObj: ObjectVerifySettings = {
      requiredCount: ovSelectedIds.length,
      selectedObjectIds: ovSelectedIds,
      strictMatch: ovStrictMatch,
      sequential: ovSequential,
      confidenceThreshold: ovConfidence,
    };

    const sequentialChallengeSettingsObj: SequentialChallengeSettings = {
      enabled: multiChallengeEnabled,
      challenges: challengeSequence,
      failureRetryBehavior,
      dynamicDifficulty,
      maxExtraChallenges,
      voiceEncouragementEnabled,
    };

    const settings: AlarmSettings = {
      interactionMode,
      voiceStyle,
      greetingStyle,
      userName,
      messageTheme,
      ringtoneStyle,
      snoozeLevel,
      motivationIntensity,
      gradualVolume,
      challengeType: multiChallengeEnabled ? (challengeSequence[0]?.type || 'none') : challengeType,
      challengeDifficulty: multiChallengeEnabled ? (challengeSequence[0]?.difficulty || 'easy') : challengeDifficulty,
      elevenLabsAgentId: interactionMode === 'two-way' ? elevenLabsAgentId : '',
      speakMatchSettings: challengeType === 'speakMatch' ? speakMatchSettingsObj : undefined,
      registeredQrCode: challengeType === 'qrcode' ? registeredQrCode : undefined,
      objectVerifySettings: challengeType === 'objectVerify' ? objectVerifySettingsObj : undefined,
      sequentialChallengeSettings: multiChallengeEnabled ? sequentialChallengeSettingsObj : undefined,
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
    setMotivationIntensity(alarm.settings.motivationIntensity ?? defaultAlarmSettings.motivationIntensity);
    setGradualVolume(alarm.settings.gradualVolume);
    setChallengeType(alarm.settings.challengeType || defaultAlarmSettings.challengeType);
    setChallengeDifficulty(alarm.settings.challengeDifficulty || defaultAlarmSettings.challengeDifficulty);
    setElevenLabsAgentId(alarm.settings.elevenLabsAgentId || '');
    // Load speak & match settings
    const smS = alarm.settings.speakMatchSettings || defaultSpeakMatchSettings;
    setSmParagraphLength(smS.paragraphLength);
    setSmAccuracy(smS.accuracy);
    setSmTimeLimit(smS.timeLimit);
    setSmRetryLimit(smS.retryLimit);
    setSmParagraphType(smS.paragraphType);
    setSmCustomText(smS.customText);
    setRegisteredQrCode(alarm.settings.registeredQrCode || '');
    // Load object verification settings
    const ovS = alarm.settings.objectVerifySettings || defaultObjectVerifySettings;
    setOvSelectedIds(ovS.selectedObjectIds);
    setOvStrictMatch(ovS.strictMatch);
    setOvSequential(ovS.sequential);
    setOvConfidence(ovS.confidenceThreshold);
    setObjCaptureMode(false);
    setObjCapturedImage(null);
    setObjLabel('');
    setQrScanMode(false);
    setQrScanError(null);
    // Load sequential challenge settings
    const seqS = alarm.settings.sequentialChallengeSettings || defaultSequentialChallengeSettings;
    setMultiChallengeEnabled(seqS.enabled);
    setChallengeSequence(seqS.challenges);
    setFailureRetryBehavior(seqS.failureRetryBehavior);
    setDynamicDifficulty(seqS.dynamicDifficulty);
    setMaxExtraChallenges(seqS.maxExtraChallenges);
    setVoiceEncouragementEnabled(seqS.voiceEncouragementEnabled ?? true);
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
    setMotivationIntensity(defaultAlarmSettings.motivationIntensity);
    setGradualVolume(defaultAlarmSettings.gradualVolume);
    setChallengeType(defaultAlarmSettings.challengeType);
    setChallengeDifficulty(defaultAlarmSettings.challengeDifficulty);
    setElevenLabsAgentId('');
    // Reset speak & match to defaults
    setSmParagraphLength(defaultSpeakMatchSettings.paragraphLength);
    setSmAccuracy(defaultSpeakMatchSettings.accuracy);
    setSmTimeLimit(defaultSpeakMatchSettings.timeLimit);
    setSmRetryLimit(defaultSpeakMatchSettings.retryLimit);
    setSmParagraphType(defaultSpeakMatchSettings.paragraphType);
    setSmCustomText(defaultSpeakMatchSettings.customText);
    setRegisteredQrCode('');
    // Reset object verification
    setOvSelectedIds([]);
    setOvStrictMatch(defaultObjectVerifySettings.strictMatch);
    setOvSequential(defaultObjectVerifySettings.sequential);
    setOvConfidence(defaultObjectVerifySettings.confidenceThreshold);
    setObjCaptureMode(false);
    setObjCapturedImage(null);
    setObjLabel('');
    setQrScanMode(false);
    setQrScanError(null);
    // Reset sequential challenge settings
    setMultiChallengeEnabled(false);
    setChallengeSequence([]);
    setFailureRetryBehavior('continue');
    setDynamicDifficulty(false);
    setMaxExtraChallenges(1);
    setVoiceEncouragementEnabled(true);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAlarmId(null);
    // Stop QR scanner if running
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().catch(console.error);
      qrScannerRef.current = null;
    }
    // Stop object camera if running
    if (objStreamRef.current) {
      objStreamRef.current.getTracks().forEach(t => t.stop());
      objStreamRef.current = null;
    }
    setObjCaptureMode(false);
    setObjCapturedImage(null);
    setQrScanMode(false);
    setQrScanError(null);
  };

  // Object capture functions
  const startObjectCapture = async () => {
    setObjCaptureMode(true);
    setObjCapturedImage(null);
    setObjLabel('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      objStreamRef.current = stream;
      if (objVideoRef.current) {
        objVideoRef.current.srcObject = stream;
        objVideoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Failed to access camera');
      setObjCaptureMode(false);
    }
  };

  const captureObjectPhoto = () => {
    if (!objVideoRef.current) return;
    const imageData = captureImageFromVideo(objVideoRef.current);
    setObjCapturedImage(imageData);
    // Stop camera
    if (objStreamRef.current) {
      objStreamRef.current.getTracks().forEach(t => t.stop());
      objStreamRef.current = null;
    }
  };

  const importFromGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 320;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/jpeg', 0.7);
          setObjCapturedImage(imageData);
          setObjCaptureMode(true);
          // Stop any active camera
          if (objStreamRef.current) {
            objStreamRef.current.getTracks().forEach(t => t.stop());
            objStreamRef.current = null;
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const saveObject = () => {
    if (!objCapturedImage || !objLabel.trim()) {
      toast.error('Please capture a photo and add a label');
      return;
    }
    try {
      const newObj = addStoredObject(objLabel.trim(), objCapturedImage);
      setStoredObjects(getStoredObjects());
      setObjCaptureMode(false);
      setObjCapturedImage(null);
      setObjLabel('');
      toast.success(`"${newObj.label}" saved!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const deleteObject = (id: string) => {
    removeStoredObject(id);
    setStoredObjects(getStoredObjects());
    setOvSelectedIds(prev => prev.filter(oid => oid !== id));
    toast.info('Object removed');
  };

  const toggleObjectSelection = (id: string) => {
    setOvSelectedIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const startQrRegistration = async () => {
    setQrScanMode(true);
    setQrScanError(null);
    setQrScannerReady(false);
    
    // Wait for DOM element to render
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-register-reader");
        qrScannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (decodedText) => {
            setRegisteredQrCode(decodedText);
            setQrScanMode(false);
            html5QrCode.stop().catch(console.error);
            qrScannerRef.current = null;
            toast.success("QR code registered successfully!");
          },
          () => {} // ignore scan failures
        );
        setQrScannerReady(true);
      } catch (err) {
        console.error("QR registration scanner error:", err);
        setQrScanError(err instanceof Error ? err.message : "Failed to start camera");
        setQrScanMode(false);
      }
    }, 100);
  };
  
  const stopQrRegistration = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().catch(console.error);
      qrScannerRef.current = null;
    }
    setQrScanMode(false);
    setQrScanError(null);
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
    <div className="relative min-h-screen">
      <SunriseAmbience />
      {/* Cheat Penalty Indicator */}
      <div className="fixed top-14 left-0 right-0 z-40">
        <CheatPenaltyIndicator />
      </div>
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-3 sm:px-4 py-12 sm:py-16 overflow-hidden">
        {/* Subtle dot pattern overlay over the global SunriseAmbience */}
        <div className="theme-dot-pattern absolute inset-0 opacity-[0.12] pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-2">
          {/* Icon */}
          <div className="mb-6 sm:mb-8 animate-float">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl animate-glow-pulse bg-orange-400/30 dark:bg-indigo-500/40" />
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl backdrop-blur-md border shadow-glass bg-white/50 border-white/60 dark:bg-indigo-500/20 dark:border-indigo-400/30">
                <Sun className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 drop-shadow-lg dark:hidden" />
                <Moon className="hidden h-8 w-8 sm:h-10 sm:w-10 text-indigo-300 drop-shadow-lg dark:block" />
              </div>
            </div>
          </div>

          {/* Main Headline — gradient accent on second line */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight text-slate-800 dark:text-slate-100">
            {greeting.text},
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 dark:from-indigo-300 dark:via-purple-300 dark:to-rose-300">
              Rise & Shine
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed px-2 text-slate-700 dark:text-slate-300">
            Your AI-powered morning companion that wakes you up gently and starts your day with meaningful conversations.
          </p>

          {/* CTA Button */}
          <Button
            onClick={openNewDialog}
            size="lg"
            className="px-6 sm:px-8 py-5 sm:py-6 rounded-xl text-base sm:text-lg shadow-xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto bg-orange-500 hover:bg-orange-600 text-white hover:shadow-orange-400/40 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:hover:shadow-indigo-500/40"
          >
            <Clock className="h-5 w-5 mr-2 shrink-0" />
            <span className="truncate">Set Your Wake-up Time</span>
          </Button>

          {/* Feature highlights */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
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
            <div className="p-4 sm:p-5 backdrop-blur-sm rounded-2xl border shadow-lg bg-white/40 border-white/50 dark:bg-indigo-500/10 dark:border-indigo-400/20">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="rounded-xl p-2 sm:p-2.5 shrink-0 shadow-md bg-gradient-to-br from-orange-400 to-amber-500 dark:from-indigo-500 dark:to-purple-600">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-h-[50px] sm:min-h-[60px] flex flex-col justify-center min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-medium italic leading-relaxed break-words text-slate-700 dark:text-slate-200">
                    "{motivationalQuotes[currentQuoteIndex].quote}"
                  </p>
                  <p className="text-xs sm:text-sm font-semibold mt-2 truncate text-orange-600 dark:text-indigo-400">
                    — {motivationalQuotes[currentQuoteIndex].author}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 border-white/30 dark:border-indigo-400/30">
            <div className="w-1 h-2 rounded-full bg-white/50 dark:bg-indigo-400/50" />
          </div>
        </div>
      </section>

      {/* Main Content Section — transparent so SunriseAmbience shows through */}
      <section className="relative py-10 sm:py-16 px-3 sm:px-4 min-h-screen">
        <div className="max-w-lg mx-auto w-full">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-warm mb-4 shadow-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Setup Your Morning Routine</h2>
          </div>

          {/* Current Time Display */}
          <Card className="relative overflow-hidden p-4 sm:p-6 mb-6 sm:mb-8 backdrop-blur-md border shadow-glass rounded-2xl group hover:shadow-xl transition-shadow duration-500 bg-white/70 border-white/60 dark:bg-slate-800/60 dark:border-slate-600/30">
            {/* Subtle shimmer overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-orange-300/10 to-transparent dark:via-indigo-500/5" />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-gradient-warm p-2 sm:p-2.5 rounded-xl shadow-md shrink-0 animate-pulse-soft">
                  <GreetingIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-semibold text-foreground">{greeting.text}</span>
              </div>
              <div className="text-4xl sm:text-5xl font-bold mb-1 tracking-tight text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(currentTime)}</div>
              <div className="text-muted-foreground text-xs sm:text-sm mt-1">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </Card>

          {/* ElevenLabs Quota Panel */}
          <div className="mb-6 sm:mb-8">
            <ElevenLabsQuotaPanel />
          </div>

          {/* History Button */}
          <Button
            variant="outline"
            className="w-full gap-2 mb-5 rounded-2xl py-4 backdrop-blur-sm border transition-all duration-300 hover:-translate-y-0.5 bg-white/50 border-white/60 hover:bg-white/70 dark:bg-slate-800/40 dark:border-slate-600/30 dark:hover:bg-slate-700/50"
            onClick={() => window.location.href = '/history'}
          >
            <BarChart3 className="w-4 h-4" />
            View Alarm History & Analytics
          </Button>

          <div className="space-y-5">
          {/* Alarms List */}
          <div className="space-y-3">
            {alarms.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl backdrop-blur-md border shadow-glass bg-white/40 border-white/50 dark:bg-slate-800/30 dark:border-slate-600/20">
                <div className="relative mx-auto mb-4 w-20 h-20">
                  <div className="absolute inset-0 rounded-3xl blur-xl animate-pulse-soft bg-orange-400/30 dark:bg-indigo-500/30" />
                  <div className="relative bg-gradient-warm w-20 h-20 rounded-3xl flex items-center justify-center shadow-glass animate-float">
                    <Clock className="h-10 w-10 text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground mb-2">Ready to start your day right?</p>
                <p className="text-muted-foreground">Add your first AI-powered motivational alarm!</p>
              </div>
            ) : (
              alarms.map((alarm, index) => (
                <Card 
                  key={alarm.id} 
                  className={`relative overflow-hidden p-3 sm:p-4 backdrop-blur-md border shadow-glass rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white/60 border-white/60 dark:bg-slate-800/50 dark:border-slate-600/30 ${alarm.isActive ? 'ring-1 ring-primary/20' : ''}`}
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
                        <span className={`px-1.5 py-0.5 rounded shrink-0 ${
                          alarm.settings.interactionMode === 'two-way'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                        }`}>
                          {alarm.settings.interactionMode === 'two-way' ? '💬 Two-Way' : '📢 One-Way'}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span>{messageThemes.find(t => t.value === alarm.settings.messageTheme)?.icon}</span>
                          <span className="capitalize">{alarm.settings.messageTheme}</span>
                        </span>
                        {alarm.settings.sequentialChallengeSettings?.enabled && (
                          <span className="px-1.5 py-0.5 rounded shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                            🎯 {alarm.settings.sequentialChallengeSettings.challenges.length} challenges
                          </span>
                        )}
                        {!alarm.settings.sequentialChallengeSettings?.enabled && alarm.settings.challengeType !== 'none' && (
                          <span className="px-1.5 py-0.5 rounded shrink-0 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                            {challengeTypes.find(c => c.value === alarm.settings.challengeType)?.icon} {challengeTypes.find(c => c.value === alarm.settings.challengeType)?.label}
                          </span>
                        )}
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
          <div className="flex flex-col gap-2 sm:gap-3 pt-2">
            <Button 
              onClick={openNewDialog}
              className="w-full bg-gradient-warm hover:opacity-90 text-white py-5 sm:py-6 rounded-2xl shadow-glass hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm sm:text-base"
              size="lg"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
              <span>Add Alarm</span>
            </Button>
            
            <div className="flex gap-2 sm:gap-3">
              <Button 
                onClick={() => onStartCall("now", 5, defaultAlarmSettings, true)}
                variant="outline"
                className="flex-1 py-4 sm:py-5 rounded-2xl backdrop-blur-sm border-2 transition-all duration-300 text-xs sm:text-sm min-w-0 hover:-translate-y-0.5 border-primary/20 hover:border-primary hover:bg-primary/5 bg-white/40 dark:border-indigo-500/30 dark:hover:border-indigo-400 dark:hover:bg-indigo-500/10 dark:bg-indigo-500/5"
                size="lg"
              >
                <Phone className="h-4 w-4 mr-1.5 text-primary shrink-0" />
                <span className="truncate">One-Way Test</span>
              </Button>
              
              <Button 
                onClick={() => onStartCall("now", 5, { ...defaultAlarmSettings, interactionMode: 'two-way' }, true)}
                variant="outline"
                className="flex-1 py-4 sm:py-5 rounded-2xl backdrop-blur-sm border-2 transition-all duration-300 text-xs sm:text-sm min-w-0 hover:-translate-y-0.5 border-blue-300/50 hover:border-blue-500 hover:bg-blue-50 bg-white/40 dark:border-blue-500/30 dark:hover:border-blue-400 dark:hover:bg-blue-500/10 dark:bg-blue-500/5"
                size="lg"
              >
                <MessageSquare className="h-4 w-4 mr-1.5 shrink-0 text-blue-500 dark:text-blue-400" />
                <span className="truncate">Two-Way Test</span>
              </Button>
            </div>

            <Button
              onClick={() => setMicTestOpen(true)}
              variant="outline"
              className="w-full py-4 sm:py-5 rounded-2xl backdrop-blur-sm border-2 transition-all duration-300 text-xs sm:text-sm hover:-translate-y-0.5 border-emerald-300/50 hover:border-emerald-500 hover:bg-emerald-50 bg-white/40 dark:border-emerald-500/30 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/10 dark:bg-emerald-500/5"
              size="lg"
            >
              <Mic className="h-4 w-4 mr-1.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">Microphone Test</span>
            </Button>
          </div>
          </div>
        </div>
      </section>

      <MicrophoneTest open={micTestOpen} onOpenChange={setMicTestOpen} />

      {preCheckAlarm && (
        <PreAlarmCheck
          open={!!preCheckAlarm}
          alarmTime={preCheckAlarm.time}
          alarmLabel={preCheckAlarm.label}
          settings={preCheckAlarm.settings}
          onClose={() => setPreCheckAlarm(null)}
        />
      )}

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
                    <div
                      key={mode.value}
                      onClick={() => setInteractionMode(mode.value)}
                      className={`cursor-pointer rounded-lg border-2 p-3 sm:p-4 flex flex-col items-center text-center transition-all ${
                        interactionMode === mode.value 
                          ? 'border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1' 
                          : 'border-border bg-background hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl mb-1">{mode.icon}</span>
                      <span className={`font-semibold text-xs sm:text-sm mb-1 ${
                        interactionMode === mode.value ? 'text-primary-foreground' : 'text-foreground'
                      }`}>
                        {mode.label}
                      </span>
                      <span className={`text-[10px] sm:text-xs leading-tight ${
                        interactionMode === mode.value ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {mode.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-Time AI Agent ID */}
              {interactionMode === 'two-way' && (
                <div className="p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 dark:from-purple-900/30 dark:to-indigo-900/30 dark:border-purple-700/30">
                  <Label className="text-xs sm:text-sm font-medium mb-2 block flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    Real-Time AI Agent ID (Optional)
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter ElevenLabs Agent ID for zero-latency"
                    value={elevenLabsAgentId}
                    onChange={(e) => setElevenLabsAgentId(e.target.value)}
                    className="mb-2"
                  />
                  <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-300">
                    {elevenLabsAgentId 
                      ? "⚡ Real-time mode enabled! Zero latency voice-to-voice."
                      : "Leave empty for standard mode, or add Agent ID from ElevenLabs for instant responses."}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="dialog-alarm-time" className="text-sm font-medium mb-2 block">Time</Label>
                <Input id="dialog-alarm-time" type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} className="text-lg p-3" />
              </div>

              <div>
                <Label htmlFor="alarm-label" className="text-sm font-medium mb-2 block">Label</Label>
                <Input id="alarm-label" type="text" value={alarmLabel} onChange={(e) => setAlarmLabel(e.target.value)} placeholder="Wake up" className="p-3" />
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">AI Talk Duration: {talkDuration[0]} minutes</Label>
                <Slider value={talkDuration} onValueChange={setTalkDuration} max={10} min={1} step={1} className="py-4" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 min</span>
                  <span>10 min</span>
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">Repeat Days</Label>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <Button key={day} type="button" variant={selectedDays.includes(day) ? "default" : "outline"} size="sm" onClick={() => toggleDay(day)} className="px-2 sm:px-3 h-8 text-xs sm:text-sm">
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
                    <Button key={style.value} type="button" variant={voiceStyle === style.value ? "default" : "outline"} onClick={() => setVoiceStyle(style.value)} className="flex flex-col h-auto py-2.5 sm:py-3 px-2 sm:px-4 min-w-0">
                      <span className="font-semibold text-xs sm:text-sm truncate w-full">{style.label}</span>
                      <span className="text-[10px] sm:text-xs opacity-70 truncate w-full">{style.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Greeting Style</Label>
                <div className="grid grid-cols-3 gap-2">
                  {greetingStyles.map((style) => (
                    <Button key={style.value} type="button" variant={greetingStyle === style.value ? "default" : "outline"} size="sm" onClick={() => setGreetingStyle(style.value)}>
                      {style.label}
                    </Button>
                  ))}
                </div>
                {greetingStyle === 'personalized' && (
                  <Input type="text" placeholder="Your name" value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-2" />
                )}
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Message Theme
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {messageThemes.map((theme) => (
                    <Button key={theme.value} type="button" variant={messageTheme === theme.value ? "default" : "outline"} onClick={() => setMessageTheme(theme.value)} className="flex items-center gap-1.5 sm:gap-2 justify-start py-2.5 px-2 sm:px-3 h-auto min-w-0">
                      <span className="shrink-0">{theme.icon}</span>
                      <span className="font-semibold text-xs sm:text-sm truncate">{theme.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <span aria-hidden>🔥</span>
                    Motivation Intensity
                  </Label>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-primary">
                    {motivationIntensities.find(i => i.value === motivationIntensity)?.label}
                  </span>
                </div>
                <Slider
                  value={[motivationIntensities.findIndex(i => i.value === motivationIntensity)]}
                  onValueChange={(v) => setMotivationIntensity(motivationIntensities[v[0]].value)}
                  min={0}
                  max={2}
                  step={1}
                  className="py-3"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mt-1">
                  <span>Gentle</span>
                  <span>Moderate</span>
                  <span>Aggressive</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                  {motivationIntensities.find(i => i.value === motivationIntensity)?.description}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/40 p-3 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <span aria-hidden>👁️</span>
                    Live Preview
                  </Label>
                  <span className="text-[10px] sm:text-xs text-muted-foreground capitalize truncate">
                    {messageThemes.find(t => t.value === messageTheme)?.icon} {messageTheme}
                  </span>
                </div>
                {motivationIntensities.map((level) => {
                  const isActive = level.value === motivationIntensity;
                  return (
                    <div
                      key={level.value}
                      className={`rounded-md border p-2.5 sm:p-3 transition-colors ${
                        isActive
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/50 bg-background/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                          {level.label}
                        </span>
                        {isActive && (
                          <span className="text-[9px] sm:text-[10px] font-medium text-primary">SELECTED</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm leading-snug text-foreground/90">
                        "{getExampleMessage(messageTheme, level.value)}"
                      </p>
                    </div>
                  );
                })}
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
                    <Button key={style.value} type="button" variant={ringtoneStyle === style.value ? "default" : "outline"} onClick={() => setRingtoneStyle(style.value)} className="flex flex-col h-auto py-2.5 sm:py-3 px-2 min-w-0">
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
                <Switch checked={gradualVolume} onCheckedChange={setGradualVolume} className="shrink-0" />
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Snooze Intensity</Label>
                <div className="grid grid-cols-3 gap-2">
                  {snoozeLevels.map((level) => (
                    <Button key={level.value} type="button" variant={snoozeLevel === level.value ? "default" : "outline"} size="sm" onClick={() => setSnoozeLevel(level.value)}>
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
              {/* Multi-challenge toggle */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/50">
                <div className="min-w-0 flex-1">
                  <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Gamepad2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    Sequential Challenges
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    Require multiple challenges to dismiss
                  </p>
                </div>
                <Switch checked={multiChallengeEnabled} onCheckedChange={setMultiChallengeEnabled} className="shrink-0" />
              </div>

              {multiChallengeEnabled ? (
                /* ===== MULTI-CHALLENGE MODE ===== */
                <div className="space-y-4">
                  {/* Selected challenges list */}
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 block">
                      Challenge Sequence ({challengeSequence.length}/{MAX_CHALLENGES_PER_ALARM})
                    </Label>
                    {challengeSequence.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                        Add challenges below to build your sequence
                      </p>
                    )}
                    <div className="space-y-2">
                      {challengeSequence.map((item, idx) => {
                        const info = challengeTypes.find(c => c.value === item.type);
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                            <span className="text-sm font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                            <span className="text-base shrink-0">{info?.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs sm:text-sm font-medium truncate block">{info?.label}</span>
                            </div>
                            <select
                              value={item.difficulty}
                              onChange={(e) => {
                                const updated = [...challengeSequence];
                                updated[idx] = { ...updated[idx], difficulty: e.target.value as ChallengeDifficulty };
                                setChallengeSequence(updated);
                              }}
                              className="text-xs border rounded px-1.5 py-1 bg-background"
                            >
                              {challengeDifficulties.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-0.5">
                              <Button
                                type="button" variant="ghost" size="icon"
                                className="h-7 w-7"
                                disabled={idx === 0}
                                onClick={() => {
                                  const updated = [...challengeSequence];
                                  [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                                  setChallengeSequence(updated);
                                }}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button" variant="ghost" size="icon"
                                className="h-7 w-7"
                                disabled={idx === challengeSequence.length - 1}
                                onClick={() => {
                                  const updated = [...challengeSequence];
                                  [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                                  setChallengeSequence(updated);
                                }}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button" variant="ghost" size="icon"
                                className="h-7 w-7 hover:bg-destructive/10"
                                onClick={() => setChallengeSequence(prev => prev.filter((_, i) => i !== idx))}
                              >
                                <XCircle className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add challenge — categorized */}
                  {challengeSequence.length < MAX_CHALLENGES_PER_ALARM && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium block">Add Challenge by Category</Label>
                      <div className="space-y-2">
                        {challengeCategories.map((cat) => {
                          const items = challengeTypes.filter(t => cat.challenges.includes(t.value));
                          if (items.length === 0) return null;
                          return (
                            <details
                              key={cat.id}
                              className="group rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
                            >
                              <summary className="flex items-center gap-2 px-3 py-2.5 cursor-pointer list-none select-none hover:bg-accent/40 transition-colors">
                                <span className="text-xl shrink-0">{cat.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-semibold truncate">{cat.label}</div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{cat.tagline}</div>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">{items.length}</span>
                                <span className="text-muted-foreground shrink-0 transition-transform group-open:rotate-180">▾</span>
                              </summary>
                              <div className="px-2 pb-2 pt-1 grid grid-cols-2 gap-1.5">
                                {items.map((type) => (
                                  <Button
                                    key={type.value}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setChallengeSequence(prev => [...prev, { type: type.value, difficulty: challengeDifficulty }]);
                                    }}
                                    className="flex items-center gap-1.5 justify-start h-auto py-2 px-2 min-w-0 text-xs"
                                  >
                                    <span className="shrink-0">{type.icon}</span>
                                    <span className="truncate">{type.label}</span>
                                  </Button>
                                ))}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sequential settings */}
                  {challengeSequence.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium mb-2 block">On Failure</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {failureRetryBehaviors.map(b => (
                            <Button
                              key={b.value}
                              type="button"
                              variant={failureRetryBehavior === b.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setFailureRetryBehavior(b.value)}
                            >
                              <div className="text-center">
                                <div className="text-xs font-semibold">{b.label}</div>
                                <div className="text-[10px] opacity-70">{b.description}</div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/50">
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs sm:text-sm font-medium">Dynamic Difficulty</Label>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Later challenges get harder automatically</p>
                        </div>
                        <Switch checked={dynamicDifficulty} onCheckedChange={setDynamicDifficulty} className="shrink-0" />
                      </div>

                      <div>
                        <Label className="text-xs sm:text-sm font-medium mb-2 block">
                          Extra Challenges on Failure: {maxExtraChallenges}
                        </Label>
                        <Slider
                          value={[maxExtraChallenges]}
                          onValueChange={([v]) => setMaxExtraChallenges(v)}
                          min={0} max={3} step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>None</span>
                          <span>+3 extra</span>
                        </div>
                      </div>

                      {/* Voice Encouragement Toggle */}
                      <div className="flex items-center justify-between py-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-primary" />
                          <div>
                            <Label className="text-xs sm:text-sm font-medium cursor-pointer">AI Voice Encouragement</Label>
                            <p className="text-[10px] text-muted-foreground">Hear encouraging messages between challenges</p>
                          </div>
                        </div>
                        <Switch 
                          checked={voiceEncouragementEnabled} 
                          onCheckedChange={setVoiceEncouragementEnabled} 
                          className="shrink-0" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ===== SINGLE CHALLENGE MODE (original) ===== */
                <div>
                  <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block flex items-center gap-2">
                    <Gamepad2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    Wake-up Challenge
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
                    Must complete this challenge to dismiss the alarm
                  </p>
                  {/* "None" option */}
                  <Button
                    type="button"
                    variant={challengeType === 'none' ? "default" : "outline"}
                    onClick={() => setChallengeType('none')}
                    className="w-full flex items-center gap-2 justify-start h-auto py-2.5 px-3 mb-3"
                  >
                    <span className="text-lg shrink-0">😴</span>
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold text-xs sm:text-sm">None</div>
                      <div className="text-[10px] sm:text-xs opacity-70">No challenge required</div>
                    </div>
                  </Button>

                  {/* Categorized challenge picker */}
                  <div className="space-y-2">
                    {challengeCategories.map((cat) => {
                      const items = challengeTypes.filter(t => cat.challenges.includes(t.value));
                      if (items.length === 0) return null;
                      const hasSelected = items.some(i => i.value === challengeType);
                      return (
                        <details
                          key={cat.id}
                          open={hasSelected}
                          className="group rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
                        >
                          <summary className="flex items-center gap-2 px-3 py-2.5 cursor-pointer list-none select-none hover:bg-accent/40 transition-colors">
                            <span className="text-xl shrink-0">{cat.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs sm:text-sm font-semibold truncate">{cat.label}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{cat.tagline}</div>
                            </div>
                            {hasSelected && <span className="text-[10px] text-primary font-semibold shrink-0">selected</span>}
                            <span className="text-muted-foreground shrink-0 transition-transform group-open:rotate-180">▾</span>
                          </summary>
                          <div className="px-2 pb-2 pt-1 grid grid-cols-2 gap-2">
                            {items.map((type) => (
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
                        </details>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Permission Check */}
              {challengeType !== 'none' && (
                <PermissionCheck 
                  challengeType={challengeType} 
                  interactionMode={interactionMode}
                />
              )}

              {challengeType !== 'none' && challengeType !== 'speakMatch' && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">Challenge Difficulty</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {challengeDifficulties.map((diff) => (
                      <Button key={diff.value} type="button" variant={challengeDifficulty === diff.value ? "default" : "outline"} size="sm" onClick={() => setChallengeDifficulty(diff.value)}>
                        {diff.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {challengeDifficulties.find(d => d.value === challengeDifficulty)?.description}
                  </p>
                </div>
              )}

              {/* QR Code Registration */}
              {challengeType === 'qrcode' && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">📷 QR Code Registration</p>
                  <p className="text-xs text-muted-foreground">
                    Register a QR code that you'll need to scan to dismiss this alarm. Place it in another room!
                  </p>
                  
                  {registeredQrCode ? (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-sm font-semibold text-green-600">QR Code Registered</span>
                      </div>
                      <p className="text-xs text-muted-foreground break-all mb-2">
                        Code: {registeredQrCode.slice(0, 60)}{registeredQrCode.length > 60 ? '...' : ''}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setRegisteredQrCode('');
                            toast.info("QR code removed");
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={startQrRegistration}
                        >
                          <QrCode className="h-3.5 w-3.5 mr-1" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : qrScanMode ? (
                    <div className="space-y-3">
                      <div 
                        id="qr-register-reader" 
                        className="w-full rounded-xl overflow-hidden bg-gray-900"
                        style={{ minHeight: '220px' }}
                      />
                      {!qrScannerReady && (
                        <div className="text-center">
                          <div className="inline-block animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                          <p className="text-xs text-muted-foreground mt-1">Starting camera...</p>
                        </div>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={stopQrRegistration} className="w-full">
                        <CameraOff className="h-3.5 w-3.5 mr-1" />
                        Cancel Scan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {qrScanError && (
                        <p className="text-xs text-red-500">{qrScanError}</p>
                      )}
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={startQrRegistration}
                        className="w-full py-4"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Scan QR Code to Register
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        💡 Tip: Print a QR code and place it in your kitchen or bathroom
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Speak & Match Settings */}
              {challengeType === 'speakMatch' && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">🗣️ Speak & Match Settings</p>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 block">Paragraph Length</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {speakMatchParagraphLengths.map((pl) => (
                        <Button key={pl.value} type="button" variant={smParagraphLength === pl.value ? "default" : "outline"} size="sm" onClick={() => setSmParagraphLength(pl.value)}>
                          <div className="text-center">
                            <div className="text-xs font-semibold">{pl.label}</div>
                            <div className="text-[10px] opacity-70">{pl.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 block">Accuracy Level</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {speakMatchAccuracyLevels.map((al) => (
                        <Button key={al.value} type="button" variant={smAccuracy === al.value ? "default" : "outline"} size="sm" onClick={() => setSmAccuracy(al.value)}>
                          {al.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 block">Time Limit: {smTimeLimit}s</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {speakMatchTimeLimits.map((tl) => (
                        <Button key={tl} type="button" variant={smTimeLimit === tl ? "default" : "outline"} size="sm" onClick={() => setSmTimeLimit(tl)}>
                          {tl}s
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 block">Retry Limit</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {speakMatchRetryLimits.map((rl) => (
                        <Button key={rl.value} type="button" variant={smRetryLimit === rl.value ? "default" : "outline"} size="sm" onClick={() => setSmRetryLimit(rl.value)}>
                          {rl.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 block">Paragraph Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {speakMatchParagraphTypes.map((pt) => (
                        <Button key={pt.value} type="button" variant={smParagraphType === pt.value ? "default" : "outline"} onClick={() => setSmParagraphType(pt.value)} className="flex items-center gap-1.5 justify-start h-auto py-2.5 px-3 min-w-0">
                          <span className="shrink-0">{pt.icon}</span>
                          <span className="font-semibold text-xs sm:text-sm truncate">{pt.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {smParagraphType === 'custom' && (
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-2 block">Custom Text</Label>
                      <textarea
                        value={smCustomText}
                        onChange={(e) => setSmCustomText(e.target.value)}
                        placeholder="Enter your custom paragraph here..."
                        className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-sm resize-y"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Object Verification Settings */}
              {challengeType === 'objectVerify' && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">🔍 Object Verification Setup</p>
                  
                  {/* Stored Objects */}
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 block">
                      Your Objects ({storedObjects.length}/10)
                    </Label>
                    
                    {storedObjects.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {storedObjects.map((obj) => (
                          <div key={obj.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                            ovSelectedIds.includes(obj.id) 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border'
                          }`}>
                            <img 
                              src={obj.imageBase64} 
                              alt={obj.label} 
                              className="w-10 h-10 rounded object-cover shrink-0"
                            />
                            <span className="text-sm font-medium flex-1 truncate">{obj.label}</span>
                            <Button
                              type="button"
                              variant={ovSelectedIds.includes(obj.id) ? "default" : "outline"}
                              size="sm"
                              className="shrink-0 h-7 text-xs"
                              onClick={() => toggleObjectSelection(obj.id)}
                            >
                              {ovSelectedIds.includes(obj.id) ? '✓ Selected' : 'Select'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0 h-7 w-7 hover:bg-destructive/10"
                              onClick={() => deleteObject(obj.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {ovSelectedIds.length > 0 && (
                      <p className="text-xs text-primary font-semibold mb-2">
                        {ovSelectedIds.length} object{ovSelectedIds.length !== 1 ? 's' : ''} selected for verification
                      </p>
                    )}
                    
                    {/* Capture new object */}
                    {objCaptureMode ? (
                      <div className="space-y-3 p-3 rounded-xl border border-border bg-muted/30">
                        {objCapturedImage ? (
                          <>
                            <img src={objCapturedImage} alt="Captured" className="w-full rounded-lg" />
                            <Input
                              type="text"
                              placeholder="Label (e.g., Toothbrush, Kitchen Sink)"
                              value={objLabel}
                              onChange={(e) => setObjLabel(e.target.value)}
                              className="text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button type="button" size="sm" onClick={saveObject} className="flex-1">
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Save Object
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => {
                                setObjCapturedImage(null);
                                startObjectCapture();
                              }}>
                                Retake
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => {
                                setObjCaptureMode(false);
                                setObjCapturedImage(null);
                                if (objStreamRef.current) {
                                  objStreamRef.current.getTracks().forEach(t => t.stop());
                                }
                              }}>
                                Cancel
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <video
                              ref={objVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full rounded-lg bg-muted"
                              style={{ minHeight: '180px' }}
                            />
                            <div className="flex gap-2">
                              <Button type="button" size="sm" onClick={captureObjectPhoto} className="flex-1">
                                <Camera className="h-3.5 w-3.5 mr-1" />
                                Capture Photo
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => {
                                setObjCaptureMode(false);
                                if (objStreamRef.current) {
                                  objStreamRef.current.getTracks().forEach(t => t.stop());
                                }
                              }}>
                                Cancel
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : storedObjects.length < 10 ? (
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={startObjectCapture} className="flex-1 py-4">
                          <Camera className="h-4 w-4 mr-2" />
                          Camera
                        </Button>
                        <Button type="button" variant="outline" onClick={importFromGallery} className="flex-1 py-4">
                          <Image className="h-4 w-4 mr-2" />
                          Gallery
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">Maximum 10 objects reached</p>
                    )}
                  </div>
                  
                  {/* Verification options */}
                  {ovSelectedIds.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/50">
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs sm:text-sm font-medium">Strict Match</Label>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Higher confidence required (95%)</p>
                        </div>
                        <Switch checked={ovStrictMatch} onCheckedChange={(v) => {
                          setOvStrictMatch(v);
                          setOvConfidence(v ? 95 : 85);
                        }} className="shrink-0" />
                      </div>
                      
                      {ovSelectedIds.length > 1 && (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/50">
                          <div className="min-w-0 flex-1">
                            <Label className="text-xs sm:text-sm font-medium">Sequential Mode</Label>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Must verify objects in order</p>
                          </div>
                          <Switch checked={ovSequential} onCheckedChange={setOvSequential} className="shrink-0" />
                        </div>
                      )}

                      <div>
                        <Label className="text-xs sm:text-sm font-medium mb-2 block">
                          Confidence: {ovConfidence}%
                        </Label>
                        <Slider
                          value={[ovConfidence]}
                          onValueChange={([v]) => setOvConfidence(v)}
                          min={50}
                          max={99}
                          step={5}
                          className="py-2"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Relaxed (50%)</span>
                          <span>Strict (99%)</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Place objects in different rooms to force yourself out of bed!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveAlarm} className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">{editingAlarmId ? "Update Alarm" : "Save Alarm"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
