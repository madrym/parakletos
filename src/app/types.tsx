export interface Verse {
    number: number;
    text: string;
    highlight?: boolean;
  }

  export interface NoteSection {
    noteId: string;
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    bibleReference: string;
    content: string;
    topics: string[];
  }

  export interface NoteSectionAnnotations {
    sectionId: string;
    verseRange: string;
    content: string;
    createdAt: number;
    updatedAt: number;
  }

  export interface SelectedVerse {
    sectionId: string;
    verseNumber: number;
  }
  
  export interface NIVData {
    book: string;
    chapters: {
      chapter: number;
      verses: {
        verse: number;
        text: string;
      }[];
    }[];
  }

  export interface BibleVerse {
    id?: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }
  

  export interface User {
    id: string;
    tokenIdentifier: string;
    name?: string;
    email?: string;
  }

  export interface Record {
    id: string;
    userId: string;
    title: string;
    generalNotes: string;
    createdAt: number;
    updatedAt: number;
  }

  export interface Topic {
    id: string;
    userId: string;
    name: string;
  }

  export interface RecordTag {
    id: string;
    userId: string;
    recordId: string;
    topicId: string;
  }

  export interface VerseTag {
    id: string;
    userId: string;
    sectionId: string;
    verseNumber: number;
    topicId: string;
  }