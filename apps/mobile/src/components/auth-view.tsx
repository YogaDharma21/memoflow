import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export function AuthView() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignIn = async () => {
    if (!signInLoaded || !signIn) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
      } else {
        setError('Additional verification required.');
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async () => {
    if (!signUpLoaded || !signUp) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
      } else {
        setError('Check email to complete sign up.');
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: colors.text }]}>memoflows</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to see your notes.
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundElement,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Email address"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundElement,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {Boolean(error) && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={mode === 'signin' ? onSignIn : onSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
          }}
          style={styles.switchButton}
        >
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Text>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.four,
  },
  input: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    fontSize: 14,
  },
  button: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: Spacing.three,
    padding: Spacing.one,
  },
  switchText: {
    fontSize: 13,
  },
  error: {
    fontSize: 12,
    marginVertical: Spacing.one,
    textAlign: 'center',
  },
});
