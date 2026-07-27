import { registerPlugin } from "@capacitor/core";

export interface ScheduleAlarmOptions {
  alarmId: string;
  triggerTimeMillis: number;
  label: string;
}

export interface CancelAlarmOptions {
  alarmId: string;
}

export interface AlarmPluginPlugin {
  scheduleAlarm(options: ScheduleAlarmOptions): Promise<{
    success: boolean;
  }>;

  cancelAlarm(options: CancelAlarmOptions): Promise<{
    success: boolean;
  }>;
}

const AlarmPlugin =
  registerPlugin<AlarmPluginPlugin>("AlarmPlugin");

export default AlarmPlugin;