import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notes: defineTable({
    body: v.string(),
    photoIds: v.array(v.id("_storage")),
    important: v.boolean(),
    createdAt: v.number(),
    ownerId: v.string(),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_owner_created", ["ownerId", "createdAt"])
    .index("by_owner_important", ["ownerId", "important"]),
  userSettings: defineTable({
    clerkUserId: v.string(),
    pinHash: v.optional(v.string()),
  }).index("by_clerk_user", ["clerkUserId"]),
});
