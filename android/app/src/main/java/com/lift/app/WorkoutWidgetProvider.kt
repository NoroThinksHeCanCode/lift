package com.lift.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class WorkoutWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("LiftPrefs", Context.MODE_PRIVATE)

        val isActive = prefs.getBoolean("workout_is_active", false)
        val workoutName = prefs.getString("workout_name", "No Active Workout") ?: "No Active Workout"
        val elapsedTime = prefs.getString("workout_elapsed_time", "00:00") ?: "00:00"
        val exerciseName = prefs.getString("workout_exercise_name", "Tap to start a session") ?: "Tap to start a session"
        val setDetails = prefs.getString("workout_set_details", "Set 1 • Ready to lift") ?: "Set 1 • Ready to lift"
        val statusPill = prefs.getString("workout_status_pill", "⚡ Open App to Log Sets") ?: "⚡ Open App to Log Sets"

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_workout)

            views.setTextViewText(R.id.tv_workout_name, workoutName)
            views.setTextViewText(R.id.tv_elapsed_time, elapsedTime)
            views.setTextViewText(R.id.tv_exercise_name, exerciseName)
            views.setTextViewText(R.id.tv_set_details, setDetails)
            views.setTextViewText(R.id.tv_status_pill, statusPill)

            // Intent to open Lift app
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    companion object {
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, WorkoutWidgetProvider::class.java)
            val ids = appWidgetManager.getAppWidgetIds(componentName)
            if (ids.isNotEmpty()) {
                val intent = Intent(context, WorkoutWidgetProvider::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                }
                context.sendBroadcast(intent)
            }
        }
    }
}
