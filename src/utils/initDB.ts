import Dexie from 'dexie';
import { NIVData, BibleVerse } from '@/app/types';

class BibleDatabase extends Dexie {
  verses!: Dexie.Table<BibleVerse, number>;

  constructor() {
    super('BibleDatabase');
    this.version(1).stores({
      verses: '++id, &[book+chapter+verse], book, chapter, verse'
    });
  }
}

const db = new BibleDatabase();

export async function initialiseDB(nivData: NIVData[]) {
  try {
    const count = await db.verses.count();
    if (count === 0) {
      console.log('Database is empty. Initializing with NIV data...');
      const verses: BibleVerse[] = [];
      for (const book of nivData) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            verses.push({
              book: book.book,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text.trim()
            });
          }
        }
      }
      
      if (verses.length > 0) {
        try {
          await db.verses.bulkAdd(verses);
          console.log(`Successfully added ${verses.length} verses to IndexedDB`);
        } catch (error) {
          if (error instanceof Dexie.BulkError) {
            console.warn(`Some verses were not added. ${error.failures.length} failures.`);
          } else {
            throw error;
          }
        }
      } else {
        console.log('No verses to add');
      }
    } else {
      console.log(`Database already contains ${count} verses. Skipping initialization.`);
    }
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
  }
}

