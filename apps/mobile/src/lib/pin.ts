import * as Crypto from 'expo-crypto';

export async function hashPin(clerkUserId: string, pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${clerkUserId}:${pin}`
  );
}
