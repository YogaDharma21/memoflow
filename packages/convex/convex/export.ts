import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export interface ZipEntry {
  name: string;
  data: Uint8Array | string;
  lastModified?: Date;
}

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

export function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i]!;
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function toDosDateTime(date: Date = new Date()): { time: number; date: number } {
  const safeDate = isNaN(date.getTime()) ? new Date() : date;
  const hours = safeDate.getHours();
  const minutes = safeDate.getMinutes();
  const seconds = Math.floor(safeDate.getSeconds() / 2);
  const time = (hours << 11) | (minutes << 5) | seconds;

  const year = Math.max(1980, safeDate.getFullYear()) - 1980;
  const month = safeDate.getMonth() + 1;
  const day = safeDate.getDate();
  const d = (year << 9) | (month << 5) | day;

  return { time, date: d };
}

export function createZipArchive(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const prepared = entries.map((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data;
    const crc = calculateCrc32(dataBytes);
    const dt = toDosDateTime(entry.lastModified || new Date());
    return {
      nameBytes,
      dataBytes,
      crc,
      dateTime: dt,
      size: dataBytes.length,
    };
  });

  let totalSize = 0;
  for (const item of prepared) {
    totalSize += 30 + item.nameBytes.length + item.size; // Local header + data
    totalSize += 46 + item.nameBytes.length;            // Central dir header
  }
  totalSize += 22; // End of Central Directory Record

  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);

  let localOffset = 0;
  const localOffsets: number[] = [];

  // Write local file headers & file payload
  for (const item of prepared) {
    localOffsets.push(localOffset);
    view.setUint32(localOffset + 0, 0x04034b50, true);
    view.setUint16(localOffset + 4, 20, true);
    view.setUint16(localOffset + 6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(localOffset + 8, 0, true);      // Store (no compression)
    view.setUint16(localOffset + 10, item.dateTime.time, true);
    view.setUint16(localOffset + 12, item.dateTime.date, true);
    view.setUint32(localOffset + 14, item.crc, true);
    view.setUint32(localOffset + 18, item.size, true);
    view.setUint32(localOffset + 22, item.size, true);
    view.setUint16(localOffset + 26, item.nameBytes.length, true);
    view.setUint16(localOffset + 28, 0, true);

    out.set(item.nameBytes, localOffset + 30);
    out.set(item.dataBytes, localOffset + 30 + item.nameBytes.length);
    localOffset += 30 + item.nameBytes.length + item.size;
  }

  const cdOffset = localOffset;

  // Write central directory records
  for (let i = 0; i < prepared.length; i++) {
    const item = prepared[i]!;
    const offset = localOffsets[i]!;

    view.setUint32(localOffset + 0, 0x02014b50, true);
    view.setUint16(localOffset + 4, 20, true);
    view.setUint16(localOffset + 6, 20, true);
    view.setUint16(localOffset + 8, 0x0800, true); // UTF-8 filename flag
    view.setUint16(localOffset + 10, 0, true);     // Store (no compression)
    view.setUint16(localOffset + 12, item.dateTime.time, true);
    view.setUint16(localOffset + 14, item.dateTime.date, true);
    view.setUint32(localOffset + 16, item.crc, true);
    view.setUint32(localOffset + 20, item.size, true);
    view.setUint32(localOffset + 24, item.size, true);
    view.setUint16(localOffset + 28, item.nameBytes.length, true);
    view.setUint16(localOffset + 30, 0, true);
    view.setUint16(localOffset + 32, 0, true);
    view.setUint16(localOffset + 34, 0, true);
    view.setUint16(localOffset + 36, 0, true);
    view.setUint32(localOffset + 38, 0, true);
    view.setUint32(localOffset + 42, offset, true);

    out.set(item.nameBytes, localOffset + 46);
    localOffset += 46 + item.nameBytes.length;
  }

  const cdSize = localOffset - cdOffset;

  // Write End of Central Directory (EOCD)
  view.setUint32(localOffset + 0, 0x06054b50, true);
  view.setUint16(localOffset + 4, 0, true);
  view.setUint16(localOffset + 6, 0, true);
  view.setUint16(localOffset + 8, prepared.length, true);
  view.setUint16(localOffset + 10, prepared.length, true);
  view.setUint32(localOffset + 12, cdSize, true);
  view.setUint32(localOffset + 16, cdOffset, true);
  view.setUint16(localOffset + 20, 0, true);

  return out;
}

export function detectExtension(mimeType: string | undefined, bytes: Uint8Array): string {
  if (mimeType) {
    const lower = mimeType.toLowerCase();
    if (lower.includes("png")) return "png";
    if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
    if (lower.includes("webp")) return "webp";
    if (lower.includes("gif")) return "gif";
    if (lower.includes("svg")) return "svg";
  }
  if (bytes.length >= 4) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "webp";
  }
  return "jpg";
}

export function formatNoteFilename(createdAt: number, id: string): string {
  const d = new Date(createdAt);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  const secs = pad(d.getSeconds());
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return `notes/${year}-${month}-${day}_${hours}-${mins}-${secs}_${safeId}.md`;
}

