export interface Verse {
    id: string;
    number: number;
    text: string;
    highlight?: string;
  }
  
  export interface Section {
    id: string;
    title: string;
    verses: Verse[];
    notes: BibleNote[];
  }

  export interface SelectedVerse {
    sectionId: string;
    verseNumber: number;
  }

  export interface BibleNote {
    id: string;
    verseNumbers: number[];
    text: string;
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