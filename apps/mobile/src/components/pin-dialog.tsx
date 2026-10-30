import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import {
  checkBiometrics,
  getCachedPinHash,
  promptBiometricUnlock,
  type BiometryType,
} from '@/lib/biometrics';

type Props = {
  visible: boolean;
  mode: 'set' | 'check';
  error: string;
  userId?: string;
  onCancel: () => void;
  onSubmit: (pin: string) => void;
  onBiometricSuccess?: (cachedHash: string) => void;
};

export function PinDialog({
  visible,
  mode,
  error,
  userId,
  onCancel,
  onSubmit,
  onBiometricSuccess,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const [pin, setPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('none');
  const [biometricPrompting, setBiometricPrompting] = useState(false);
  const autoTriggered = useRef(false);

  const triggerBiometric = useCallback(async () => {
    if (biometricPrompting || !userId || !onBiometricSuccess) return;
    setBiometricPrompting(true);
    try {
      const cachedHash = await getCachedPinHash(userId);
      if (!cachedHash) {
        setBiometricAvailable(false);
        return;
      }
      const ok = await promptBiometricUnlock();
      if (ok) {
        onBiometricSuccess(cachedHash);
      }
    } finally {
      setBiometricPrompting(false);
    }
  }, [biometricPrompting, userId, onBiometricSuccess]);

  useEffect(() => {
    if (!visible) {
      autoTriggered.current = false;
      setBiometricAvailable(false);
      return;
    }

    setPin('');

    if (mode !== 'check' || !userId || !onBiometricSuccess) {
      return;
    }

    let active = true;

    const init = async () => {
      const [bioStatus, cachedHash] = await Promise.all([
        checkBiometrics(),
        getCachedPinHash(userId),
      ]);

      if (!active) return;

      const available = bioStatus.isAvailable && Boolean(cachedHash);
      setBiometricAvailable(available);
      setBiometryType(bioStatus.biometryType);

      if (available && cachedHash && !autoTriggered.current) {
        autoTriggered.current = true;
        setBiometricPrompting(true);
        try {
          const ok = await promptBiometricUnlock();
          if (active && ok) {
            onBiometricSuccess(cachedHash);
          }
        } finally {
          if (active) {
            setBiometricPrompting(false);
          }
        }
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [visible, mode, userId, onBiometricSuccess]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'set' ? 'Set a PIN' : 'Enter PIN'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === 'set'
              ? 'First time. 4 characters or more.'
              : 'Type your PIN.'}
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="PIN"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              keyboardType="numeric"
              autoFocus={!biometricAvailable}
              value={pin}
              onChangeText={setPin}
              onSubmitEditing={() => onSubmit(pin)}
            />
            {mode === 'check' && biometricAvailable && (
              <TouchableOpacity
                style={[
                  styles.biometricButton,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                  },
                ]}
                onPress={triggerBiometric}
                disabled={biometricPrompting}
                accessibilityLabel="Unlock with biometrics"
              >
                <Ionicons
                  name={biometryType === 'face' ? 'scan-outline' : 'finger-print'}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
          </View>

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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  biometricButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 12,
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
