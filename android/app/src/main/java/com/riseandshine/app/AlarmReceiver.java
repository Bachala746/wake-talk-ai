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

        Intent launchIntent = context.getPackageManager()
                .getLaunchIntentForPackage(context.getPackageName());

        if (launchIntent != null) {

            launchIntent.putExtra("alarmId", alarmId);
            launchIntent.putExtra("label", label);

            launchIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TOP
            );

            context.startActivity(launchIntent);
        }
    }
}