export function buildMarkdown(
  note: {
    _id: string;
    body: string;
    createdAt: number;
    important: boolean;
  },
  photoFiles: string[] = []
): string {
  const dateIso = new Date(note.createdAt).toISOString();
  const photoFrontmatter =
    photoFiles.length === 0
      ? "photos: []"
      : `photos:\n${photoFiles.map((p) => `  - "../${p}"`).join("\n")}`;

  const frontmatter = [
    "---",
    `id: "${note._id}"`,
    `createdAt: ${note.createdAt}`,
    `date: "${dateIso}"`,
    `important: ${Boolean(note.important)}`,
    photoFrontmatter,
    "---",
  ].join("\n");

  const parts = [frontmatter, "", note.body];

  if (photoFiles.length > 0) {
    parts.push("");
    parts.push("## Photos");
    for (let i = 0; i < photoFiles.length; i++) {
      parts.push(`![Photo ${i + 1}](../${photoFiles[i]})`);
    }
  }

  return parts.join("\n") + "\n";
}

export const getExportData = internalQuery({
  args: {
    pinHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not signed in");
    const ownerId = identity.subject;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_user", (q: any) => q.eq("clerkUserId", ownerId))
      .unique();

    if (settings?.pinHash) {
      if (!args.pinHash || args.pinHash !== settings.pinHash) {
        throw new Error("PIN required: valid PIN required to export archive");
      }
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner_created", (q: any) => q.eq("ownerId", ownerId))
      .order("desc")
      .collect();

    return {
      ownerId,
      notes: notes.map((n: any) => ({
        _id: n._id as string,
        body: n.body as string,
        photoIds: (n.photoIds || []) as string[],
        important: Boolean(n.important),
        createdAt: n.createdAt as number,
      })),
    };
  },
});

export const exportArchive = action({
  args: {
    pinHash: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    storageId: string;
    downloadUrl: string;
    filename: string;
    notesCount: number;
    photosCount: number;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not signed in");

    const data: {
      ownerId: string;
      notes: Array<{
        _id: string;
        body: string;
        photoIds: string[];
        important: boolean;
        createdAt: number;
      }>;
    } = await ctx.runQuery(internal.export.getExportData, {
      pinHash: args.pinHash,
    });

    const zipEntries: ZipEntry[] = [];
    const notesExportJson: Array<{
      id: string;
      createdAt: number;
      createdAtISO: string;
      important: boolean;
      body: string;
      markdownPath: string;
      photos: string[];
    }> = [];

    let photosCount = 0;

    for (const note of data.notes) {
      const photoFiles: string[] = [];

      for (let i = 0; i < (note.photoIds || []).length; i++) {
        const photoId = note.photoIds[i]!;
        try {
          const blob = await ctx.storage.get(photoId as any);
          if (blob) {
            const arrayBuf = await blob.arrayBuffer();
            const dataBytes = new Uint8Array(arrayBuf);
            const ext = detectExtension(blob.type, dataBytes);
            const filename = `photos/${note._id}_${i + 1}.${ext}`;
            photoFiles.push(filename);
            zipEntries.push({
              name: filename,
              data: dataBytes,
              lastModified: new Date(note.createdAt),
            });
            photosCount++;
          }
        } catch {
          // Keep export proceeding even if individual media is missing
        }
      }

      const noteFilename = formatNoteFilename(note.createdAt, note._id);
      const markdown = buildMarkdown(note, photoFiles);

      zipEntries.push({
        name: noteFilename,
        data: markdown,
        lastModified: new Date(note.createdAt),
      });

      notesExportJson.push({
        id: note._id,
        createdAt: note.createdAt,
        createdAtISO: new Date(note.createdAt).toISOString(),
        important: note.important,
        body: note.body,
        markdownPath: noteFilename,
        photos: photoFiles,
      });
    }

    const exportedAt = new Date().toISOString();
    const exportMetadata = {
      version: 1,
      exportedAt,
      ownerId: data.ownerId,
      notesCount: data.notes.length,
      photosCount,
      notes: notesExportJson,
    };

    zipEntries.push({
      name: "data.json",
      data: JSON.stringify(exportMetadata, null, 2),
      lastModified: new Date(),
    });

    const readme = [
      "# Memoflows Data Sovereignty Archive",
      "",
      `Exported at: ${exportedAt}`,
      `Total Notes: ${data.notes.length}`,
      `Total Photos: ${photosCount}`,
      "",
      "## Archive Structure",
      "- `notes/`: Markdown files with YAML frontmatter for each note.",
      "- `photos/`: Media files referenced in notes.",
      "- `data.json`: Raw archive containing full metadata and content.",
      "",
      "Compatible with Obsidian, Logseq, and standard Markdown tools.",
      "",
    ].join("\n");

    zipEntries.push({
      name: "README.md",
      data: readme,
      lastModified: new Date(),
    });

    const zipBytes = createZipArchive(zipEntries);
    const zipBlob = new Blob([zipBytes.buffer as ArrayBuffer], {
      type: "application/zip",
    });
    const storageId = await ctx.storage.store(zipBlob);
    const downloadUrl = await ctx.storage.getUrl(storageId);

    if (!downloadUrl) {
      throw new Error("Failed to generate download URL for archive");
    }

    const dateStr = exportedAt.slice(0, 10);
    const filename = `memoflows-export-${dateStr}.zip`;

    return {
      storageId: storageId as string,
      downloadUrl,
      filename,
      notesCount: data.notes.length,
      photosCount,
    };
  },
});
