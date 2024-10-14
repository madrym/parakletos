import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createNoteSection = mutation({
    args: {
        noteId: v.id("notes"),
        bibleReference: v.string(),
        content: v.array(v.object({
            book: v.string(),
            chapter: v.number(),
            verse: v.number(),
            text: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        const noteSectionId = await ctx.db.insert("noteSections", {
            noteId: args.noteId,
            bibleReference: args.bibleReference,
            content: args.content,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return noteSectionId;
    },
});

export const getNoteSections = query({
    args: { noteId: v.id("notes") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("noteSections")
            .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
            .collect();
    },
});

export const getNoteSectionById = query({
    args: { noteSectionId: v.id("noteSections") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.noteSectionId);
    },
});

export const updateNoteSection = mutation({
    args: {
        noteSectionId: v.id("noteSections"),
        bibleReference: v.string(),
        content: v.array(v.object({
            book: v.string(),
            chapter: v.number(),
            verse: v.number(),
            text: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.noteSectionId, {
            bibleReference: args.bibleReference,
            content: args.content,
            updatedAt: Date.now(),
        });
    },
});

export const deleteNoteSection = mutation({
    args: { noteSectionId: v.id("noteSections") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.noteSectionId);
    },
});

export const getAllNoteSections = query({
  handler: async (ctx) => {
    return await ctx.db.query("noteSections").collect();
  },
});
