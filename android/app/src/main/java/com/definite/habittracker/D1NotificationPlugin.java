package com.definite.habittracker;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "D1NativeNotifications")
public class D1NotificationPlugin extends Plugin {

    public static final String CHANNEL_ID = "d1_habit_reminders";
    public static final int NOTIFICATION_ID = 1001;
    public static final String PREFS_NAME = "d1_notification_prefs";

    @PluginMethod
    public void showHabitNotification(PluginCall call) {
        try {
            String title = call.getString("title", "Habits Remaining");
            String subtitle = call.getString("subtitle", "Complete your day before bedtime.");
            JSArray habits = call.getArray("habits", new JSArray());

            Context context = getContext();
            showCustomNotification(context, title, subtitle, habits);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to show custom notification: " + e.getMessage());
        }
    }

    @PluginMethod
    public void scheduleHabitReminder(PluginCall call) {
        try {
            Long triggerAtMillis = call.getLong("triggerAtMillis");
            if (triggerAtMillis == null) {
                call.reject("triggerAtMillis is required");
                return;
            }

            String title = call.getString("title", "Habits Remaining");
            String subtitle = call.getString("subtitle", "Complete your day before bedtime.");
            JSArray habits = call.getArray("habits", new JSArray());

            Context context = getContext();
            // Save payload to SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("title", title)
                .putString("subtitle", subtitle)
                .putString("habits", habits.toString())
                .apply();

            Intent intent = new Intent(context, D1NotificationReceiver.class);
            intent.setAction("FIRE_BEDTIME_REMINDER");
            PendingIntent pi = PendingIntent.getBroadcast(
                context, 
                NOTIFICATION_ID, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
                }
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to schedule habit reminder: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelHabitReminder(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(context, D1NotificationReceiver.class);
            intent.setAction("FIRE_BEDTIME_REMINDER");
            PendingIntent pi = PendingIntent.getBroadcast(
                context, 
                NOTIFICATION_ID, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                am.cancel(pi);
            }

            NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to cancel habit reminder: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        try {
            String url = call.getString("url");
            if (url == null || url.trim().isEmpty()) {
                call.reject("url is required");
                return;
            }

            Context context = getContext();
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url.trim()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open URL: " + e.getMessage());
        }
    }

    public static void showCustomNotification(Context context, String title, String subtitle, JSONArray habits) {
        createNotificationChannel(context);

        String pkg = context.getPackageName();
        RemoteViews collapsedView = new RemoteViews(pkg, R.layout.notification_bedtime_collapsed);
        RemoteViews expandedView = new RemoteViews(pkg, R.layout.notification_bedtime_expanded);

        collapsedView.setTextViewText(R.id.notif_title_collapsed, title);
        collapsedView.setTextViewText(R.id.notif_subtitle_collapsed, subtitle);

        expandedView.setTextViewText(R.id.notif_title_expanded, title);
        expandedView.setTextViewText(R.id.notif_subtitle_expanded, subtitle);

        int count = habits != null ? habits.length() : 0;

        // Populate habit cards in expanded view & chips in collapsed view
        int[] chipIds = { R.id.notif_chip_1, R.id.notif_chip_2, R.id.notif_chip_3, R.id.notif_chip_4 };
        int[] cardIds = { R.id.notif_card_1, R.id.notif_card_2, R.id.notif_card_3, R.id.notif_card_4 };
        int[] iconIds = { R.id.notif_card_icon_1, R.id.notif_card_icon_2, R.id.notif_card_icon_3, R.id.notif_card_icon_4 };
        int[] nameIds = { R.id.notif_card_name_1, R.id.notif_card_name_2, R.id.notif_card_name_3, R.id.notif_card_name_4 };
        int[] targetIds = { R.id.notif_card_target_1, R.id.notif_card_target_2, R.id.notif_card_target_3, R.id.notif_card_target_4 };

        for (int i = 0; i < 4; i++) {
            if (i < count) {
                try {
                    JSONObject h = habits.getJSONObject(i);
                    String name = h.optString("name", "Habit");
                    String target = h.optString("target", "");
                    String drawableName = h.optString("drawable", "ic_habit_default");

                    int resId = getDrawableResourceId(context, drawableName);
                    android.util.Log.d("D1Notifications", "Habit Card " + i + " [" + name + "] -> drawable: " + drawableName + ", resId: " + resId);

                    // Collapsed chip
                    collapsedView.setViewVisibility(chipIds[i], View.VISIBLE);
                    collapsedView.setImageViewResource(chipIds[i], resId);

                    // Expanded card
                    expandedView.setViewVisibility(cardIds[i], View.VISIBLE);
                    expandedView.setImageViewResource(iconIds[i], resId);
                    expandedView.setTextViewText(nameIds[i], name);
                    expandedView.setTextViewText(targetIds[i], target);

                    // Make sure rows are visible
                    expandedView.setViewVisibility(R.id.notif_row_1, View.VISIBLE);
                    if (i >= 2) {
                        expandedView.setViewVisibility(R.id.notif_row_2, View.VISIBLE);
                    }
                } catch (Exception ignored) {}
            } else {
                collapsedView.setViewVisibility(chipIds[i], View.GONE);
                expandedView.setViewVisibility(cardIds[i], View.GONE);
            }
        }

        // Tap on notification -> opens Today view in MainActivity
        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setAction("OPEN_TODAY");
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(
            context, 
            NOTIFICATION_ID + 10, 
            openIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        // Tap on Snooze action -> snoozes 15 minutes
        Intent snoozeIntent = new Intent(context, D1NotificationReceiver.class);
        snoozeIntent.setAction("ACTION_SNOOZE");
        PendingIntent snoozePi = PendingIntent.getBroadcast(
            context, 
            NOTIFICATION_ID + 20, 
            snoozeIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_d1)
            // NO setColor -> prevents Android from tinting the status icon green
            // NO setLargeIcon -> completely removes top-right icon box!
            .setCustomContentView(collapsedView)
            .setCustomBigContentView(expandedView)
            .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
            .setContentIntent(openPi)
            .addAction(0, "Open Today", openPi)
            .addAction(0, "Snooze", snoozePi)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build());
    }

    public static int getDrawableResourceId(Context context, String drawableName) {
        if (drawableName == null || drawableName.trim().isEmpty()) {
            return R.drawable.ic_habit_default;
        }
        String name = drawableName.trim().toLowerCase();
        switch (name) {
            case "ic_habit_wine": return R.drawable.ic_habit_wine;
            case "ic_habit_target": return R.drawable.ic_habit_target;
            case "ic_habit_flame": return R.drawable.ic_habit_flame;
            case "ic_habit_trophy": return R.drawable.ic_habit_trophy;
            case "ic_habit_water": return R.drawable.ic_habit_water;
            case "ic_habit_workout": return R.drawable.ic_habit_workout;
            case "ic_habit_reading": return R.drawable.ic_habit_reading;
            case "ic_habit_meditation": return R.drawable.ic_habit_meditation;
            case "ic_habit_deepwork": return R.drawable.ic_habit_deepwork;
            case "ic_habit_wakeup": return R.drawable.ic_habit_wakeup;
            case "ic_habit_walking": return R.drawable.ic_habit_walking;
            case "ic_habit_protein": return R.drawable.ic_habit_protein;
            case "ic_habit_coldshower": return R.drawable.ic_habit_coldshower;
            case "ic_habit_journal": return R.drawable.ic_habit_journal;
            case "ic_habit_energy": return R.drawable.ic_habit_energy;
            case "ic_habit_screentime": return R.drawable.ic_habit_screentime;
            case "ic_habit_sunlight": return R.drawable.ic_habit_sunlight;
            case "ic_habit_heart": return R.drawable.ic_habit_heart;
            case "ic_habit_coffee": return R.drawable.ic_habit_coffee;
            case "ic_habit_rocket": return R.drawable.ic_habit_rocket;
            case "ic_habit_lightning": return R.drawable.ic_habit_lightning;
            case "ic_habit_brain": return R.drawable.ic_habit_brain;
            case "ic_habit_star": return R.drawable.ic_habit_star;
            case "ic_habit_sleep": return R.drawable.ic_habit_sleep;
            case "ic_habit_sleep_duration": return R.drawable.ic_habit_sleep_duration;
            case "ic_habit_multi": return R.drawable.ic_habit_multi;
            case "ic_habit_default": return R.drawable.ic_habit_default;
            case "ic_habit_drop": return R.drawable.ic_habit_drop;
            case "ic_habit_water_drop": return R.drawable.ic_habit_water_drop;
            case "ic_habit_barbell": return R.drawable.ic_habit_barbell;
            case "ic_habit_book": return R.drawable.ic_habit_book;
            case "ic_habit_menu_book": return R.drawable.ic_habit_menu_book;
            case "ic_habit_moon": return R.drawable.ic_habit_moon;
            case "ic_habit_alarm": return R.drawable.ic_habit_alarm;
            case "ic_habit_directions_walk": return R.drawable.ic_habit_directions_walk;
            case "ic_habit_footprints": return R.drawable.ic_habit_footprints;
            case "ic_habit_restaurant": return R.drawable.ic_habit_restaurant;
            case "ic_habit_ac_unit": return R.drawable.ic_habit_ac_unit;
            case "ic_habit_snowflake": return R.drawable.ic_habit_snowflake;
            case "ic_habit_edit_note": return R.drawable.ic_habit_edit_note;
            case "ic_habit_notepencil": return R.drawable.ic_habit_notepencil;
            case "ic_habit_bolt": return R.drawable.ic_habit_bolt;
            case "ic_habit_smartphone": return R.drawable.ic_habit_smartphone;
            case "ic_habit_devicemobile": return R.drawable.ic_habit_devicemobile;
            case "ic_habit_sun": return R.drawable.ic_habit_sun;
            case "ic_habit_hourglass": return R.drawable.ic_habit_hourglass;
            case "ic_habit_hourglass_empty": return R.drawable.ic_habit_hourglass_empty;
            case "ic_habit_psychology": return R.drawable.ic_habit_psychology;
            case "ic_habit_self_improvement": return R.drawable.ic_habit_self_improvement;
            case "ic_habit_fitness_center": return R.drawable.ic_habit_fitness_center;
            case "ic_habit_rocket_launch": return R.drawable.ic_habit_rocket_launch;
            case "ic_habit_custom": return R.drawable.ic_habit_custom;
            case "ic_habit_bedtime": return R.drawable.ic_habit_bedtime;
            default:
                try {
                    int resId = context.getResources().getIdentifier(name, "drawable", context.getPackageName());
                    return resId != 0 ? resId : R.drawable.ic_habit_default;
                } catch (Exception e) {
                    return R.drawable.ic_habit_default;
                }
        }
    }

    private static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Habit Reminders",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Daily reminders for remaining habits before bedtime");
            channel.enableLights(true);
            channel.enableVibration(true);
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }
}
