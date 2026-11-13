import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { PlateCalculatorModal } from '../components/plates/PlateCalculatorModal';
import { OneRepMaxModal } from '../components/calculator/OneRepMaxModal';
import { exportWorkoutsToCSV, importWorkoutsFromCSV } from '../services/csvService';
import { triggerHapticSelection, triggerHapticSuccess } from '../utils/haptics';

export const ToolsScreen: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [show1RMCalc, setShow1RMCalc] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportCSV = async () => {
    triggerHapticSelection();
    setExporting(true);
    const result = await exportWorkoutsToCSV(settings.unit);
    setExporting(false);

    if (result.success) {
      triggerHapticSuccess();
    } else {
      Alert.alert('Export Failed', result.error || 'Could not export workout data.');
    }
  };

  const handleImportCSV = async () => {
    triggerHapticSelection();
    Alert.alert(
      'Import Workout Data (.CSV)',
      'Importing will merge workouts and sets from your CSV into your Lift database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose CSV File',
          onPress: async () => {
            setImporting(true);
            const result = await importWorkoutsFromCSV();
            setImporting(false);

            if (result.success) {
              triggerHapticSuccess();
              Alert.alert(
                'Import Completed!',
                `Successfully imported ${result.workoutsImported} workouts and ${result.setsImported} sets into Lift.`
              );
            } else if (result.error !== 'Document selection canceled.') {
              Alert.alert('Import Error', result.error || 'Failed to parse CSV file.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>UTILITIES & DATA</Text>
        <Text style={styles.headerTitle}>Tools & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Tools Cards */}
        <Text style={styles.sectionTitle}>LIFTER CALCULATORS</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.toolCard}
          onPress={() => {
            triggerHapticSelection();
            setShowPlateCalc(true);
          }}
        >
          <View style={[styles.toolIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
            <Ionicons name="disc-outline" size={26} color={THEME.colors.cyan} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.toolTitle}>Plate Calculator</Text>
            <Text style={styles.toolSub}>
              Barbell sleeve breakdown for {settings.unit === 'lbs' ? '45, 35, 25, 10, 5, 2.5' : '25, 20, 15, 10, 5, 2.5, 1.25'} plates
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.toolCard}
          onPress={() => {
            triggerHapticSelection();
            setShow1RMCalc(true);
          }}
        >
          <View style={[styles.toolIconWrap, { backgroundColor: THEME.colors.goldGlow }]}>
            <Ionicons name="calculator-outline" size={26} color={THEME.colors.gold} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.toolTitle}>1-Rep Max Calculator</Text>
            <Text style={styles.toolSub}>
              Scientific Epley & Brzycki formulas + percentage rep targets
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        {/* CSV DATA BACKUP & RESTORE (Features 4 & 5) */}
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>DATA BACKUP & SYNC</Text>

        <View style={styles.dataCard}>
          <View style={styles.dataRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toolTitle}>Export Data (.CSV)</Text>
              <Text style={styles.toolSub}>Export your entire lift history, weights, reps, and RPE to a spreadsheet file.</Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleExportCSV}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#08090B" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={15} color="#08090B" />
                  <Text style={styles.actionBtnText}>Export</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.dataRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toolTitle}>Import Data (.CSV)</Text>
              <Text style={styles.toolSub}>Restore a backup or migrate past workouts from CSV.</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={handleImportCSV}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              ) : (
                <>
                  <Ionicons name="download-outline" size={15} color={THEME.colors.primary} />
                  <Text style={[styles.actionBtnText, { color: THEME.colors.primary }]}>Import</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>PREFERENCES</Text>

        {/* User Profile Name */}
        <View style={styles.settingCard}>
          <Text style={styles.settingTitle}>Your Name</Text>
          <Text style={styles.settingSub}>Used for personalized greetings</Text>
          <TextInput
            style={styles.nameInput}
            value={settings.userName || ''}
            placeholder="Enter your name..."
            placeholderTextColor="#737373"
            onChangeText={(txt: string) => updateSettings({ userName: txt })}
          />
        </View>

        {/* Free-Set Rest Timer Menu (Feature 4) */}
        <View style={styles.settingCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.settingTitle}>Default Rest Timer</Text>
              <Text style={styles.settingSub}>Set standard countdown for all workouts</Text>
            </View>
            <Text style={styles.restDisplayVal}>{settings.defaultRestSeconds}s</Text>
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                triggerHapticSelection();
                updateSettings({ defaultRestSeconds: Math.max(15, settings.defaultRestSeconds - 30) });
              }}
            >
              <Text style={styles.stepBtnText}>-30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                triggerHapticSelection();
                updateSettings({ defaultRestSeconds: Math.max(15, settings.defaultRestSeconds - 15) });
              }}
            >
              <Text style={styles.stepBtnText}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                triggerHapticSelection();
                updateSettings({ defaultRestSeconds: settings.defaultRestSeconds + 15 });
              }}
            >
              <Text style={styles.stepBtnText}>+15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                triggerHapticSelection();
                updateSettings({ defaultRestSeconds: settings.defaultRestSeconds + 30 });
              }}
            >
              <Text style={styles.stepBtnText}>+30s</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Default Workout Rep Range Menu (Feature 6: All Workouts Together) */}
        <View style={styles.settingCard}>
          <Text style={styles.settingTitle}>Default Target Rep Range</Text>
          <Text style={styles.settingSub}>Applied to all workouts together; hitting the ceiling triggers overload</Text>

          <View style={styles.repRangeControls}>
            <View style={styles.repBox}>
              <Text style={styles.repLabel}>MIN REPS</Text>
              <View style={styles.stepperInline}>
                <TouchableOpacity
                  style={styles.miniBtn}
                  onPress={() => {
                    triggerHapticSelection();
                    const next = Math.max(1, (settings.defaultRepRangeMin || 8) - 1);
                    updateSettings({ defaultRepRangeMin: next });
                  }}
                >
                  <Ionicons name="remove" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.repVal}>{settings.defaultRepRangeMin || 8}</Text>
                <TouchableOpacity
                  style={styles.miniBtn}
                  onPress={() => {
                    triggerHapticSelection();
                    const next = (settings.defaultRepRangeMin || 8) + 1;
                    const max = Math.max(next, settings.defaultRepRangeMax || 12);
                    updateSettings({ defaultRepRangeMin: next, defaultRepRangeMax: max });
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.dashText}>–</Text>

            <View style={styles.repBox}>
              <Text style={styles.repLabel}>MAX REPS (TARGET)</Text>
              <View style={styles.stepperInline}>
                <TouchableOpacity
                  style={styles.miniBtn}
                  onPress={() => {
                    triggerHapticSelection();
                    const min = settings.defaultRepRangeMin || 8;
                    const next = Math.max(min, (settings.defaultRepRangeMax || 12) - 1);
                    updateSettings({ defaultRepRangeMax: next });
                  }}
                >
                  <Ionicons name="remove" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.repVal}>{settings.defaultRepRangeMax || 12}</Text>
                <TouchableOpacity
                  style={styles.miniBtn}
                  onPress={() => {
                    triggerHapticSelection();
                    const next = (settings.defaultRepRangeMax || 12) + 1;
                    updateSettings({ defaultRepRangeMax: next });
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* RPE vs RIR Scale Toggle (Feature 2) */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Exertion Scale</Text>
            <Text style={styles.settingSub}>Choose RPE (1-10) or RIR (reps in reserve 0-4)</Text>
          </View>
          <View style={styles.unitToggleGroup}>
            <TouchableOpacity
              style={[styles.unitToggleBtn, settings.rpeScale === 'RPE' && styles.unitToggleBtnActive]}
              onPress={() => {
                triggerHapticSelection();
                updateSettings({ rpeScale: 'RPE' });
              }}
            >
              <Text style={[styles.unitToggleText, settings.rpeScale === 'RPE' && styles.unitToggleTextActive]}>
                RPE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitToggleBtn, settings.rpeScale === 'RIR' && styles.unitToggleBtnActive]}
              onPress={() => {
                triggerHapticSelection();
                updateSettings({ rpeScale: 'RIR' });
              }}
            >
              <Text style={[styles.unitToggleText, settings.rpeScale === 'RIR' && styles.unitToggleTextActive]}>
                RIR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unit Selector */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Weight Unit</Text>
            <Text style={styles.settingSub}>Pounds (lbs) or Kilograms (kg)</Text>
          </View>
          <View style={styles.unitToggleGroup}>
            <TouchableOpacity
              style={[styles.unitToggleBtn, settings.unit === 'lbs' && styles.unitToggleBtnActive]}
              onPress={() => {
                triggerHapticSelection();
                updateSettings({ unit: 'lbs' });
              }}
            >
              <Text style={[styles.unitToggleText, settings.unit === 'lbs' && styles.unitToggleTextActive]}>
                LBS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitToggleBtn, settings.unit === 'kg' && styles.unitToggleBtnActive]}
              onPress={() => {
                triggerHapticSelection();
                updateSettings({ unit: 'kg' });
              }}
            >
              <Text style={[styles.unitToggleText, settings.unit === 'kg' && styles.unitToggleTextActive]}>
                KG
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Auto-Start Rest Timer</Text>
            <Text style={styles.settingSub}>Start rest clock immediately upon set check-off</Text>
          </View>
          <Switch
            value={settings.autoRestTimer}
            onValueChange={(val) => {
              triggerHapticSelection();
              updateSettings({ autoRestTimer: val });
            }}
            trackColor={{ false: THEME.colors.surfaceHighlight, true: THEME.colors.primary }}
            thumbColor="#F8FAFC"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Haptic Feedback</Text>
            <Text style={styles.settingSub}>Tactile vibration on PR hits & timer countdowns</Text>
          </View>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(val) => {
              triggerHapticSelection();
              updateSettings({ hapticsEnabled: val });
            }}
            trackColor={{ false: THEME.colors.surfaceHighlight, true: THEME.colors.primary }}
            thumbColor="#F8FAFC"
          />
        </View>

        {/* Theme Status */}
        <View style={styles.themeInfoCard}>
          <Ionicons name="moon" size={18} color={THEME.colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.themeInfoTitle}>Lift • OLED Dark Minimalist</Text>
            <Text style={styles.themeInfoSub}>
              Engineered exclusively in pure black for battery efficiency and distraction-free gym sessions.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <PlateCalculatorModal
        visible={showPlateCalc}
        onClose={() => setShowPlateCalc(false)}
      />

      <OneRepMaxModal
        visible={show1RMCalc}
        onClose={() => setShow1RMCalc(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 1.2
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginTop: 2
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 12
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  toolIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary
  },
  toolSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
    lineHeight: 16
  },
  dataCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 12
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4
  },
  actionBtnSecondary: {
    backgroundColor: THEME.colors.primaryGlow,
    borderWidth: 1,
    borderColor: THEME.colors.primary
  },
  actionBtnText: {
    color: '#08090B',
    fontWeight: '800',
    fontSize: 12
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  settingCard: {
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  settingSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  nameInput: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10
  },
  restDisplayVal: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.cyan
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  stepBtn: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  stepBtnText: {
    color: THEME.colors.textPrimary,
    fontWeight: '800',
    fontSize: 13
  },
  repRangeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12
  },
  repBox: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center'
  },
  repLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6
  },
  stepperInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  miniBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: THEME.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  repVal: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    minWidth: 24,
    textAlign: 'center'
  },
  dashText: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.textMuted,
    marginHorizontal: 10
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  unitToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6
  },
  unitToggleBtnActive: {
    backgroundColor: THEME.colors.primary
  },
  unitToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary
  },
  unitToggleTextActive: {
    color: '#08090B'
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  presetBtn: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  presetBtnActive: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: THEME.colors.primary
  },
  presetText: {
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    fontSize: 12
  },
  presetTextActive: {
    color: THEME.colors.primary
  },
  themeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    padding: 14,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginTop: 8
  },
  themeInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  themeInfoSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    lineHeight: 15
  }
});
