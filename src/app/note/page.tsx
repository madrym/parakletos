"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
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
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  SeparatorHorizontal,
  Undo,
  Redo,
  X,
  Move,
} from "lucide-react";

interface Note {
  id: number;
  content: string;
  position: { x: number; y: number };
}

function NoteEditor({
  note,
  onUpdate,
  onSelect,
}: {
  note: Note;
  onUpdate: (content: string) => void;
  onSelect: (editor: Editor) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-emerald-600 underline",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your note here...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content);
    }
  }, [editor, note.content]);

  return (
    <EditorContent
      editor={editor}
      onClick={() => editor && onSelect(editor)}
      className="min-w-[200px] min-h-[100px] prose max-w-none tiptap"
    />
  );
}

export default function NotePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [verseReference, setVerseReference] = useState("");
  const [verseContent, setVerseContent] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);

  useEffect(() => {
    const now = new Date();
    setCreatedAt(now.toLocaleString());
  }, []);

  const handleAddNote = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current || e.detail !== 2) return; // Check for double-click

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newId =
      notes.length > 0 ? Math.max(...notes.map((note) => note.id)) + 1 : 1;
    const newNote: Note = {
      id: newId,
      content: "",
      position: { x: clickX, y: clickY },
    };
    setNotes([...notes, newNote]);
    setSelectedNoteId(newId);
  };

  const handleAddVerse = async () => {
    setVerseContent(`Content for ${verseReference}`);
  };

  const handleLinkVerse = useCallback(() => {
    if (selectedNoteId !== null && activeEditor) {
      activeEditor.chain().focus().setLink({ href: verseReference }).run();
    }
  }, [selectedNoteId, activeEditor, verseReference]);

  const handleDragStart = (
    id: number,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.preventDefault();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    setSelectedNoteId(id);

    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const initialX = note.position.x;
    const initialY = note.position.y;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientX
          : moveEvent.clientX;
      const clientY =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientY
          : moveEvent.clientY;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      const updatedNotes = notes.map((n) =>
        n.id === id
          ? { ...n, position: { x: initialX + deltaX, y: initialY + deltaY } }
          : n
      );
      setNotes(updatedNotes);
    };

    const handleEnd = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchend", handleEnd);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);
  };

  const handleNoteSelect = (id: number, editor: Editor) => {
    setSelectedNoteId(id);
    setActiveEditor(editor);
  };

  const handleDeleteNote = (id: number) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
      setActiveEditor(null);
    }
  };

  const handleNoteUpdate = (id: number, content: string) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, content } : note
    );
    setNotes(updatedNotes);
  };

  const applyFormat = (action: string) => {
    if (activeEditor) {
      activeEditor.chain().focus();
      switch (action) {
        case "bold":
          activeEditor.chain().toggleBold().run();
          break;
        case "italic":
          activeEditor.chain().toggleItalic().run();
          break;
        case "bulletList":
          activeEditor.chain().toggleBulletList().run();
          break;
        case "orderedList":
          activeEditor.chain().toggleOrderedList().run();
          break;
        case "blockquote":
          activeEditor.chain().toggleBlockquote().run();
          break;
        case "horizontalRule":
          activeEditor.chain().setHorizontalRule().run();
          break;
        case "undo":
          activeEditor.chain().undo().run();
          break;
        case "redo":
          activeEditor.chain().redo().run();
          break;
      }
    }
  };

  return (
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
        className="relative w-full h-[calc(100vh-200px)] overflow-auto touch-none"
        onClick={handleAddNote}
      >
        {notes.map((note) => (
          <div
            key={note.id}
            className={`absolute p-4 bg-white border-2 border-emerald-200 rounded-lg shadow-md ${
              selectedNoteId === note.id ? "border-emerald-500" : ""
            }`}
            style={{
              left: note.position.x,
              top: note.position.y,
              width: "80%",
              maxWidth: "300px",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-8 bg-emerald-100 cursor-move flex items-center justify-center"
              onMouseDown={(e) => handleDragStart(note.id, e)}
              onTouchStart={(e) => handleDragStart(note.id, e)}
            >
              <Move className="h-4 w-4 text-emerald-600" />
            </div>
            <div
              className="relative z-10 mt-8"
              onClick={(e) => e.stopPropagation()}
            >
              <NoteEditor
                note={note}
                onUpdate={(content) => handleNoteUpdate(note.id, content)}
                onSelect={(editor) => handleNoteSelect(note.id, editor)}
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-transparent z-20"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNote(note.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {selectedNoteId !== null && (
        <div className="fixed bottom-4 left-0 right-0 bg-white shadow-lg rounded-lg p-2 flex gap-2 overflow-x-auto mx-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormat("bold")}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormat("italic")}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormat("bulletList")}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormat("orderedList")}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleLinkVerse}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormat("blockquote")}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormat("horizontalRule")}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <SeparatorHorizontal className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormat("undo")}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormat("redo")}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}

      {verseContent && (
        <div className="mt-4 p-4 bg-white shadow-lg rounded-lg">
          <p className="font-bold text-emerald-800">{verseReference}</p>
          <p className="text-emerald-600">{verseContent}</p>
        </div>
      )}
    </div>
  );
}
