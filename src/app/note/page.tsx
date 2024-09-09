"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

export default function NotePage() {
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [verseReference, setVerseReference] = useState("");
  const [verseContent, setVerseContent] = useState("");
  const [activeTab, setActiveTab] = useState("notes");

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
    content: "",
    onUpdate: ({ editor }) => {
      // You can save the content here if needed
      console.log(editor.getHTML());
    },
  });

  useEffect(() => {
    const now = new Date();
    setCreatedAt(now.toLocaleString());
  }, []);

  const handleAddVerse = async () => {
    setVerseContent(`Content for ${verseReference}`);
  };

  const handleLinkVerse = useCallback(() => {
    if (editor) {
      if (editor.isActive("link")) {
        editor.chain().focus().unsetLink().run();
      } else {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, "");

        if (text) {
          editor.chain().focus().setLink({ href: verseReference }).run();
        } else {
          // If no text is selected, insert the verse reference as a link
          editor
            .chain()
            .focus()
            .insertContent(`<a href="${verseReference}">${verseReference}</a>`)
            .run();
        }
      }
    }
  }, [editor, verseReference]);

  if (!editor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-emerald-50 p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 bg-emerald-100 text-black">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="text-2xl font-bold mb-2 bg-transparent border-none text-black placeholder-emerald-200"
          />
          <p className="text-sm text-emerald-700 mb-4 ml-1">{createdAt}</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-white text-emerald-600 hover:bg-emerald-200"
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-emerald-100">
            <TabsTrigger
              value="notes"
              className="w-1/2 data-[state=active]:bg-white data-[state=active]:text-emerald-700"
            >
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="verse"
              className="w-1/2 data-[state=active]:bg-white data-[state=active]:text-emerald-700"
            >
              Verse
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="p-4">
            <div className="border border-emerald-200 rounded-md p-2 mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <Button
                  size="sm"
                  variant={editor.isActive("bold") ? "secondary" : "outline"}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={editor.isActive("italic") ? "secondary" : "outline"}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={
                    editor.isActive("bulletList") ? "secondary" : "outline"
                  }
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={
                    editor.isActive("orderedList") ? "secondary" : "outline"
                  }
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={editor.isActive("link") ? "secondary" : "outline"}
                  onClick={handleLinkVerse}
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={
                    editor.isActive("blockquote") ? "secondary" : "outline"
                  }
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
                >
                  <Quote className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    editor.chain().focus().setHorizontalRule().run()
                  }
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100"
                >
                  <SeparatorHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              <EditorContent
                editor={editor}
                className="min-h-[200px] prose max-w-none tiptap"
              />
            </div>
          </TabsContent>
          <TabsContent value="verse" className="p-4">
            <p className="font-bold text-emerald-800">{verseReference}</p>
            <p className="text-emerald-600">{verseContent}</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
