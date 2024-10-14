import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.optional(v.string()),
    givenName: v.optional(v.string()),
    name: v.optional(v.string()),
    tokenIdentifier: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_name", ["name"])
    .index("by_token", ["tokenIdentifier"]),
    
  notes: defineTable({
    userId: v.id("users"), // Reference to the user who created the note
    title: v.string(), // Title of the note, e.g., "Sunday Sermon on Hope"
    createdAt: v.number(), // Timestamp of when the note was created
    updatedAt: v.number(), // Timestamp of when the note was last updated
    topics: v.array(v.string()), // Array of labels to categorize the note, e.g., ["Faith", "Hope", "Sermon"]
  }).index("by_user", ["userId"]),
  
  noteSections: defineTable({
    noteId: v.id("notes"), // Reference to the note this section is attached to
    bibleReference: v.string(), // Bible reference, e.g., "John 3:16-20"
    content: v.array(
      v.object({
        book: v.string(),
        chapter: v.float64(),
        text: v.string(),
        verse: v.float64()
      })
    ),
    createdAt: v.number(), // Timestamp of when the note section was created
    updatedAt: v.number(), // Timestamp of when the note section was last updated
  }).index("by_note", ["noteId"]),

  noteSectionAnnotations: defineTable({
    noteId: v.id("notes"), // Reference to the note this annotation is attached to
    sectionId: v.id("noteSections"), // Reference to the note section this annotation is attached to
    content: v.string(), // User's notes or annotations
    verses: v.array(v.string()), // Array of verse ids, e.g., ["John 3:16", "John 3:17"]
  }).index("by_note_and_section", ["noteId", "sectionId"])
    .index("by_note", ["noteId"]),

  verseTags: defineTable({
    userId: v.id("users"), // Reference to the user who created the tag
    bibleReference: v.string(), // Bible reference, e.g., "John 3:16-20"
    topics: v.array(v.string()), // Array of labels to categorize the verse, e.g., ["Faith", "Love"]
    createdAt: v.number(), // Timestamp of when the tag was created
    updatedAt: v.number(), // Timestamp of when the tag was last updated
  }).index("by_user", ["userId"]),

  noteFreeText: defineTable({
    noteId: v.id("notes"), // Reference to the note this free text content is attached to
    userId: v.id("users"), // Reference to the user who created the note
    content: v.string(), // Free text content, which can include text, images, etc.
    createdAt: v.number(), // Timestamp of when the free text note was created
    updatedAt: v.number(), // Timestamp of when the free text note was last updated
  }).index("by_note", ["noteId"])
    .index("by_user", ["userId"]),
});
