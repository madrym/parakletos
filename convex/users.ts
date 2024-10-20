import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUser = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();
    return user;
  },
});

export const createUser = mutation({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createUser without authentication present");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // If not, create a new user
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      name: identity.name,
      givenName: identity.givenName,
      email: identity.email,
    });

    return userId;
  },
});