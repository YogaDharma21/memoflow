import { manipulateAsync, SaveFormat, Action } from 'expo-image-manipulator';

/**
 * Resizes and compresses image on mobile using expo-image-manipulator.
 * Bounds dimensions to maxDim (2048px) and compresses to 82% JPEG.
 */
export async function compressMobileImage(
  asset: {
    uri: string;
    width?: number;
    height?: number;
    mimeType?: string;
  },
  maxDim = 2048,
  quality = 0.82
): Promise<{ uri: string; mimeType: string }> {
  const actions: Action[] = [];
  const w = asset.width ?? 0;
  const h = asset.height ?? 0;

  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      actions.push({ resize: { width: maxDim } });
    } else {
      actions.push({ resize: { height: maxDim } });
    }
  }

  try {
    const result = await manipulateAsync(asset.uri, actions, {
      compress: quality,
      format: SaveFormat.JPEG,
    });
    return {
      uri: result.uri,
      mimeType: 'image/jpeg',
    };
  } catch {
    return {
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  }
}
