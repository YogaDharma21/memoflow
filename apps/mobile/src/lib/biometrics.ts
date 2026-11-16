import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const PIN_CACHE_KEY_PREFIX = 'memoflows_pin_hash_';

export function getPinCacheKey(userId: string): string {
  return `${PIN_CACHE_KEY_PREFIX}${userId}`;
}

export async function getCachedPinHash(userId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await SecureStore.getItemAsync(getPinCacheKey(userId));
  } catch {
    return null;
  }
}

export async function setCachedPinHash(userId: string, hash: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.setItemAsync(getPinCacheKey(userId), hash);
  } catch {
    // Non-fatal if secure store is unavailable
  }
}

export async function clearCachedPinHash(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.deleteItemAsync(getPinCacheKey(userId));
  } catch {
    // Non-fatal
  }
}

export type BiometryType = 'face' | 'fingerprint' | 'iris' | 'none';

export type BiometricStatus = {
  isAvailable: boolean;
  biometryType: BiometryType;
};

export async function checkBiometrics(): Promise<BiometricStatus> {
  if (Platform.OS === 'web') {
    return { isAvailable: false, biometryType: 'none' };
  }
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { isAvailable: false, biometryType: 'none' };
    }
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { isAvailable: false, biometryType: 'none' };
    }
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    let biometryType: BiometryType = 'fingerprint';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'face';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometryType = 'iris';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = 'fingerprint';
    }
    return { isAvailable: true, biometryType };
  } catch {
    return { isAvailable: false, biometryType: 'none' };
  }
}

export async function promptBiometricUnlock(
  promptMessage = 'Unlock protected notes'
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
