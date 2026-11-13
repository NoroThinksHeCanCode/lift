package com.lift.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*
import org.json.JSONObject

class LiftNativeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val CHANNEL_ID = "lift_ongoing_workout"
    private val NOTIFICATION_ID = 1001

    override fun getName(): String = "LiftNative"

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Ongoing Workout"
            val descriptionText = "Displays active workout controls and timer in the notification shade"
            val importance = NotificationManager.IMPORTANCE_LOW // Low importance prevents repetitive sound/vibe on ticker update
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
            }
            val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    @ReactMethod
    fun updateOngoingWorkoutNotification(title: String, exercise: String, setInfo: String, restInfo: String) {
        try {
            val intent = Intent(reactContext, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                reactContext,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(reactContext, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("🏋️ L!FT: $title")
                .setContentText(if (exercise.isNotEmpty()) "$exercise • $setInfo" else setInfo)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)

            if (restInfo.isNotEmpty()) {
                builder.setSubText(restInfo)
            }

            val notificationManager = NotificationManagerCompat.from(reactContext)
            notificationManager.notify(NOTIFICATION_ID, builder.build())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun clearOngoingWorkoutNotification() {
        try {
            val notificationManager = NotificationManagerCompat.from(reactContext)
            notificationManager.cancel(NOTIFICATION_ID)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun updateWidgets(workoutJson: String?) {
        try {
            val prefs = reactContext.getSharedPreferences("LiftPrefs", Context.MODE_PRIVATE).edit()

            workoutJson?.let {
                val json = JSONObject(it)
                if (json.has("workoutName")) prefs.putString("workout_name", json.getString("workoutName"))
                if (json.has("formattedTime")) prefs.putString("workout_elapsed_time", json.getString("formattedTime"))
                if (json.has("exerciseName")) prefs.putString("workout_exercise_name", json.getString("exerciseName"))
                if (json.has("exerciseId")) prefs.putString("workout_exercise_id", json.getString("exerciseId"))
                if (json.has("setNumber")) prefs.putInt("workout_set_number", json.getInt("setNumber"))
                if (json.has("weight")) prefs.putFloat("workout_current_weight", json.getDouble("weight").toFloat())
                if (json.has("reps")) prefs.putInt("workout_current_reps", json.getInt("reps"))
                if (json.has("unit")) prefs.putString("workout_unit", json.getString("unit"))
                if (json.has("setDetails")) prefs.putString("workout_set_details", json.getString("setDetails"))
                if (json.has("statusPill")) prefs.putString("workout_status_pill", json.getString("statusPill"))
                if (json.has("isActive")) prefs.putBoolean("workout_is_active", json.getBoolean("isActive"))
            }

            prefs.apply()

            // Trigger widget broadcast
            WorkoutWidgetProvider.updateAllWidgets(reactContext)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun getPendingWidgetLogs(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("LiftPrefs", Context.MODE_PRIVATE)
            val logs = prefs.getString("pending_widget_logs", "[]") ?: "[]"
            promise.resolve(logs)
        } catch (e: Exception) {
            promise.reject("ERR_PREFS", e.message)
        }
    }

    @ReactMethod
    fun clearPendingWidgetLogs(promise: Promise) {
        try {
            reactContext.getSharedPreferences("LiftPrefs", Context.MODE_PRIVATE)
                .edit()
                .putString("pending_widget_logs", "[]")
                .apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_PREFS", e.message)
        }
    }

    @ReactMethod
    fun openNotificationSettings() {
        try {
            val intent = Intent().apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                    putExtra(Settings.EXTRA_APP_PACKAGE, reactContext.packageName)
                } else {
                    action = Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                    data = Uri.fromParts("package", reactContext.packageName, null)
                }
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
