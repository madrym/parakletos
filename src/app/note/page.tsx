"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Pencil, Highlighter, Palette, Copy } from "lucide-react";

interface Verse {
  number: number;
  text: string;
  highlight?: string;
}

interface Section {
  title: string;
  verses: Verse[];
}

interface BibleNote {
  verseNumbers: number[];
  text: string;
}

const biblePassage: Section[] = [
  {
    title: "Jesus Comforts His Disciples",
    verses: [
      {
        number: 1,
        text: "Do not let your hearts be troubled. You believe in God; believe also in me.",
      },
      {
        number: 2,
        text: "My Father's house has many rooms; if that were not so, would I have told you that I am going there to prepare a place for you?",
      },
      {
        number: 3,
        text: "And if I go and prepare a place for you, I will come back and take you to be with me that you also may be where I am.",
      },
      { number: 4, text: "You know the way to the place where I am going." },
    ],
  },
  {
    title: "Jesus the Way to the Father",
    verses: [
      {
        number: 5,
        text: 'Thomas said to him, "Lord, we don\'t know where you are going, so how can we know the way?"',
      },
      {
        number: 6,
        text: 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me.',
      },
      {
        number: 7,
        text: 'If you really know me, you will know my Father as well. From now on, you do know him and have seen him."',
      },
    ],
  },
];

const highlightColors = [
  "bg-yellow-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-red-200",
  "bg-purple-200",
  "bg-pink-200",
  "bg-orange-200",
  "bg-teal-200",
];

