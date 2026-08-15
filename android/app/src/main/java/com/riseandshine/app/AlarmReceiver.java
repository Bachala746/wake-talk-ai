package com.riseandshine.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {

        String alarmId = intent.getStringExtra("alarmId");
        String label = intent.getStringExtra("label");

        if (label == null || label.isEmpty()) {
            label = "Alarm";
        }

        Toast.makeText(
                context,
                label + " Alarm Triggered!",
                Toast.LENGTH_LONG
        ).show();

        Intent serviceIntent =
                new Intent(context, AlarmForegroundService.class);

        serviceIntent.putExtra("alarmId", alarmId);
        serviceIntent.putExtra("label", label);

        context.startForegroundService(serviceIntent);
    }
}