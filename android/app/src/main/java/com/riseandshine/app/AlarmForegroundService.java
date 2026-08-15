package com.riseandshine.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

public class AlarmForegroundService extends Service {

    private static final String CHANNEL_ID = "alarm_channel";

    @Override
    public void onCreate() {
        super.onCreate();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Alarm Service",
                    NotificationManager.IMPORTANCE_HIGH
            );

            NotificationManager manager =
                    getSystemService(NotificationManager.class);

            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }

        Intent intent = new Intent(this, MainActivity.class);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setContentTitle("Wake Talk AI")
                        .setContentText("Alarm is ringing")
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentIntent(pendingIntent)
                        .setOngoing(true)
                        .build();

        startForeground(1001, notification);
    }
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        Intent launchIntent = new Intent(this, MainActivity.class);

        launchIntent.putExtra("alarmId", intent.getStringExtra("alarmId"));
        launchIntent.putExtra("label", intent.getStringExtra("label"));

        launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        );

        startActivity(launchIntent);

        return START_STICKY;
    }
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}