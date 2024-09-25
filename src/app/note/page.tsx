'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Pencil, Highlighter, Palette, Copy, Link as LinkIcon, Bold, Italic, List, ListOrdered, IndentIcon, OutdentIcon, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { initialiseDB, getVerseFromDB, getVersesFromDB } from '@/utils/initDB';
import nivData from '@/data/NIV.json';
import { Toaster, toast } from 'react-hot-toast';
import { useEditor, EditorContent, BubbleMenu, Editor, EditorEvents } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import OrderedList from '@tiptap/extension-ordered-list';
import Link from '@tiptap/extension-link';

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
  id: string;
  verseNumbers: number[];
  text: string;
}

interface NIVData {
  book: string;
  chapters: {
    chapter: number;
    verses: {
      verse: number;
      text: string;
    }[];
  }[];
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
  const [isReferencing, setIsReferencing] = useState(false);
  const [referenceText, setReferenceText] = useState('');
  const [showVersePopover, setShowVersePopover] = useState(false);
  const [versePopoverContent, setVersePopoverContent] = useState('');
  const [versePopoverPosition, setVersePopoverPosition] = useState({ x: 0, y: 0 });
  const [isVersePopupOpen, setIsVersePopupOpen] = useState(false);
  const [popupVerseText, setPopupVerseText] = useState('');
  const [currentVerseReference, setCurrentVerseReference] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);

  const handleEditorUpdate = useCallback(async ({ editor }: { editor: Editor }) => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from - 30, to, ' ');
    const match = text.match(/(\w+\s?\d+:\d+(-\d+)?)\s?$/);
    const isNewLineOrSpace = editor.state.doc.textBetween(to - 1, to) === '\n' || editor.state.doc.textBetween(to - 1, to) === ' ';
    
    if (match && !isNewLineOrSpace) {
      const verseReference = match[1];
      try {
        const verseData = await getVersesFromDB(verseReference);
        if (verseData && verseData.verses.length > 0) {
          setVersePopoverContent(verseData.verses.map(v => `${v.verse}. ${v.text}`).join(' '));
          setCurrentVerseReference(verseReference);
          const { ranges } = editor.state.selection;
          if (ranges.length > 0) {
            const rect = editor.view.coordsAtPos(ranges[0].$to.pos);
            setVersePopoverPosition({ x: rect.left, y: rect.bottom });
          }
          setShowVersePopover(true);
        }
      } catch (error) {
        console.error('Error fetching verse:', error);
      }
    } else {
      setShowVersePopover(false);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      OrderedList,
    ],
    content: '',
    onUpdate: handleEditorUpdate,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowVersePopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    setCreatedAt(now.toLocaleString());
    initialiseDB(nivData as NIVData[]).catch(error => {
      console.error('Error initializing database:', error);
      toast.error('Failed to initialize the Bible database. Please refresh the page.');
    });
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
      if (!verseReference) {
        throw new Error("Verse reference is required");
      }

      const result = await getVersesFromDB(verseReference);

      if (result.verses.length === 0) {
        throw new Error("No verses found for the given reference");
      }

      const newSection: Section = {
        id: uuidv4(),
        title: result.formattedReference,
        verses: result.verses.map((verse) => ({
          id: `${result.formattedReference}-${verse.verse}`,
          number: verse.verse,
          text: verse.text,
        })),
        notes: [],
      };

      setSections((prevSections) => [...prevSections, newSection]);
      setVerseReference(""); // Clear the input after adding
      toast.success('Verse added successfully');
    } catch (err) {
      console.error("Error fetching passage:", err);
      toast.error(err instanceof Error ? err.message : 'Failed to add verse');
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
                  { id: uuidv4(), verseNumbers: sortedVerses, text: currentNote },
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

  const handleReferenceVerse = async () => {
    if (referenceText && currentSectionId) {
      try {
        const verseData = await getVerseFromDB(referenceText);
        if (verseData && verseData.verses.length > 0) {
          const referenceNote = `Reference: ${verseData.formattedReference} - ${verseData.verses[0].text}`;
          
          setSections((prevSections) =>
            prevSections.map((section) =>
              section.id === currentSectionId
                ? {
                    ...section,
                    notes: [
                      ...section.notes,
                      { id: uuidv4(), verseNumbers: selectedVerses.map(sv => sv.verseNumber), text: referenceNote },
                    ],
                  }
                : section
            )
          );
          
          setReferenceText('');
          setIsReferencing(false);
          setSelectedVerses([]);
          setCurrentSectionId(null);
          toast.success('Verse referenced successfully');
        } else {
          throw new Error("Verse not found");
        }
      } catch (error) {
        console.error("Error referencing verse:", error);
        toast.error(error instanceof Error ? error.message : 'Failed to reference verse');
      }
    }
  };

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

  const handleEditorKeyDown = async (event: React.KeyboardEvent) => {
    if (event.key === ' ' && editor) {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from - 20, to, ' ');
      const match = text.match(/(\w+\s\d+:\d+(-\d+)?)\s$/);
      
      if (match) {
        const verseReference = match[1];
        try {
          const verseData = await getVersesFromDB(verseReference);
          if (verseData && verseData.verses.length > 0) {
            setVersePopoverContent(verseData.verses.map(v => `${v.verse}. ${v.text}`).join(' '));
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              setVersePopoverPosition({ x: rect.left, y: rect.bottom });
            }
            setShowVersePopover(true);
          }
        } catch (error) {
          console.error('Error fetching verse:', error);
        }
      } else {
        setShowVersePopover(false);
      }
    }
  };
  
  const insertVerse = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (editor && versePopoverContent) {
      try {
        const verseData = await getVersesFromDB(currentVerseReference);
        if (verseData && verseData.verses.length > 0) {
          const verseText = verseData.verses.map(v => `${v.verse}. ${v.text}`).join(' ');
          editor.chain()
            .focus()
            .insertContent('<br>')  // Insert a line break
            .insertContent(verseText)  // Insert the verse text
            .insertContent('<br>')  // Insert another line break
            .run();
          setShowVersePopover(false);
          toast.success('Verse inserted successfully');
        }
      } catch (error) {
        console.error('Error fetching verse:', error);
        toast.error('Failed to insert verse. Please try again.');
      }
    }
  };

  const closeVersePopup = () => {
    setIsVersePopupOpen(false);
    setPopupVerseText('');
  };
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-emerald-50 p-4 relative">
        <Toaster position="top-right" />
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
            <div className="flex justify-between items-center">
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
                    <DialogDescription>
                      Add a verse from the Bible to your note.
                    </DialogDescription>
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
        </div>

        <Tabs defaultValue="bible-passage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bible-passage">Bible Passage</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="bible-passage">
            <div ref={containerRef} className="relative w-full h-[calc(100vh-300px)] overflow-auto">
              <div className="max-w-4xl mx-auto p-4 font-serif relative mt-8">

          <div ref={containerRef} className="relative w-full h-[calc(100vh-200px)] overflow-auto">
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
                            key={`note-icon-${section.id}-${verse.id}`}
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
                                  {notes.map((note) => (
                                    <div
                                      key={`note-${note.id}`}
                                      className="mb-2 last:mb-0"
                                    >
                                      <p className="font-sans text-sm">
                                        <span className="font-bold">
                                          Verses {note.verseNumbers.join(", ")}:
                                        </span>{" "}
                                        {note.text}
                                      </p>
                                      <hr className="my-2" />
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
                          <React.Fragment key={`verse-${section.id}-${verse.id}`}>
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
                    <DialogDescription>
                      Add a note to the selected verses.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="Enter your note here..."
                    className="w-full mb-2 bg-white"
                    aria-label="Note Text"
                    rows={4}
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
                        key={`highlight-color-${index}`}
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
              <Dialog open={isReferencing} onOpenChange={setIsReferencing}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsReferencing(true)}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reference Verse</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Reference Verse for Verses{" "}
                      {selectedVerses
                        .filter((sv) => sv.sectionId === currentSectionId)
                        .map((sv) => sv.verseNumber)
                        .sort((a, b) => a - b)
                        .join(", ")}
                    </DialogTitle>
                  </DialogHeader>
                  <Input
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    placeholder="Enter verse reference (e.g. John 3:16)"
                    className="w-full mb-2"
                    aria-label="Verse Reference"
                  />
                  <Button onClick={handleReferenceVerse} disabled={!referenceText.trim()}>
                    Add Reference
                  </Button>
                </DialogContent>
              </Dialog>
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
        </TabsContent>
        <TabsContent value="notes">
            <div className="relative w-full h-[calc(100vh-300px)] overflow-auto">
              <div className="max-w-4xl mx-auto p-4 font-serif relative mt-8">
                {editor && (
                  <BubbleMenu className="bubble-menu bg-white shadow-lg rounded-lg p-2 flex space-x-2" tippyOptions={{ duration: 100 }} editor={editor}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={editor.isActive('bold') ? 'bg-gray-200' : ''}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={editor.isActive('italic') ? 'bg-gray-200' : ''}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
                    >
                      <IndentIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().liftListItem('listItem').run()}
                    >
                      <OutdentIcon className="h-4 w-4" />
                    </Button>
                  </BubbleMenu>
                )}
                <EditorContent editor={editor} onKeyDown={handleEditorKeyDown} className="bg-white p-4 rounded-lg shadow-sm min-h-[200px]" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {showVersePopover && (
          <div
            ref={popoverRef}
            className="absolute bg-white shadow-lg rounded-lg p-2 z-50"
            style={{
              left: `${versePopoverPosition.x}px`,
              top: `${versePopoverPosition.y}px`,
            }}
          >
            <p>{versePopoverContent}</p>
            <div className="mt-2 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={insertVerse}
              >
                Insert
              </Button>
            </div>
          </div>
        )}

        {isVersePopupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Verse Reference</h3>
                <Button variant="ghost" size="sm" onClick={closeVersePopup}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p>{popupVerseText}</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}