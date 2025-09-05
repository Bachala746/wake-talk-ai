import { useState } from "react";
import { AlarmClock } from "@/components/AlarmClock";
import { VoiceCall } from "@/components/VoiceCall";

const Index = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState<{
    alarmTime: string;
    talkDuration: number;
  } | null>(null);

  const handleStartCall = (alarmTime: string, talkDuration: number) => {
    setCallData({ alarmTime, talkDuration });
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallData(null);
  };

  if (isInCall && callData) {
    return (
      <VoiceCall
        alarmTime={callData.alarmTime}
        talkDuration={callData.talkDuration}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <AlarmClock onStartCall={handleStartCall} />
  );
};

export default Index;