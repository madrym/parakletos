import axios from 'axios';
import { getBookId } from './bookIdMapping';

interface VerseData {
  id: number;
  book: {
    id: number;
    name: string;
    testament: string;
  };
  chapterId: number;
  verseId: number;
  verse: string;
}

interface ParsedReference {
  bookName: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

type BiblePassage = {
  bookName: string;
  chapter: number;
  verses: VerseData[];
};

// Function to parse the Bible reference string
export function parseBibleReference(input: string): ParsedReference {
  const regex = /^(.+?)(\d+)(?:\s*[:.]?\s*v?\s*(\d+)(?:\s*-\s*(\d+))?)?$/i;
  const match = input.trim().match(regex);

  if (!match) {
    throw new Error(`Invalid reference format: "${input}"`);
  }

  const bookName = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;

  return {
    bookName,
    chapter,
    startVerse,
    endVerse,
  };
}

// Function to fetch chapter verses from the API
export async function fetchChapterVerses(
  bookId: number,
  chapter: number,
  translation: string = 'niv'
): Promise<VerseData[]> {
  const url = `https://bible-go-api.rkeplin.com/v1/books/${bookId}/chapters/${chapter}?translation=${translation}`;

  const response = await axios.get(url);

  if (response.status !== 200) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  return response.data as VerseData[];
}

// Function to filter verses based on start and end verse numbers
export function filterVerses(
  verses: VerseData[],
  startVerse?: number,
  endVerse?: number
): VerseData[] {
  if (startVerse === undefined || endVerse === undefined) {
    return verses; // Return all verses if no specific verses are specified
  }

  return verses.filter(
    (verse) => verse.verseId >= startVerse && verse.verseId <= endVerse
  );
}

// Main function to get the Bible passage based on user input
export async function getBiblePassage(
  input: string,
  translation: string = 'niv'
) {
  try {
    // Step 1: Parse the reference
    const reference = parseBibleReference(input);

    // Step 2: Get the book ID
    const bookId = getBookId(reference.bookName);
    // Step 3: Fetch the chapter data
    if (bookId === null) {
      throw new Error('Invalid book ID');
    }
    const verses = await fetchChapterVerses(bookId, reference.chapter, translation);

    // Step 4: Filter verses if needed
    const filteredVerses = reference.startVerse !== undefined
      ? filterVerses(verses, reference.startVerse, reference.endVerse)
      : verses;

    const biblePassage: BiblePassage = {
      bookName: filteredVerses[0].book.name,
      chapter: reference.chapter,
      verses: filteredVerses,
    };

    return biblePassage;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
}