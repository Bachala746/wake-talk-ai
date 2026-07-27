package com.riseandshine.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "AlarmPlugin")
public class AlarmPlugin extends Plugin {

    @PluginMethod
public void scheduleAlarm(PluginCall call) {

    String alarmId = call.getString("alarmId");
    String label = call.getString("label");
    Long triggerTime = call.getLong("triggerTimeMillis");

    if (alarmId == null || triggerTime == null) {
        call.reject("Missing required parameters");
        return;
    }

    try {

        AlarmScheduler.scheduleAlarm(
                getContext(),
                alarmId,
                label,
                triggerTime
        );

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);

    } catch (SecurityException e) {
        call.reject("Exact alarm permission not granted.");
    } catch (Exception e) {
        call.reject(e.getMessage());
    }
}
@PluginMethod
public void cancelAlarm(PluginCall call) {

    String alarmId = call.getString("alarmId");

    if (alarmId == null) {
        call.reject("Missing alarmId");
        return;
    }

    AlarmScheduler.cancelAlarm(
            getContext(),
            alarmId
    );

    JSObject ret = new JSObject();
    ret.put("success", true);
    call.resolve(ret);
}
}