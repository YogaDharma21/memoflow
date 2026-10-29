import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireOwnerId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not signed in");
  return identity.subject;
}

export const listMine = query({
  args: {
    pinHash: v.optional(v.string()),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const ownerId = identity.subject;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_user", (q: any) => q.eq("clerkUserId", ownerId))
      .unique();
    const isUnlocked =
      !settings?.pinHash ||
      (Boolean(args.pinHash) && args.pinHash === settings.pinHash);

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner_created", (q: any) => {
        let range = q.eq("ownerId", ownerId);
        if (args.from !== undefined) range = range.gte("createdAt", args.from);
        if (args.to !== undefined) range = range.lte("createdAt", args.to);
        return range;
      })
      .order("desc")
      .collect();

    return notes.map((n: any) => {
      const locked = Boolean(n.important && !isUnlocked);
      return {
        ...n,
        body: locked ? "" : n.body,
        photoIds: locked ? [] : n.photoIds,
        photoUrls: [],
        isLocked: locked,
      };
    });
  },
});

export const getPhotoUrls = query({
  args: {
    photoIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return {};
    const entries = await Promise.all(
      args.photoIds.map(async (id: any) => {
        try {
          const url = await ctx.storage.getUrl(id);
          return [id, url] as const;
        } catch {
          return [id, null] as const;
        }
      }),
    );
    return Object.fromEntries(
      entries.filter((entry): entry is [string, string] => entry[1] !== null),
    );
  },
});

export const create = mutation({
  args: {
    body: v.string(),
    photoIds: v.array(v.id("_storage")),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    return await ctx.db.insert("notes", {
      body: args.body,
      photoIds: args.photoIds,
      important: false,
      createdAt: args.createdAt,
      ownerId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    body: v.string(),
    photoIds: v.array(v.id("_storage")),
    pinHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.ownerId !== ownerId) throw new Error("Not found");
    if (note.important) {
      const settings = await ctx.db
        .query("userSettings")
        .withIndex("by_clerk_user", (q: any) => q.eq("clerkUserId", ownerId))
        .unique();
      if (settings?.pinHash && settings.pinHash !== args.pinHash) {
        throw new Error("Locked note: PIN required");
      }
    }
    await ctx.db.patch(args.id, { body: args.body, photoIds: args.photoIds });
    const nextIds = new Set(args.photoIds);
    for (const sid of note.photoIds ?? []) {
      if (!nextIds.has(sid)) {
        try {
          await ctx.storage.delete(sid);
        } catch {
          // File may already be gone. Link removal is what matters.
        }
      }
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("notes"),
    pinHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.ownerId !== ownerId) throw new Error("Not found");
    if (note.important) {
      const settings = await ctx.db
        .query("userSettings")
        .withIndex("by_clerk_user", (q: any) => q.eq("clerkUserId", ownerId))
        .unique();
      if (settings?.pinHash && settings.pinHash !== args.pinHash) {
        throw new Error("Locked note: PIN required");
      }
    }
    for (const sid of note.photoIds) {
      try {
        await ctx.storage.delete(sid);
      } catch {
        // File may already be gone. Link removal is what matters.
      }
    }
    await ctx.db.delete(args.id);
  },
});

export const setImportant = mutation({
  args: {
    id: v.id("notes"),
    important: v.boolean(),
    pinHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.ownerId !== ownerId) throw new Error("Not found");
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_user", (q: any) => q.eq("clerkUserId", ownerId))
      .unique();
    if (settings?.pinHash && settings.pinHash !== args.pinHash) {
      throw new Error("PIN required");
    }
    await ctx.db.patch(args.id, { important: args.important });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwnerId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
