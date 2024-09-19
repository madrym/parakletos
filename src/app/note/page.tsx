"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { v4 as uuidv4 } from "uuid";

interface Verse {
  id: string;
  number: number;
  text: string;
  highlight?: string;
}

interface Section {
  id: string;
  title: string;
  verses: Verse[];
  notes: BibleNote[];
}

interface SelectedVerse {
  sectionId: string;
  verseNumber: number;
}

interface BibleNote {
  verseNumbers: number[];
  text: string;
}

interface BiblePassage {
  bookName: string;
  chapter: number;
  esvResponse: ESVResponse;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState(highlightColors[0]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

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
    try {
      const response = await fetch(
        `/api/getPassage?reference=${encodeURIComponent(verseReference)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: BiblePassage = await response.json();

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      const passageText = data.esvResponse.passages[0];
      const verseRegex = /\[(\d+)\]\s*([^[]+)/g;
      const cleanedVerses = [];
      let match;

      while ((match = verseRegex.exec(passageText)) !== null) {
        cleanedVerses.push({
          number: parseInt(match[1], 10),
          text: match[2].trim(),
        });
      }

      const newSection: Section = {
        id: uuidv4(),
        title: data.esvResponse.canonical,
        verses: cleanedVerses.map((verse) => ({
          id: uuidv4(),
          number: verse.number,
          text: verse.text,
        })),
        notes: [],
      };

      setSections((prevSections) => [...prevSections, newSection]);
    } catch (err) {
      console.error("Error fetching passage:", err);
    }
  };

  const toggleVerseSelection = useCallback(
    (verseNumber: number, sectionId: string) => {
      setSelectedVerses((prev) => {
        const isSelected = prev.some(
          (v) => v.sectionId === sectionId && v.verseNumber === verseNumber
        );
        if (isSelected) {
          return prev.filter(
            (v) => !(v.sectionId === sectionId && v.verseNumber === verseNumber)
          );
        } else {
          return [...prev, { sectionId, verseNumber }];
        }
      });
      setCurrentSectionId(sectionId);
    },
    []
  );

  const toggleHighlight = useCallback(() => {
    const anyHighlighted = sections.some((section) =>
      section.verses.some(
        (verse) =>
          selectedVerses.some(
            (sv) =>
              sv.sectionId === section.id && sv.verseNumber === verse.number
          ) && verse.highlight
      )
    );

    setSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        verses: section.verses.map((verse) => {
          if (
            selectedVerses.some(
              (sv) =>
                sv.sectionId === section.id && sv.verseNumber === verse.number
            )
          ) {
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
  }, [sections, selectedVerses, currentColor]);

  const addBibleNote = useCallback(() => {
    if (currentNote.trim() && selectedVerses.length > 0 && currentSectionId) {
      const sortedVerses = [...selectedVerses]
        .filter((sv) => sv.sectionId === currentSectionId)
        .map((sv) => sv.verseNumber)
        .sort((a, b) => a - b);

      setSections((prevSections) =>
        prevSections.map((section) =>
          section.id === currentSectionId
            ? {
                ...section,
                notes: [
                  ...section.notes,
                  { verseNumbers: sortedVerses, text: currentNote },
                ],
              }
            : section
        )
      );
      setCurrentNote("");
      setSelectedVerses([]);
      setIsAddingNote(false);
      setCurrentSectionId(null);
    }
  }, [currentNote, selectedVerses, currentSectionId]);

  const getNotesForVerse = useCallback(
    (verseNumber: number, sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      return section
        ? section.notes.filter((note) =>
            note.verseNumbers.includes(verseNumber)
          )
        : [];
    },
    [sections]
  );

  const copySelectedVerses = useCallback(() => {
    const textToCopy = sections
      .flatMap((section) =>
        section.verses
          .filter((verse) =>
            selectedVerses.some(
              (sv) =>
                sv.sectionId === section.id && sv.verseNumber === verse.number
            )
          )
          .map((verse) => `${section.title} ${verse.number}. ${verse.text}`)
      )
      .join("\n");
    navigator.clipboard.writeText(textToCopy);
    setSelectedVerses([]);
  }, [sections, selectedVerses]);

  const isAnySelectedVerseHighlighted = useCallback(() => {
    return sections.some((section) =>
      section.verses.some(
        (verse) =>
          selectedVerses.some(
            (sv) =>
              sv.sectionId === section.id && sv.verseNumber === verse.number
          ) && verse.highlight
      )
    );
  }, [sections, selectedVerses]);

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
            {sections.map((section) => (
              <div key={section.id} className="mb-6">
                <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                <div className="flex">
                  <div className="w-8 flex-shrink-0">
                    {section.verses.map((verse) => {
                      const notes = getNotesForVerse(verse.number, section.id);
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
                                  aria-label={`Show notes for verse ${verse.number}`}
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
                        <React.Fragment key={`${section.id}-${verse.number}`}>
                          <sup
                            className={`text-xs mr-1 font-sans cursor-pointer ${
                              selectedVerses.some(
                                (sv) =>
                                  sv.sectionId === section.id &&
                                  sv.verseNumber === verse.number
                              )
                                ? "bg-gray-200"
                                : "text-gray-500"
                            }`}
                            onClick={() =>
                              toggleVerseSelection(verse.number, section.id)
                            }
                          >
                            {verse.number}
                          </sup>
                          <span
                            className={`${verse.highlight || ""} ${
                              selectedVerses.some(
                                (sv) =>
                                  sv.sectionId === section.id &&
                                  sv.verseNumber === verse.number
                              )
                                ? "underline decoration-2 decoration-gray-500"
                                : ""
                            } cursor-pointer`}
                            onClick={() =>
                              toggleVerseSelection(verse.number, section.id)
                            }
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
                    Add Note for Verses{" "}
                    {selectedVerses
                      .filter((sv) => sv.sectionId === currentSectionId)
                      .map((sv) => sv.verseNumber)
                      .sort((a, b) => a - b)
                      .join(", ")}
                  </DialogTitle>
                </DialogHeader>
                <Textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Enter your note here..."
                  className="w-full mb-2"
                  aria-label="Note Text"
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
                  aria-label="Toggle Highlight"
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className={currentColor}
                      aria-label="Select Highlight Color"
                    >
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
                      aria-label={`Select ${color} highlight`}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySelectedVerses}
                  aria-label="Copy Selected Verses"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Bible Notes:</h3>
          {sections.map((section) => (
            <div key={section.id}>
              <h4 className="text-md font-semibold mb-2">{section.title}</h4>
              {section.notes.map((note, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded mb-2">
                  <p className="font-bold">
                    Verses: {note.verseNumbers.join(", ")}
                  </p>
                  <p>{note.text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
