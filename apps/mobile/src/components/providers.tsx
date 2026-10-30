import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};

export function Providers({ children }: { children: ReactNode }) {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const convex = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [convexUrl]
  );

  if (!convexUrl || !clerkKey || !convex) {
    return (
      <View style={styles.configContainer}>
        <Text style={styles.configTitle}>Configuration needed</Text>
        <Text style={styles.configText}>
          Set EXPO_PUBLIC_CONVEX_URL and EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in apps/mobile/.env to connect to your backend.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  configContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#08090b',
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#f4f4f2',
  },
  configText: {
    fontSize: 14,
    color: '#8a8c92',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
  },
});
