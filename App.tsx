import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from './src/constants/theme';
import { initDatabase } from './src/db/database';
import { SettingsProvider } from './src/context/SettingsContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { WorkoutsScreen } from './src/screens/WorkoutsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ExercisesScreen } from './src/screens/ExercisesScreen';
import { ToolsScreen } from './src/screens/ToolsScreen';
import { ActiveWorkoutBar } from './src/components/workout/ActiveWorkoutBar';
import { ActiveWorkoutModal } from './src/components/workout/ActiveWorkoutModal';
import { PRCelebrationModal } from './src/components/workout/PRCelebrationModal';
import { triggerHapticSelection } from './src/utils/haptics';

type Tab = 'workouts' | 'history' | 'exercises' | 'tools';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<Tab>('workouts');
  const insets = useSafeAreaInsets();

  const renderScreen = () => {
    switch (currentTab) {
      case 'workouts':
        return <WorkoutsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'exercises':
        return <ExercisesScreen />;
      case 'tools':
        return <ToolsScreen />;
    }
  };

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'workouts', label: 'Workouts', icon: 'barbell-outline', iconActive: 'barbell' },
    { key: 'history', label: 'History', icon: 'time-outline', iconActive: 'time' },
    { key: 'exercises', label: 'Exercises', icon: 'fitness-outline', iconActive: 'fitness' },
    { key: 'tools', label: 'Tools', icon: 'construct-outline', iconActive: 'construct' }
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Main Screen Content */}
      <View style={styles.screenArea}>
        {renderScreen()}
      </View>

      {/* Floating Active Workout Bar (when minimized) */}
      <ActiveWorkoutBar />

      {/* Bottom Tab Navigation */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {tabs.map((t) => {
          const isActive = currentTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              activeOpacity={0.7}
              style={styles.tabItem}
              onPress={() => {
                triggerHapticSelection();
                setCurrentTab(t.key);
              }}
            >
              <Ionicons
                name={isActive ? t.iconActive : t.icon}
                size={22}
                color={isActive ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Workout Fullscreen Modal */}
      <ActiveWorkoutModal />

      {/* Satisfying PR Notification Modal */}
      <PRCelebrationModal />
    </View>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
      } catch (e) {
        console.error('Database initialization error:', e);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="light" />
        <Ionicons name="barbell" size={54} color={THEME.colors.primary} />
        <Text style={styles.loadingTitle}>L!FT</Text>
        <ActivityIndicator size="small" color={THEME.colors.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <WorkoutProvider>
          <MainApp />
        </WorkoutProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  screenArea: {
    flex: 1
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: 1
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderColor: THEME.colors.border,
    paddingTop: 10,
    paddingHorizontal: 8
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted
  },
  tabLabelActive: {
    color: THEME.colors.primary
  }
});
