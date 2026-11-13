package com.lift.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class HealthWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        try {
            val prefs = context.getSharedPreferences("LiftPrefs", Context.MODE_PRIVATE)

            val score = prefs.getString("health_score", "88% Readiness") ?: "88% Readiness"
            val sleep = prefs.getString("health_sleep", "7h 48m") ?: "7h 48m"
            val steps = prefs.getString("health_steps", "8,940") ?: "8,940"
            val rhr = prefs.getString("health_rhr", "52 bpm") ?: "52 bpm"
            val advice = prefs.getString("health_advice", "Optimal Recovery • Great day for heavy PRs!") ?: "Optimal Recovery • Great day for heavy PRs!"

            for (appWidgetId in appWidgetIds) {
                try {
                    val views = RemoteViews(context.packageName, R.layout.widget_health)

                    views.setTextViewText(R.id.tv_health_score, score)
                    views.setTextViewText(R.id.tv_health_sleep, sleep)
                    views.setTextViewText(R.id.tv_health_steps, steps)
                    views.setTextViewText(R.id.tv_health_rhr, rhr)
                    views.setTextViewText(R.id.tv_health_advice, advice)

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
                    views.setOnClickPendingIntent(R.id.health_widget_root, pendingIntent)

                    appWidgetManager.updateAppWidget(appWidgetId, views)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    companion object {
        fun updateAllWidgets(context: Context) {
            try {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = ComponentName(context, HealthWidgetProvider::class.java)
                val ids = appWidgetManager.getAppWidgetIds(componentName)
                if (ids != null && ids.isNotEmpty()) {
                    val intent = Intent(context, HealthWidgetProvider::class.java).apply {
                        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                    }
                    context.sendBroadcast(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
