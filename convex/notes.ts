import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createNote = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    topics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert("notes", {
      userId: args.userId,
      title: args.title,
      topics: args.topics,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return noteId;
  },
});

export const getUserNotes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getNoteById = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { noteId, ...updates } = args;
    await ctx.db.patch(noteId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
  },
});

export const getAllNoteSections = query({
  handler: async (ctx) => {
    return await ctx.db.query("noteSections").collect();
  },
});

export const getNotesWithSections = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const notesWithSections = await Promise.all(
      notes.map(async (note) => {
        const sections = await ctx.db
          .query("noteSections")
          .withIndex("by_note", (q) => q.eq("noteId", note._id))
          .collect();
        return { ...note, sections };
      })
    );

    return notesWithSections.filter((note) => note.sections.length > 0);
  },
});

export const getNotesWithFreeText = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const notesWithFreeText = await Promise.all(
      notes.map(async (note) => {
        const freeText = await ctx.db
          .query("noteFreeText")
          .withIndex("by_note", (q) => q.eq("noteId", note._id))
          .collect();
        return { ...note, freeText };
      })
    );
    return notesWithFreeText.filter((note) => note.freeText.length > 0);
  },
});
