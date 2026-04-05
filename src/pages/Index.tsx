import { useState, useRef, useEffect } from "react";
import { AlarmClock } from "@/components/AlarmClock";
import { VoiceCall } from "@/components/VoiceCall";
import { TwoWayVoiceCall } from "@/components/TwoWayVoiceCall";
import { RealtimeTwoWayCall } from "@/components/RealtimeTwoWayCall";
import { WakeUpSuccessScreen } from "@/components/WakeUpSuccessScreen";
import { AlarmSettings, defaultAlarmSettings } from "@/lib/alarmSettings";
import { addAlarmHistoryEntry } from "@/lib/alarmHistory";
import {
  checkForUncompletedAlarm,
  saveAlarmState,
  markAlarmCompleted,
  startHeartbeat,
  stopHeartbeat,
  clearAlarmState,
  getEscalatedDifficulty,
  getCheatPenalties,
  ActiveAlarmState,
} from "@/lib/antiCheat";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [callData, setCallData] = useState<{
    alarmTime: string;
    talkDuration: number;
    settings: AlarmSettings;
    isTestCall?: boolean;
  } | null>(null);
  const [antiCheatWarning, setAntiCheatWarning] = useState<string | null>(null);
  const callStartRef = useRef<number>(0);
  const snoozeCountRef = useRef(0);
  const challengeFailsRef = useRef(0);
  const challengeSucceededRef = useRef(false);
  const resumedFromCheatRef = useRef(false);

  // On mount: check for uncompleted alarm (phone restart / force close / uninstall)
  useEffect(() => {
    const result = checkForUncompletedAlarm();

    if (result.hasUncompletedAlarm && result.state) {
      const state = result.state;

      // Build warning message
      const warnings: string[] = [];
      if (result.wasTimeManipulated) {
        warnings.push("⚠️ Time manipulation detected!");
      }
      if (result.forceCloseCount >= 3) {
        warnings.push(`⚠️ App was force-closed ${result.forceCloseCount} times during alarm!`);
      }
      if (result.wasForceClose) {
        warnings.push("🔄 Alarm resumed — you must complete the challenge.");
      }

      if (warnings.length > 0) {
        setAntiCheatWarning(warnings.join(" "));
      }

      // Resume the alarm with escalated difficulty
      try {
        const settings: AlarmSettings = JSON.parse(state.settingsJson);

        // Escalate difficulty if cheating detected
        if (state.cheatingDetected || state.difficultyEscalations > 0) {
          settings.challengeDifficulty = getEscalatedDifficulty(
            settings.challengeDifficulty,
            state.difficultyEscalations || 1
          );
          resumedFromCheatRef.current = true;
        }

        // Apply any stored penalties
        const penalties = getCheatPenalties();
        if (penalties?.forcedHarderChallenge) {
          settings.challengeDifficulty = 'hard';
        }

        setCallData({
          alarmTime: state.alarmTime,
          talkDuration: state.talkDuration,
          settings,
          isTestCall: state.isTestCall,
        });
        setIsInCall(true);
        callStartRef.current = state.startTime;
        startHeartbeat();

        toast({
          title: "⏰ Alarm Resumed",
          description: state.cheatingDetected
            ? "Cheating detected! Difficulty has been increased."
            : "Your alarm was interrupted. Complete the challenge to dismiss.",
          variant: "destructive",
        });
      } catch {
        clearAlarmState();
      }
    }
  }, []);

  const handleStartCall = (alarmTime: string, talkDuration: number, settings: AlarmSettings = defaultAlarmSettings, isTestCall: boolean = false) => {
    setCallData({ alarmTime, talkDuration, settings, isTestCall });
    setIsInCall(true);
    callStartRef.current = Date.now();
    snoozeCountRef.current = 0;
    challengeFailsRef.current = 0;
    challengeSucceededRef.current = false;
    setAntiCheatWarning(null);

    // Persist alarm state for anti-cheat
    if (!isTestCall) {
      const alarmState: ActiveAlarmState = {
        alarmActive: true,
        alarmCompleted: false,
        startTime: Date.now(),
        alarmTime,
        talkDuration,
        challengeType: settings.challengeType,
        difficulty: settings.challengeDifficulty,
        settingsJson: JSON.stringify(settings),
        isTestCall,
        lastHeartbeat: Date.now(),
        forceCloseCount: 0,
        cheatingDetected: false,
        difficultyEscalations: 0,
      };
      saveAlarmState(alarmState);
      startHeartbeat();
    }
  };

  const handleEndCall = (snoozes?: number, challengeFails?: number, challengeSuccess?: boolean) => {
    if (snoozes !== undefined) snoozeCountRef.current = snoozes;
    if (challengeFails !== undefined) challengeFailsRef.current = challengeFails;
    if (challengeSuccess !== undefined) challengeSucceededRef.current = challengeSuccess;

    const now = new Date();
    const wakeUpTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    if (callData && !callData.isTestCall) {
      addAlarmHistoryEntry({
        date: now.toISOString(),
        wakeUpTime,
        alarmTime: callData.alarmTime,
        snoozeCount: snoozeCountRef.current,
        challengeType: callData.settings.challengeType,
        challengeSucceeded: challengeSucceededRef.current,
        challengeFailures: challengeFailsRef.current,
        durationSeconds: Math.round((Date.now() - callStartRef.current) / 1000),
      });
    }

    // Mark alarm as completed — clears anti-cheat state
    markAlarmCompleted();
    stopHeartbeat();

    setIsInCall(false);
    setShowSuccess(true);
    setAntiCheatWarning(null);
  };

  const handleDismissSuccess = () => {
    setShowSuccess(false);
    setCallData(null);
  };

  if (isInCall && callData) {
    const callContent = (() => {
      if (callData.settings.interactionMode === 'two-way') {
        if (callData.settings.elevenLabsAgentId) {
          return (
            <RealtimeTwoWayCall
              alarmTime={callData.alarmTime}
              talkDuration={callData.talkDuration}
              settings={callData.settings}
              onEndCall={handleEndCall}
              isTestCall={callData.isTestCall}
            />
          );
        }
        return (
          <TwoWayVoiceCall
            alarmTime={callData.alarmTime}
            talkDuration={callData.talkDuration}
            settings={callData.settings}
            onEndCall={handleEndCall}
            isTestCall={callData.isTestCall}
          />
        );
      }
      return (
        <VoiceCall
          alarmTime={callData.alarmTime}
          talkDuration={callData.talkDuration}
          settings={callData.settings}
          onEndCall={handleEndCall}
        />
      );
    })();

    return (
      <div className="relative">
        {antiCheatWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-3 text-center text-sm font-semibold animate-pulse">
            {antiCheatWarning}
          </div>
        )}
        {callContent}
      </div>
    );
  }

  if (showSuccess) {
    return <WakeUpSuccessScreen onDismiss={handleDismissSuccess} />;
  }

  return (
    <AlarmClock onStartCall={handleStartCall} />
  );
};

export default Index;
