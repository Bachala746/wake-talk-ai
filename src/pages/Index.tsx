import { useState } from "react";
import { AlarmClock } from "@/components/AlarmClock";
import { VoiceCall } from "@/components/VoiceCall";
import { TwoWayVoiceCall } from "@/components/TwoWayVoiceCall";
import { AlarmSettings, defaultAlarmSettings } from "@/lib/alarmSettings";

const Index = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState<{
    alarmTime: string;
    talkDuration: number;
    settings: AlarmSettings;
  } | null>(null);

  const handleStartCall = (alarmTime: string, talkDuration: number, settings: AlarmSettings = defaultAlarmSettings) => {
    setCallData({ alarmTime, talkDuration, settings });
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallData(null);
  };

  if (isInCall && callData) {
    // Route to appropriate component based on interaction mode
    if (callData.settings.interactionMode === 'two-way') {
      return (
        <TwoWayVoiceCall
          alarmTime={callData.alarmTime}
          talkDuration={callData.talkDuration}
          settings={callData.settings}
          onEndCall={handleEndCall}
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

  return (
    <AlarmClock onStartCall={handleStartCall} />
  );
};

export default Index;
