import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function SSOCallback() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'light' ? 'light' : 'dark'];

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/');
      return;
    }

    const timer = setTimeout(() => {
      router.replace('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
