import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireOwnerId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not signed in");
  return identity.subject;
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const ownerId = identity.subject;
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner_created", (q: any) => q.eq("ownerId", ownerId))
      .order("desc")
      .collect();
    const withUrls = await Promise.all(
      notes.map(async (n: any) => ({
        ...n,
        photoUrls: (
          await Promise.all(n.photoIds.map((id: any) => ctx.storage.getUrl(id)))
        ).filter((u): u is string => u !== null),
      })),
    );
    return withUrls;
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
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.ownerId !== ownerId) throw new Error("Not found");
    await ctx.db.patch(args.id, { body: args.body, photoIds: args.photoIds });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.ownerId !== ownerId) throw new Error("Not found");
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
  args: { id: v.id("notes"), important: v.boolean() },
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.ownerId !== ownerId) throw new Error("Not found");
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
