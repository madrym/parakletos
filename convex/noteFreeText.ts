import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createNoteFreeText = mutation({
    args: {
        noteId: v.id("notes"),
        userId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const noteFreeTextId = await ctx.db.insert("noteFreeText", {
            noteId: args.noteId,
            userId: args.userId,
            content: args.content,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return noteFreeTextId;
    },
})

export const getNoteFreeText = query({
    args: { noteId: v.id("notes") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("noteFreeText")
            .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
            .collect();
    },
})

export const getNoteFreeTextById = query({
    args: { noteFreeTextId: v.id("noteFreeText") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.noteFreeTextId);
    },
})

export const updateNoteFreeText = mutation({
    args: {
        noteFreeTextId: v.id("noteFreeText"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.noteFreeTextId, {
            content: args.content,
            updatedAt: Date.now(),
        });
    },
})

export const deleteNoteFreeText = mutation({
    args: { noteFreeTextId: v.id("noteFreeText") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.noteFreeTextId);
    },
})
