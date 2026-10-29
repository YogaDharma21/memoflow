export type FlashbackGroup<T extends { createdAt: number }> = {
  year: number;
  yearsAgo: number;
  notes: T[];
};

export function getFlashbacks<T extends { createdAt: number }>(
  notes: T[],
  cursor: Date
): T[] {
  const m = cursor.getMonth();
  const d = cursor.getDate();
  const y = cursor.getFullYear();

  return notes
    .filter((n) => {
      const dt = new Date(n.createdAt);
      return (
        dt.getMonth() === m &&
        dt.getDate() === d &&
        dt.getFullYear() < y
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function groupFlashbacksByYear<T extends { createdAt: number }>(
  notes: T[],
  cursor: Date
): FlashbackGroup<T>[] {
  const flashbacks = getFlashbacks(notes, cursor);
  const cursorYear = cursor.getFullYear();
  const map = new Map<number, T[]>();

  for (const n of flashbacks) {
    const yr = new Date(n.createdAt).getFullYear();
    const list = map.get(yr);
    if (list) {
      list.push(n);
    } else {
      map.set(yr, [n]);
    }
  }

  const groups: FlashbackGroup<T>[] = [];
  for (const [year, groupNotes] of map.entries()) {
    groups.push({
      year,
      yearsAgo: cursorYear - year,
      notes: groupNotes,
    });
  }

  return groups.sort((a, b) => b.year - a.year);
}
