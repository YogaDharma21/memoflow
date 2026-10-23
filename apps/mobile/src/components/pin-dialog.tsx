import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  mode: 'set' | 'check';
  error: string;
  onCancel: () => void;
  onSubmit: (pin: string) => void;
};

export function PinDialog({ visible, mode, error, onCancel, onSubmit }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [pin, setPin] = useState('');

  useEffect(() => {
    if (visible) {
      setPin('');
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'set' ? 'Set a PIN' : 'Enter PIN'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === 'set'
              ? 'First time. 4 characters or more.'
              : 'Type your PIN.'}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.cardBorder,
              },
            ]}
            placeholder="PIN"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            keyboardType="numeric"
            autoFocus
            value={pin}
            onChangeText={setPin}
            onSubmitEditing={() => onSubmit(pin)}
          />

          {Boolean(error) && (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {error}
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => onSubmit(pin)}
            >
              <Text
                style={[styles.buttonText, { color: colors.primaryForeground }]}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: Spacing.four,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: Spacing.three,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  error: {
    fontSize: 12,
    marginBottom: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
