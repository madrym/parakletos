interface Book {
    id: number;
    name: string;
    testament: string;
  }
  
  const booksData: Book[] = [
    { id: 1, name: "Genesis", testament: "OT" },
    { id: 2, name: "Exodus", testament: "OT" },
    { id: 3, name: "Leviticus", testament: "OT" },
    { id: 4, name: "Numbers", testament: "OT" },
    { id: 5, name: "Deuteronomy", testament: "OT" },
    { id: 6, name: "Joshua", testament: "OT" },
    { id: 7, name: "Judges", testament: "OT" },
    { id: 8, name: "Ruth", testament: "OT" },
    { id: 9, name: "1 Samuel", testament: "OT" },
    { id: 10, name: "2 Samuel", testament: "OT" },
    { id: 11, name: "1 Kings", testament: "OT" },
    { id: 12, name: "2 Kings", testament: "OT" },
    { id: 13, name: "1 Chronicles", testament: "OT" },
    { id: 14, name: "2 Chronicles", testament: "OT" },
    { id: 15, name: "Ezra", testament: "OT" },
    { id: 16, name: "Nehemiah", testament: "OT" },
    { id: 17, name: "Esther", testament: "OT" },
    { id: 18, name: "Job", testament: "OT" },
    { id: 19, name: "Psalms", testament: "OT" },
    { id: 20, name: "Proverbs", testament: "OT" },
    { id: 21, name: "Ecclesiastes", testament: "OT" },
    { id: 22, name: "Song of Solomon", testament: "OT" },
    { id: 23, name: "Isaiah", testament: "OT" },
    { id: 24, name: "Jeremiah", testament: "OT" },
    { id: 25, name: "Lamentations", testament: "OT" },
    { id: 26, name: "Ezekiel", testament: "OT" },
    { id: 27, name: "Daniel", testament: "OT" },
    { id: 28, name: "Hosea", testament: "OT" },
    { id: 29, name: "Joel", testament: "OT" },
    { id: 30, name: "Amos", testament: "OT" },
    { id: 31, name: "Obadiah", testament: "OT" },
    { id: 32, name: "Jonah", testament: "OT" },
    { id: 33, name: "Micah", testament: "OT" },
    { id: 34, name: "Nahum", testament: "OT" },
    { id: 35, name: "Habakkuk", testament: "OT" },
    { id: 36, name: "Zephaniah", testament: "OT" },
    { id: 37, name: "Haggai", testament: "OT" },
    { id: 38, name: "Zechariah", testament: "OT" },
    { id: 39, name: "Malachi", testament: "OT" },
    { id: 40, name: "Matthew", testament: "NT" },
    { id: 41, name: "Mark", testament: "NT" },
    { id: 42, name: "Luke", testament: "NT" },
    { id: 43, name: "John", testament: "NT" },
    { id: 44, name: "Acts", testament: "NT" },
    { id: 45, name: "Romans", testament: "NT" },
    { id: 46, name: "1 Corinthians", testament: "NT" },
    { id: 47, name: "2 Corinthians", testament: "NT" },
    { id: 48, name: "Galatians", testament: "NT" },
    { id: 49, name: "Ephesians", testament: "NT" },
    { id: 50, name: "Philippians", testament: "NT" },
    { id: 51, name: "Colossians", testament: "NT" },
    { id: 52, name: "1 Thessalonians", testament: "NT" },
    { id: 53, name: "2 Thessalonians", testament: "NT" },
    { id: 54, name: "1 Timothy", testament: "NT" },
    { id: 55, name: "2 Timothy", testament: "NT" },
    { id: 56, name: "Titus", testament: "NT" },
    { id: 57, name: "Philemon", testament: "NT" },
    { id: 58, name: "Hebrews", testament: "NT" },
    { id: 59, name: "James", testament: "NT" },
    { id: 60, name: "1 Peter", testament: "NT" },
    { id: 61, name: "2 Peter", testament: "NT" },
    { id: 62, name: "1 John", testament: "NT" },
    { id: 63, name: "2 John", testament: "NT" },
    { id: 64, name: "3 John", testament: "NT" },
    { id: 65, name: "Jude", testament: "NT" },
    { id: 66, name: "Revelation", testament: "NT" }
  ];
  
  const bookAbbreviations: { [key: string]: string[] } = {
    "Genesis": ["Gen", "Ge", "Gn"],
    "Exodus": ["Exod", "Ex", "Exo"],
    "Leviticus": ["Lev", "Le", "Lv"],
    "Numbers": ["Num", "Nu", "Nm", "Nb"],
    "Deuteronomy": ["Deut", "De", "Dt"],
    "Joshua": ["Josh", "Jos", "Jsh"],
    "Judges": ["Judg", "Jdg", "Jg", "Jdgs"],
    "Ruth": ["Rth", "Ru"],
    "1 Samuel": ["1 Sam", "1Sa", "1S"],
    "2 Samuel": ["2 Sam", "2Sa", "2S"],
    "1 Kings": ["1 Kgs", "1Ki", "1K"],
    "2 Kings": ["2 Kgs", "2Ki", "2K"],
    "1 Chronicles": ["1 Chr", "1Ch", "1Chron"],
    "2 Chronicles": ["2 Chr", "2Ch", "2Chron"],
    "Ezra": ["Ezr"],
    "Nehemiah": ["Neh", "Ne"],
    "Esther": ["Esth", "Es"],
    "Job": ["Job", "Jb"],
    "Psalms": ["Ps", "Psalm", "Psa", "Psm", "Pss"],
    "Proverbs": ["Prov", "Pr", "Prv"],
    "Ecclesiastes": ["Eccles", "Ecc", "Ec"],
    "Song of Solomon": ["Song", "SS", "So", "Canticles", "Song of Songs"],
    "Isaiah": ["Isa", "Is"],
    "Jeremiah": ["Jer", "Je", "Jr"],
    "Lamentations": ["Lam", "La"],
    "Ezekiel": ["Ezek", "Eze", "Ezk"],
    "Daniel": ["Dan", "Da", "Dn"],
    "Hosea": ["Hos", "Ho"],
    "Joel": ["Joel", "Jl"],
    "Amos": ["Amos", "Am"],
    "Obadiah": ["Obad", "Ob"],
    "Jonah": ["Jonah", "Jon", "Jnh"],
    "Micah": ["Mic", "Mc"],
    "Nahum": ["Nah", "Na"],
    "Habakkuk": ["Hab", "Hb"],
    "Zephaniah": ["Zeph", "Zep", "Zp"],
    "Haggai": ["Hag", "Hg"],
    "Zechariah": ["Zech", "Zec", "Zc"],
    "Malachi": ["Mal", "Ml"],
    "Matthew": ["Matt", "Mt"],
    "Mark": ["Mark", "Mrk", "Mk", "Mr"],
    "Luke": ["Luke", "Luk", "Lk"],
    "John": ["John", "Jn", "Jhn"],
    "Acts": ["Acts", "Ac"],
    "Romans": ["Rom", "Ro", "Rm"],
    "1 Corinthians": ["1 Cor", "1Co", "1C"],
    "2 Corinthians": ["2 Cor", "2Co", "2C"],
    "Galatians": ["Gal", "Ga"],
    "Ephesians": ["Eph", "Ephes"],
    "Philippians": ["Phil", "Php", "Pp"],
    "Colossians": ["Col", "Co"],
    "1 Thessalonians": ["1 Thess", "1Th", "1Ts"],
    "2 Thessalonians": ["2 Thess", "2Th", "2Ts"],
    "1 Timothy": ["1 Tim", "1Ti", "1Tm"],
    "2 Timothy": ["2 Tim", "2Ti", "2Tm"],
    "Titus": ["Tit", "Ti"],
    "Philemon": ["Phlm", "Phm"],
    "Hebrews": ["Heb"],
    "James": ["Jas", "Jm"],
    "1 Peter": ["1 Pet", "1Pe", "1Pt", "1P"],
    "2 Peter": ["2 Pet", "2Pe", "2Pt", "2P"],
    "1 John": ["1 John", "1Jn", "1J"],
    "2 John": ["2 John", "2Jn", "2J"],
    "3 John": ["3 John", "3Jn", "3J"],
    "Jude": ["Jude", "Jud"],
    "Revelation": ["Rev", "Re", "The Revelation"]
  };
  
  const bookIdMapping: { [key: string]: number } = {};
  
  booksData.forEach((book) => {
    const bookNameKey = book.name.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
    bookIdMapping[bookNameKey] = book.id;
  
    const abbreviations = bookAbbreviations[book.name];
    if (abbreviations) {
      abbreviations.forEach((abbrev) => {
        const abbrevKey = abbrev.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
        bookIdMapping[abbrevKey] = book.id;
      });
    }
  });
  
  function getBookId(bookNameOrAbbrev: string): number | null {
    const key = bookNameOrAbbrev
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')         // Remove all whitespace
      .replace(/[^\w]/g, '');      // Remove non-alphanumeric characters
    const bookId = bookIdMapping[key];
    if (bookId !== undefined) {
      return bookId !== undefined ? bookId : null;
    } else {
      throw new Error(`Book name or abbreviation "${bookNameOrAbbrev}" not found.`);
    }
  }
  
  export { getBookId, bookIdMapping };