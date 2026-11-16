/**
 * Calculates aspect-ratio preserving dimensions bounded by maxDim x maxDim.
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDim = 2048
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: Math.max(1, width), height: Math.max(1, height) }
  }
  if (width <= maxDim && height <= maxDim) {
    return { width, height }
  }
  if (width >= height) {
    const targetWidth = maxDim
    const targetHeight = Math.max(1, Math.round((height * maxDim) / width))
    return { width: targetWidth, height: targetHeight }
  } else {
    const targetHeight = maxDim
    const targetWidth = Math.max(1, Math.round((width * maxDim) / height))
    return { width: targetWidth, height: targetHeight }
  }
}

/**
 * Resizes and compresses image files client-side using Browser Canvas.
 * Caps maximum dimension at maxDim (default 2048px) and compresses to 82% WebP (fallback JPEG).
 */
export async function compressImage(
  file: File,
  options: { maxDim?: number; quality?: number } = {}
): Promise<File> {
  const { maxDim = 2048, quality = 0.82 } = options

  // Skip non-raster or non-image types
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file
  }

  // Fallback in non-browser environments
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file
  }

  let sourceWidth = 0
  let sourceHeight = 0
  let drawable: CanvasImageSource | null = null
  let cleanup = () => {}

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      })
      sourceWidth = bitmap.width
      sourceHeight = bitmap.height
      drawable = bitmap
      cleanup = () => bitmap.close()
    } catch {
      // Fall through to Image element
    }
  }

  if (!drawable) {
    try {
      const url = URL.createObjectURL(file)
      cleanup = () => URL.revokeObjectURL(url)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = (err) => reject(err)
        image.src = url
      })
      sourceWidth = img.naturalWidth || img.width
      sourceHeight = img.naturalHeight || img.height
      drawable = img
    } catch {
      cleanup()
      return file
    }
  }

  try {
    const { width, height } = calculateTargetDimensions(
      sourceWidth,
      sourceHeight,
      maxDim
    )

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) return file

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(drawable, 0, 0, width, height)

    // Try WebP first
    let blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    )
    let format = "image/webp"
    let ext = "webp"

    // If WebP unsupported, fallback to JPEG
    if (!blob || blob.type !== "image/webp") {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      )
      format = "image/jpeg"
      ext = "jpg"
    }

    if (!blob) return file

    // If file was already smaller and within bounds, preserve original
    if (
      file.size <= blob.size &&
      sourceWidth <= maxDim &&
      sourceHeight <= maxDim
    ) {
      return file
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "")
    return new File([blob], `${baseName}.${ext}`, {
      type: format,
      lastModified: Date.now(),
    })
  } catch {
    return file
  } finally {
    cleanup()
  }
}
