import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createVerseTag = mutation({
    args: {
        userId: v.id("users"),
        bibleReference: v.string(),
        topics: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const verseTagId = await ctx.db.insert("verseTags", {
            userId: args.userId,
            bibleReference: args.bibleReference,
            topics: args.topics,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
})

export const getVerseTags = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("verseTags")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
})

export const getVerseTagById = query({
    args: { verseTagId: v.id("verseTags") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.verseTagId);
    },
})

export const updateVerseTag = mutation({
    args: {
        verseTagId: v.id("verseTags"),
        topics: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.verseTagId, {
            topics: args.topics,
            updatedAt: Date.now(),
        });
    },
})

export const deleteVerseTag = mutation({
    args: { verseTagId: v.id("verseTags") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.verseTagId);
    },
})