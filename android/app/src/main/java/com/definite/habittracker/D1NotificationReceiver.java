package com.definite.habittracker;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;

public class D1NotificationReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;

        if ("FIRE_BEDTIME_REMINDER".equals(action)) {
            // Read saved payload from SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences(D1NotificationPlugin.PREFS_NAME, Context.MODE_PRIVATE);
            String title = prefs.getString("title", "Habits Remaining");
            String subtitle = prefs.getString("subtitle", "Complete your day before bedtime.");
            String habitsJson = prefs.getString("habits", "[]");

            try {
                JSONArray habits = new JSONArray(habitsJson);
                D1NotificationPlugin.showCustomNotification(context, title, subtitle, habits);
            } catch (Exception e) {
                D1NotificationPlugin.showCustomNotification(context, title, subtitle, new JSONArray());
            }
        } else if ("ACTION_SNOOZE".equals(action)) {
            // Dismiss current notification
            NotificationManagerCompat.from(context).cancel(D1NotificationPlugin.NOTIFICATION_ID);

            // Re-schedule for 15 minutes later
            long snoozeMillis = System.currentTimeMillis() + (15 * 60 * 1000);
            Intent snoozeIntent = new Intent(context, D1NotificationReceiver.class);
            snoozeIntent.setAction("FIRE_BEDTIME_REMINDER");
            PendingIntent pi = PendingIntent.getBroadcast(
                context, 
                D1NotificationPlugin.NOTIFICATION_ID, 
                snoozeIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, snoozeMillis, pi);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, snoozeMillis, pi);
                }
            }
        }
    }
}
