export function extractImageFiles(
  items: ArrayLike<{ type: string; getAsFile?: () => File | null }> | null | undefined,
): File[] {
  if (!items) return [];
  const files: File[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && item.type.startsWith("image/")) {
      const file = typeof item.getAsFile === "function" ? item.getAsFile() : (item as unknown as File);
      if (file) files.push(file);
    }
  }
  return files;
}

export function filterImageFiles(files: FileList | File[] | null | undefined): File[] {
  if (!files) return [];
  return Array.from(files).filter((f) => f && f.type.startsWith("image/"));
}
