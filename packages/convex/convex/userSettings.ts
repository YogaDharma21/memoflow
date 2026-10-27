import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_user", (q: any) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique()
    return {
      hasPin: Boolean(settings?.pinHash),
    }
  },
})

export const verifyPin = mutation({
  args: { pinHash: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return false
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_user", (q: any) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique()
    return Boolean(settings?.pinHash && settings.pinHash === args.pinHash)
  },
})

export const setPinHash = mutation({
  args: { pinHash: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not signed in")
    if (args.pinHash.length < 8) throw new Error("Bad hash")
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_user", (q: any) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { pinHash: args.pinHash })
    } else {
      await ctx.db.insert("userSettings", {
        clerkUserId: identity.subject,
        pinHash: args.pinHash,
      })
    }
  },
})

export const removePin = mutation({
  args: { pinHash: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not signed in")
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_user", (q: any) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique()
    if (existing) {
      if (
        existing.pinHash &&
        args.pinHash &&
        existing.pinHash !== args.pinHash
      ) {
        throw new Error("PIN required")
      }
      await ctx.db.patch(existing._id, { pinHash: undefined })
    }
  },
})