export async function clearDatabase() {
  try {
    await db.verses.clear();
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

// Add this object to map abbreviations to full book names
const bookAbbreviations: { [key: string]: string } = {
  'gen': 'Genesis',
  'ex': 'Exodus',
  'lev': 'Leviticus',
  'num': 'Numbers',
  'deut': 'Deuteronomy',
  'josh': 'Joshua',
  'judg': 'Judges',
  'ruth': 'Ruth',
  '1sam': '1 Samuel',
  '2sam': '2 Samuel',
  '1kgs': '1 Kings',
  '2kgs': '2 Kings',
  '1chr': '1 Chronicles',
  '2chr': '2 Chronicles',
  'ezra': 'Ezra',
  'neh': 'Nehemiah',
  'esth': 'Esther',
  'job': 'Job',
  'ps': 'Psalms',
  'prov': 'Proverbs',
  'eccl': 'Ecclesiastes',
  'song': 'Song of Solomon',
  'isa': 'Isaiah',
  'jer': 'Jeremiah',
  'lam': 'Lamentations',
  'ezek': 'Ezekiel',
  'dan': 'Daniel',
  'hos': 'Hosea',
  'joel': 'Joel',
  'amos': 'Amos',
  'obad': 'Obadiah',
  'jonah': 'Jonah',
  'mic': 'Micah',
  'nah': 'Nahum',
  'hab': 'Habakkuk',
  'zeph': 'Zephaniah',
  'hag': 'Haggai',
  'zech': 'Zechariah',
  'mal': 'Malachi',
  'matt': 'Matthew',
  'mk': 'Mark',
  'lk': 'Luke',
  'jn': 'John',
  'acts': 'Acts',
  'rom': 'Romans',
  '1cor': '1 Corinthians',
  '2cor': '2 Corinthians',
  'gal': 'Galatians',
  'eph': 'Ephesians',
  'phil': 'Philippians',
  'col': 'Colossians',
  '1thess': '1 Thessalonians',
  '2thess': '2 Thessalonians',
  '1tim': '1 Timothy',
  '2tim': '2 Timothy',
  'titus': 'Titus',
  'phlm': 'Philemon',
  'heb': 'Hebrews',
  'jas': 'James',
  '1pet': '1 Peter',
  '2pet': '2 Peter',
  '1jn': '1 John',
  '2jn': '2 John',
  '3jn': '3 John',
  'jude': 'Jude',
  'rev': 'Revelation',
  '1john': '1 John',
  '2john': '2 John',
  '3john': '3 John',
  '1kings': '1 Kings',
  '2kings': '2 Kings',
  '1chronicles': '1 Chronicles',
  '2chronicles': '2 Chronicles',
  '1corinthians': '1 Corinthians',
  '2corinthians': '2 Corinthians',
  '1thessalonians': '1 Thessalonians',
  '2thessalonians': '2 Thessalonians',
  '1timothy': '1 Timothy',
  '2timothy': '2 Timothy',
  '1peter': '1 Peter',
  '2peter': '2 Peter'
};

function parseReference(reference: string): { book: string, chapter: number, verse?: number, endVerse?: number } {
  // Normalize spaces: ensure single space between words, trim ends
  const normalizedReference = reference.replace(/\s+/g, ' ').trim();
  
  // Updated regex patterns to handle various formats
  const chapterOnlyMatch = normalizedReference.match(/^(\d?\s?[a-z]+(?:\s[a-z]+)?)\s?(\d+)$/i);
  const verseMatch = normalizedReference.match(/^(\d?\s?[a-z]+(?:\s[a-z]+)?)\s?(\d+):(\d+)(-(\d+))?$/i);
  
  let book: string, chapter: string, verse: string | undefined, endVerse: string | undefined;

  if (!chapterOnlyMatch && !verseMatch) {
    // Try to match references without spaces like "1John1"
    const noSpaceMatch = normalizedReference.match(/^(\d?[a-z]+)(\d+)$/i);
    if (noSpaceMatch) {
      [, book, chapter] = noSpaceMatch;
    } else {
      throw new Error('Invalid reference format');
    }
  } else if (chapterOnlyMatch) {
    [, book, chapter] = chapterOnlyMatch;
  } else {
    [, book, chapter, verse, , endVerse] = verseMatch!;
  }

  // Normalize the book name
  book = book.toLowerCase().replace(/\s+/g, '');
  
  // Handle book abbreviations
  const fullBookName = Object.entries(bookAbbreviations).find(([abbr, ]) => {
    const normalizedAbbr = abbr.toLowerCase().replace(/\s+/g, '');
    return book === normalizedAbbr || book.startsWith(normalizedAbbr);
  })?.[1];

  if (fullBookName) {
    book = fullBookName;
  } else {
    // Capitalize first letter of each word
    book = book.replace(/\b\w/g, l => l.toUpperCase());
  }

  return {
    book,
    chapter: parseInt(chapter),
    verse: verse ? parseInt(verse) : undefined,
    endVerse: endVerse ? parseInt(endVerse) : undefined
  };
}

interface VerseResult {
  formattedReference: string;
  verses: BibleVerse[];
}

export async function getVersesFromDB(reference: string): Promise<VerseResult> {
  const { book, chapter, verse, endVerse } = parseReference(reference);
  
  let results: BibleVerse[];
  let formattedReference: string;

  // Get all verses from the chapter
  results = await db.verses
    .where('[book+chapter]')
    .equals([book, chapter])
    .toArray();

  if (results.length === 0) {
    return {
      formattedReference: `${book} ${chapter}`,
      verses: []
    };
  }

  const maxVerse = Math.max(...results.map(v => v.verse));

  if (verse === undefined) {
    // If no verse is specified, return all verses from the chapter
    formattedReference = `${book} ${chapter}:1-${maxVerse}`;
  } else {
    // If a verse is specified, filter the results
    const startVerse = Math.min(verse, maxVerse);
    const actualEndVerse = endVerse ? Math.min(endVerse, maxVerse) : startVerse;
    
    results = results.filter(v => v.verse >= startVerse && v.verse <= actualEndVerse);
    
    formattedReference = `${book} ${chapter}:${startVerse}`;
    if (actualEndVerse !== startVerse) {
      formattedReference += `-${actualEndVerse}`;
    }
  }

  // Ensure proper spacing in the formatted reference
  formattedReference = formattedReference.replace(/(\d)([A-Z])/g, '$1 $2');

  return {
    formattedReference,
    verses: results.map(verse => ({ ...verse, text: verse.text.trim() }))
  };
}

// Update getVerseFromDB to use the new parseReference function
export async function getVerseFromDB(reference: string): Promise<VerseResult> {
  const { book, chapter, verse } = parseReference(reference);
  
  if (verse === undefined) {
    // If no verse is specified, get the first verse of the chapter
    const result = await db.verses
      .where('[book+chapter+verse]')
      .equals([book, chapter, 1])
      .first();
    
    if (result) {
      return {
        formattedReference: `${book} ${chapter}:1`,
        verses: [{ ...result, text: result.text.trim() }]
      };
    }
  } else {
    // If a verse is specified, use the previous logic
    const result = await db.verses
      .where('[book+chapter+verse]')
      .equals([book, chapter, verse])
      .first();
    
    if (result) {
      return {
        formattedReference: `${book} ${chapter}:${verse}`,
        verses: [{ ...result, text: result.text.trim() }]
      };
    }
  }
  
  // If no verse is found, return an empty result
  return {
    formattedReference: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`,
    verses: []
  };
}