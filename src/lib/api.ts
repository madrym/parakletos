import axios from 'axios';

interface ParsedReference {
  bookName: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

type BiblePassage = {
  bookName: string;
  chapter: number;
  esvResponse: ESVResponse;
};

interface ESVResponse {
  query: string;
  canonical: string;
  parsed: number[][];
  passage_meta: {
    canonical: string;
    chapter_start: number[];
    chapter_end: number[];
    prev_verse: number;
    next_verse: number;
    prev_chapter: number[];
    next_chapter: number[];
  }[];
  passages: string[];
}

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
  bookName: string,
  chapter: number,
  startVerse?: number,
  endVerse?: number,
): Promise<ESVResponse> {
  const verseRange = startVerse !== undefined ? `${startVerse}${endVerse !== undefined ? `-${endVerse}` : ''}` : '';
  const url = `https://api.esv.org/v3/passage/text/?q=${bookName}${chapter}:${verseRange}&include-headings=false&include-verse-numbers=false&include-footnotes=false`;

  const response = await axios.get<ESVResponse>(url, {
    headers: {
      'Authorization': `Token ${process.env.ESV_API_TOKEN}`
    }
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  return response.data
}

// Main function to get the Bible passage based on user input
export async function getBiblePassage(
  input: string
) {
  try {
    // Step 1: Parse the reference
    const reference = parseBibleReference(input);

    // Step 2: Fetch the chapter data
    const esvResponse = await fetchChapterVerses(reference.bookName, reference.chapter, reference.startVerse, reference.endVerse);

    const biblePassage: BiblePassage = {
      bookName: reference.bookName,
      chapter: reference.chapter,
      esvResponse: esvResponse
    };

    return biblePassage;

  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
}