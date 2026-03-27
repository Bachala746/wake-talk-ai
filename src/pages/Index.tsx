import { useState } from "react";
import { AlarmClock } from "@/components/AlarmClock";
import { VoiceCall } from "@/components/VoiceCall";
import { TwoWayVoiceCall } from "@/components/TwoWayVoiceCall";
import { RealtimeTwoWayCall } from "@/components/RealtimeTwoWayCall";
import { WakeUpSuccessScreen } from "@/components/WakeUpSuccessScreen";
import { AlarmSettings, defaultAlarmSettings } from "@/lib/alarmSettings";

const Index = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [callData, setCallData] = useState<{
    alarmTime: string;
    talkDuration: number;
    settings: AlarmSettings;
    isTestCall?: boolean;
  } | null>(null);

  const handleStartCall = (alarmTime: string, talkDuration: number, settings: AlarmSettings = defaultAlarmSettings, isTestCall: boolean = false) => {
    setCallData({ alarmTime, talkDuration, settings, isTestCall });
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setShowSuccess(true);
  };

  const handleDismissSuccess = () => {
    setShowSuccess(false);
    setCallData(null);
  };

  if (isInCall && callData) {
    // Route to appropriate component based on interaction mode
    if (callData.settings.interactionMode === 'two-way') {
      // Use real-time agent if agent ID is configured
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
      
      // Fallback to standard two-way mode
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
  }

  if (showSuccess) {
    return <WakeUpSuccessScreen onDismiss={handleDismissSuccess} />;
  }

  return (
    <AlarmClock onStartCall={handleStartCall} />
  );
};

export default Index;
