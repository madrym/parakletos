import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createNoteSectionAnnotation = mutation({
    args: {
        noteId: v.id("notes"),
        sectionId: v.id("noteSections"),
        content: v.string(),
        verses: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const noteSectionAnnotationId = await ctx.db.insert("noteSectionAnnotations", {
            noteId: args.noteId,
            sectionId: args.sectionId,
            content: args.content,
            verses: args.verses,
        });
        return noteSectionAnnotationId;
    },
})

export const getNoteSectionAnnotations = query({
    args: { noteId: v.id("notes"), sectionId: v.id("noteSections") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("noteSectionAnnotations")
            .withIndex("by_note_and_section", (q) => q.eq("noteId", args.noteId).eq("sectionId", args.sectionId))
            .collect();
    },
})

export const getNoteSectionAnnotationById = query({
    args: { noteSectionAnnotationId: v.id("noteSectionAnnotations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.noteSectionAnnotationId);
    },
})

export const updateNoteSectionAnnotation = mutation({
    args: {
        noteSectionAnnotationId: v.id("noteSectionAnnotations"),
        content: v.string(),
        verses: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.noteSectionAnnotationId, {
            content: args.content,
            verses: args.verses,
        });
    },
})

export const deleteNoteSectionAnnotation = mutation({
    args: { noteSectionAnnotationId: v.id("noteSectionAnnotations") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.noteSectionAnnotationId);
    },
})

export const getNoteSectionAnnotationsByNoteId = query({
    args: { noteId: v.id("notes") },
    handler: async (ctx, args) => {
        return await ctx.db.query("noteSectionAnnotations").withIndex("by_note", (q) => q.eq("noteId", args.noteId)).collect();
    },
})