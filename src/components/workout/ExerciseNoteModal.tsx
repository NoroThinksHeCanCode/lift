import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

interface ExerciseNoteModalProps {
  visible: boolean;
  exerciseName: string;
  initialNote: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

export const ExerciseNoteModal: React.FC<ExerciseNoteModalProps> = ({
  visible,
  exerciseName,
  initialNote,
  onSave,
  onClose,
}) => {
  const [note, setNote] = useState(initialNote || '');

  useEffect(() => {
    if (visible) {
      setNote(initialNote || '');
    }
  }, [visible, initialNote]);

  const handleSave = () => {
    triggerHapticSuccess();
    onSave(note.trim());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Exercise Notes</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{exerciseName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.desc}>
              Save machine setup pin numbers, grip width, or form cues for this exercise.
            </Text>

            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="e.g., Seat pin #4, wide neutral grip, 3-second eccentric pause..."
              placeholderTextColor="#737373"
              value={note}
              onChangeText={setNote}
              autoFocus
            />

            <View style={styles.actions}>
              {note.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    triggerHapticSelection();
                    setNote('');
                  }}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  desc: {
    fontSize: 12,
    color: '#737373',
    lineHeight: 17,
    marginBottom: 14,
  },
  textInput: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  clearText: {
    fontSize: 13,
    color: THEME.colors.danger,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8A8A8',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});