export default function NotePage() {
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [verseReference, setVerseReference] = useState("");
  const [verseContent, setVerseContent] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState(biblePassage);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [bibleNotes, setBibleNotes] = useState<BibleNote[]>([]);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState(highlightColors[0]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [currentNote, setCurrentNote] = useState("");

  useEffect(() => {
    const now = new Date();
    setCreatedAt(now.toLocaleString());
  }, []);

  useEffect(() => {
    if (selectedVerses.length > 0) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (containerRect) {
          let x = rect.left - containerRect.left;
          let y = rect.bottom - containerRect.top + window.scrollY;

          const maxX = containerRect.width - 200;
          x = Math.min(x, maxX);

          const maxY = containerRect.height - 50;
          y = Math.min(y, maxY);

          setToolbarPosition({ x, y });
        }
      }
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }, [selectedVerses]);

  const handleAddVerse = async () => {
    setVerseContent(`Content for ${verseReference}`);
  };

  const toggleVerseSelection = (verseNumber: number) => {
    setSelectedVerses((prev) =>
      prev.includes(verseNumber)
        ? prev.filter((v) => v !== verseNumber)
        : [...prev, verseNumber]
    );
  };

  const toggleHighlight = () => {
    const anyHighlighted = sections.some((section) =>
      section.verses.some(
        (verse) => selectedVerses.includes(verse.number) && verse.highlight
      )
    );

    setSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        verses: section.verses.map((verse) => {
          if (selectedVerses.includes(verse.number)) {
            return {
              ...verse,
              highlight: anyHighlighted ? undefined : currentColor,
            };
          }
          return verse;
        }),
      }))
    );
    setSelectedVerses([]);
  };

  const addBibleNote = () => {
    if (currentNote.trim() && selectedVerses.length > 0) {
      const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
      setBibleNotes(prev => [...prev, { verseNumbers: sortedVerses, text: currentNote }]);
      setCurrentNote('');
      setSelectedVerses([]);
      setIsAddingNote(false);
    }
  };

  const getNotesForVerse = (verseNumber: number) => {
    return bibleNotes.filter((note) => note.verseNumbers[0] === verseNumber);
  };

  const copySelectedVerses = () => {
    const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
    const textToCopy = sections
      .flatMap(section => section.verses)
      .filter(verse => sortedVerses.includes(verse.number))
      .map(verse => `${verse.number}. ${verse.text}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setSelectedVerses([]);
  };

  const isAnySelectedVerseHighlighted = () => {
    return sections.some((section) =>
      section.verses.some(
        (verse) => selectedVerses.includes(verse.number) && verse.highlight
      )
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-emerald-50 p-4 relative">
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden mb-4">
          <div className="p-4 bg-emerald-100 text-black">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="text-xl md:text-2xl font-bold mb-2 bg-transparent border-none text-black placeholder-emerald-200"
            />
            <p className="text-xs md:text-sm text-emerald-700 mb-4 ml-1">
              {createdAt}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white text-emerald-600 hover:bg-emerald-200 text-sm md:text-base"
                >
                  Add Bible Verse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bible Verse</DialogTitle>
                </DialogHeader>
                <Input
                  value={verseReference}
                  onChange={(e) => setVerseReference(e.target.value)}
                  placeholder="Enter verse reference (e.g. John 3:16)"
                />
                <Button
                  onClick={handleAddVerse}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Add Verse
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative w-full h-[calc(100vh-200px)] overflow-auto"
        >
          <div className="max-w-4xl mx-auto p-4 font-serif relative mt-8">
            <h1 className="text-3xl font-bold text-center mb-8">JOHN 14</h1>
            {sections.map((section, index) => (
              <div key={index} className="mb-6">
                <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                <div className="flex">
                  <div className="w-8 flex-shrink-0">
                    {section.verses.map((verse) => {
                      const notes = getNotesForVerse(verse.number);
                      return (
                        <div
                          key={verse.number}
                          className="h-6 flex items-center justify-center"
                        >
                          {notes.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                >
                                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 max-h-60 overflow-y-auto">
                                {notes.map((note, noteIndex) => (
                                  <div
                                    key={noteIndex}
                                    className="mb-2 last:mb-0"
                                  >
                                    <p className="font-sans text-sm">
                                      <span className="font-bold">
                                        Verses {note.verseNumbers.join(", ")}:
                                      </span>{" "}
                                      {note.text}
                                    </p>
                                    {noteIndex < notes.length - 1 && (
                                      <hr className="my-2" />
                                    )}
                                  </div>
                                ))}
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex-grow">
                    <div className="text-justify leading-relaxed">
                      {section.verses.map((verse, vIndex) => (
                        <React.Fragment key={verse.number}>
                          <sup
                            className={`text-xs mr-1 font-sans cursor-pointer ${
                              selectedVerses.includes(verse.number)
                                ? "bg-gray-200"
                                : "text-gray-500"
                            }`}
                            onClick={() => toggleVerseSelection(verse.number)}
                          >
                            {verse.number}
                          </sup>
                          <span
                            className={`${verse.highlight || ""} ${
                              selectedVerses.includes(verse.number)
                                ? "underline decoration-2 decoration-gray-500"
                                : ""
                            } cursor-pointer`}
                            onClick={() => toggleVerseSelection(verse.number)}
                          >
                            {verse.text}
                          </span>
                          {vIndex < section.verses.length - 1 && " "}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showToolbar && (
          <div
            className="absolute bg-white shadow-lg rounded-lg p-2 flex space-x-2"
            style={{
              left: `${toolbarPosition.x}px`,
              top: `${toolbarPosition.y}px`,
            }}
          >
            <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingNote(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Note</TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                <DialogTitle>
                  Add Note for Verses {[...selectedVerses].sort((a, b) => a - b).join(', ')}
                </DialogTitle>
                </DialogHeader>
                <Textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Enter your note here..."
                  className="w-full mb-2"
                />
                <Button onClick={addBibleNote} disabled={!currentNote.trim()}>
                  Add Note
                </Button>
              </DialogContent>
            </Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleHighlight}
                  className={
                    isAnySelectedVerseHighlighted() ? "bg-gray-200" : ""
                  }
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAnySelectedVerseHighlighted()
                  ? "Remove Highlight"
                  : "Add Highlight"}
              </TooltipContent>
            </Tooltip>
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className={currentColor}>
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Select Color</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-40">
                <div className="grid grid-cols-4 gap-2">
                  {highlightColors.map((color, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className={`w-8 h-8 ${color}`}
                      onClick={() => setCurrentColor(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={copySelectedVerses}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
          </div>
        )}

        {verseContent && (
          <div className="mt-4 p-4 bg-white shadow-lg rounded-lg">
            <p className="font-bold text-emerald-800">{verseReference}</p>
            <p className="text-emerald-600">{verseContent}</p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Bible Notes:</h3>
          {bibleNotes.map((note, index) => (
            <div key={index} className="bg-gray-100 p-2 rounded mb-2">
              <p className="font-bold">
                Verses: {note.verseNumbers.join(", ")}
              </p>
              <p>{note.text}</p>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
