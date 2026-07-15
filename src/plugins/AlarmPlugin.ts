import { registerPlugin } from "@capacitor/core";

export interface AlarmPluginPlugin {
  scheduleAlarm(options: {
    triggerTimeMillis: number;
  }): Promise<void>;
}

const AlarmPlugin = registerPlugin<AlarmPluginPlugin>("AlarmPlugin");

export default AlarmPlugin;