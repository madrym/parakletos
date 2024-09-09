import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  verseReference?: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [verseReference, setVerseReference] = useState("");

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: "",
      x: 20,
      y: 20,
      width: 200,
      height: 100,
    };
    setNotes([...notes, newNote]);
  };

  const updateNoteContent = (id: string, content: string) => {
    setNotes(
      notes.map((note) => (note.id === id ? { ...note, content } : note))
    );
  };

  const updateNotePosition = (id: string, x: number, y: number) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, x, y } : note)));
  };

  const updateNoteSize = (id: string, width: number, height: number) => {
    setNotes(
      notes.map((note) => (note.id === id ? { ...note, width, height } : note))
    );
  };

  const linkVerseToNote = () => {
    if (selectedNote) {
      setNotes(
        notes.map((note) =>
          note.id === selectedNote ? { ...note, verseReference } : note
        )
      );
      setSelectedNote(null);
      setVerseReference("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Bible Study Notes</h1>
      <Button onClick={addNote} className="mb-4">
        Add Note
      </Button>
      {notes.map((note) => (
        <Rnd
          key={note.id}
          size={{ width: note.width, height: note.height }}
          position={{ x: note.x, y: note.y }}
          onDragStop={(e, d) => updateNotePosition(note.id, d.x, d.y)}
          onResizeStop={(e, direction, ref, delta, position) => {
            updateNoteSize(note.id, ref.style.width, ref.style.height);
            updateNotePosition(note.id, position.x, position.y);
          }}
        >
          <div className="bg-white p-2 rounded shadow-md h-full flex flex-col">
            <textarea
              value={note.content}
              onChange={(e) => updateNoteContent(note.id, e.target.value)}
              className="flex-grow resize-none border-none focus:outline-none"
            />
            <div className="flex justify-between items-center mt-2">
              {note.verseReference && (
                <span className="text-xs text-gray-500">
                  {note.verseReference}
                </span>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedNote(note.id)}
                  >
                    Link Verse
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link Verse to Note</DialogTitle>
                  </DialogHeader>
                  <Input
                    value={verseReference}
                    onChange={(e) => setVerseReference(e.target.value)}
                    placeholder="Enter verse reference (e.g. John 3:16)"
                  />
                  <Button onClick={linkVerseToNote}>Link Verse</Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Rnd>
      ))}
    </div>
  );
}
