package com.lift.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

class WorkoutWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_INC_WEIGHT = "com.lift.app.ACTION_WIDGET_INC_WEIGHT"
        const val ACTION_DEC_WEIGHT = "com.lift.app.ACTION_WIDGET_DEC_WEIGHT"
        const val ACTION_INC_REPS = "com.lift.app.ACTION_WIDGET_INC_REPS"
        const val ACTION_DEC_REPS = "com.lift.app.ACTION_WIDGET_DEC_REPS"
        const val ACTION_LOG_SET = "com.lift.app.ACTION_WIDGET_LOG_SET"

        fun updateAllWidgets(context: Context) {
            try {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = ComponentName(context, WorkoutWidgetProvider::class.java)
                val ids = appWidgetManager.getAppWidgetIds(componentName)
                if (ids != null && ids.isNotEmpty()) {
                    val intent = Intent(context, WorkoutWidgetProvider::class.java).apply {
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

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        try {
            val prefs = context.getSharedPreferences("LiftPrefs", Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean("workout_is_active", false)

            when (intent.action) {
                ACTION_INC_WEIGHT -> {
                    if (isActive) {
                        val currentWeight = prefs.getFloat("workout_current_weight", 60f)
                        val unit = prefs.getString("workout_unit", "kg") ?: "kg"
                        val step = if (unit == "lbs") 5f else 2.5f
                        val newWeight = currentWeight + step
                        prefs.edit().putFloat("workout_current_weight", newWeight).apply()
                        updateAllWidgets(context)
                    }
                }
                ACTION_DEC_WEIGHT -> {
                    if (isActive) {
                        val currentWeight = prefs.getFloat("workout_current_weight", 60f)
                        val unit = prefs.getString("workout_unit", "kg") ?: "kg"
                        val step = if (unit == "lbs") 5f else 2.5f
                        val newWeight = Math.max(0f, currentWeight - step)
                        prefs.edit().putFloat("workout_current_weight", newWeight).apply()
                        updateAllWidgets(context)
                    }
                }
                ACTION_INC_REPS -> {
                    if (isActive) {
                        val currentReps = prefs.getInt("workout_current_reps", 10)
                        val newReps = currentReps + 1
                        prefs.edit().putInt("workout_current_reps", newReps).apply()
                        updateAllWidgets(context)
                    }
                }
                ACTION_DEC_REPS -> {
                    if (isActive) {
                        val currentReps = prefs.getInt("workout_current_reps", 10)
                        val newReps = Math.max(1, currentReps - 1)
                        prefs.edit().putInt("workout_current_reps", newReps).apply()
                        updateAllWidgets(context)
                    }
                }
                ACTION_LOG_SET -> {
                    if (isActive) {
                        val exerciseId = prefs.getString("workout_exercise_id", "") ?: ""
                        val weight = prefs.getFloat("workout_current_weight", 60f)
                        val reps = prefs.getInt("workout_current_reps", 10)
                        val setNum = prefs.getInt("workout_set_number", 1)

                        // Append to pending_widget_logs JSON array
                        val existingLogs = prefs.getString("pending_widget_logs", "[]") ?: "[]"
                        val jsonArray = try {
                            JSONArray(existingLogs)
                        } catch (e: Exception) {
                            JSONArray()
                        }

                        val setObj = JSONObject().apply {
                            put("exerciseId", exerciseId)
                            put("weight", weight.toDouble())
                            put("reps", reps)
                            put("setNumber", setNum)
                            put("timestamp", System.currentTimeMillis())
                        }
                        jsonArray.put(setObj)

                        val nextSetNum = setNum + 1
                        val unit = prefs.getString("workout_unit", "kg") ?: "kg"
                        val weightDisplay = if (weight % 1 == 0f) weight.toInt().toString() else weight.toString()

                        prefs.edit()
                            .putString("pending_widget_logs", jsonArray.toString())
                            .putInt("workout_set_number", nextSetNum)
                            .putString("workout_set_details", "Set $nextSetNum")
                            .putString("workout_status_pill", "✓ Set $setNum logged ($weightDisplay $unit × $reps)! Rest started")
                            .apply()

                        updateAllWidgets(context)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        try {
            val prefs = context.getSharedPreferences("LiftPrefs", Context.MODE_PRIVATE)

            val isActive = prefs.getBoolean("workout_is_active", false)
            val workoutName = prefs.getString("workout_name", "No Active Workout") ?: "No Active Workout"
            val elapsedTime = prefs.getString("workout_elapsed_time", "00:00") ?: "00:00"
            val exerciseName = prefs.getString("workout_exercise_name", if (isActive) "Active Exercise" else "Tap to start a session") ?: "Tap to start"
            val setNumber = prefs.getInt("workout_set_number", 1)
            val setDetails = prefs.getString("workout_set_details", "Set $setNumber") ?: "Set $setNumber"
            val weight = prefs.getFloat("workout_current_weight", 60f)
            val reps = prefs.getInt("workout_current_reps", 10)
            val unit = prefs.getString("workout_unit", "kg") ?: "kg"
            val statusPill = prefs.getString("workout_status_pill", if (isActive) "⚡ Tap + / – to adjust • Log from Home Screen" else "Tap to open Lift") ?: "Tap to open Lift"

            val weightDisplay = if (weight % 1 == 0f) "${weight.toInt()} $unit" else "$weight $unit"
            val repsDisplay = "$reps reps"

            for (appWidgetId in appWidgetIds) {
                try {
                    val views = RemoteViews(context.packageName, R.layout.widget_workout)

                    views.setTextViewText(R.id.tv_workout_name, workoutName)
                    views.setTextViewText(R.id.tv_elapsed_time, elapsedTime)
                    views.setTextViewText(R.id.tv_exercise_name, exerciseName)
                    views.setTextViewText(R.id.tv_set_details, setDetails)
                    views.setTextViewText(R.id.tv_current_weight, weightDisplay)
                    views.setTextViewText(R.id.tv_current_reps, repsDisplay)
                    views.setTextViewText(R.id.tv_status_pill, statusPill)

                    if (isActive) {
                        views.setTextViewText(R.id.btn_log_set, "✓ LOG SET ($weightDisplay × $reps)")
                    } else {
                        views.setTextViewText(R.id.btn_log_set, "⚡ START WORKOUT")
                    }

                    // Open App intent (for header / title)
                    val openAppIntent = Intent(context, MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                    val openAppPendingIntent = PendingIntent.getActivity(
                        context,
                        0,
                        openAppIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(R.id.tv_workout_name, openAppPendingIntent)
                    views.setOnClickPendingIntent(R.id.tv_exercise_name, openAppPendingIntent)

                    // Stepper intents:
                    fun createBroadcastPendingIntent(action: String, requestCode: Int): PendingIntent {
                        val intent = Intent(context, WorkoutWidgetProvider::class.java).apply {
                            this.action = action
                        }
                        return PendingIntent.getBroadcast(
                            context,
                            requestCode,
                            intent,
                            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                        )
                    }

                    views.setOnClickPendingIntent(R.id.btn_dec_weight, createBroadcastPendingIntent(ACTION_DEC_WEIGHT, 101))
                    views.setOnClickPendingIntent(R.id.btn_inc_weight, createBroadcastPendingIntent(ACTION_INC_WEIGHT, 102))
                    views.setOnClickPendingIntent(R.id.btn_dec_reps, createBroadcastPendingIntent(ACTION_DEC_REPS, 103))
                    views.setOnClickPendingIntent(R.id.btn_inc_reps, createBroadcastPendingIntent(ACTION_INC_REPS, 104))

                    if (isActive) {
                        views.setOnClickPendingIntent(R.id.btn_log_set, createBroadcastPendingIntent(ACTION_LOG_SET, 105))
                    } else {
                        views.setOnClickPendingIntent(R.id.btn_log_set, openAppPendingIntent)
                    }

                    appWidgetManager.updateAppWidget(appWidgetId, views)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
