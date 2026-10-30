import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

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
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {Boolean(message) && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: colors.borderSubtle },
              ]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isDestructive
                    ? colors.destructive
                    : colors.primary,
                },
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: colors.primaryForeground },
                ]}
              >
                {confirmText}
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
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.four,
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
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
