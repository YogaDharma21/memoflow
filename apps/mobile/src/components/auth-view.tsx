import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  useColorScheme,
} from 'react-native';
import { useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

export function AuthView() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const onGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        path: 'sso-callback',
      });
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || err?.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>memoflows</Text>

        {Boolean(error) && (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <FontAwesome name="google" size={16} color={colors.primaryForeground} />
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                Continue with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: Spacing.four,
  },
  button: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
});
