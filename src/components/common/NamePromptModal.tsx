import React, { useState } from 'react';
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
import { triggerHapticSuccess } from '../../utils/haptics';

interface NamePromptModalProps {
  visible: boolean;
  onSave: (name: string) => void;
  initialName?: string;
}

export const NamePromptModal: React.FC<NamePromptModalProps> = ({
  visible,
  onSave,
  initialName = ''
}) => {
  const [name, setName] = useState(initialName);

  const handleSubmit = () => {
    triggerHapticSuccess();
    const finalName = name.trim() || 'Lifter';
    onSave(finalName);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="barbell" size={32} color={THEME.colors.primary} />
            </View>

            <Text style={styles.title}>WELCOME TO L!FT</Text>
            <Text style={styles.subtitle}>What should we call you?</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your name..."
              placeholderTextColor="#737373"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>LET'S L!FT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => onSave('Lifter')}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#262626'
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${THEME.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${THEME.colors.primary}40`
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 14,
    color: '#A8A8A8',
    marginBottom: 20
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 20,
    textAlign: 'center'
  },
  submitBtn: {
    width: '100%',
    height: 48,
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  skipBtnText: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '600'
  }
});
