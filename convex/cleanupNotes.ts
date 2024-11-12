import { internalMutation } from "./_generated/server";

export const deleteEmptyNotes = internalMutation({
  handler: async (ctx) => {
    const notes = await ctx.db.query("notes").collect();
    
    for (const note of notes) {
      const noteSections = await ctx.db
        .query("noteSections")
        .withIndex("by_note", (q) => q.eq("noteId", note._id))
        .first();
      
      if (!noteSections && (!note.topics || note.topics.length === 0)) {
        await ctx.db.delete(note._id);
      }
    }
  },
});