import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { triggerHapticPR, triggerHapticSelection } from '../../utils/haptics';

export const PRCelebrationModal: React.FC = () => {
  const { currentPRNotification, dismissPRNotification } = useWorkout();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentPRNotification) {
      triggerHapticPR();

      // Slide down and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: insets.top + 8,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4200);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-120);
      opacityAnim.setValue(0);
    }
  }, [currentPRNotification]);

  if (!currentPRNotification) return null;

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissPRNotification();
    });
  };

  const getPRLabel = () => {
    switch (currentPRNotification.type) {
      case 'weight':
        return 'HEAVIEST WEIGHT PR';
      case '1rm':
        return 'ESTIMATED 1RM PR';
      case 'reps':
        return 'REP RECORD PR';
      default:
        return 'NEW PERSONAL RECORD';
    }
  };

  const weight = currentPRNotification.weight ?? currentPRNotification.value;
  const reps = currentPRNotification.reps ?? 1;
  const unit = currentPRNotification.unit;
  const est1RM = currentPRNotification.estimated1RM;

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.toastCard}
        onPress={() => {
          triggerHapticSelection();
          handleDismiss();
        }}
      >
        {/* Gold Trophy Icon Badge */}
        <View style={styles.trophyBadge}>
          <Ionicons name="trophy" size={20} color={THEME.colors.gold} />
        </View>

        {/* PR Info */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.prBadgeText}>{getPRLabel()}</Text>
          </View>

          <Text style={styles.exerciseName} numberOfLines={1}>
            {currentPRNotification.exerciseName}
          </Text>

          <View style={styles.detailsRow}>
            <Text style={styles.scoreText}>
              {weight} {unit} × {reps} reps
            </Text>

            {est1RM && est1RM > 0 ? (
              <View style={styles.est1RMTag}>
                <Ionicons name="analytics-outline" size={11} color="#06B6D4" />
                <Text style={styles.est1RMText}>
                  Est. 1RM: {est1RM} {unit}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            triggerHapticSelection();
            handleDismiss();
          }}
        >
          <Ionicons name="close" size={18} color="#737373" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 99999,
  },
  toastCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.gold,
    shadowColor: THEME.colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  trophyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  prBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.gold,
    letterSpacing: 0.8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  est1RMTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  est1RMText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06B6D4',
  },
  closeBtn: {
    padding: 6,
    marginLeft: 6,
  },
});
