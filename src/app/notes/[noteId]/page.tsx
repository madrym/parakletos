'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from "../../../../convex/_generated/dataModel"
import { toast, Toaster } from 'react-hot-toast'
import { initialiseDB, getVersesFromDB } from '@/utils/initDB';
import nivData from '@/data/NIV.json';
import { NIVData } from '@/app/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { X, Share2, ChevronLeft, Plus } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { BibleAnnotation } from '@/components/BibleAnnotation'
import NoteTaking from '@/components/NoteTaking'
import { useConvexUser } from '@/context/UserContext'
import Link from 'next/link'

export default function NotePage({ params }: { params: { noteId: string } }) {
  const { convexUserId } = useConvexUser()
  const noteId = params.noteId as Id<"notes">

  // Queries
  const note = useQuery(api.notes.getNoteById, { noteId })
  const sections = useQuery(api.noteSections.getNoteSections, { noteId })
  const annotations = useQuery(api.noteSectionAnnotations.getNoteSectionAnnotationsByNoteId, { noteId })

  // Mutations
  const createSection = useMutation(api.noteSections.createNoteSection)
  const updateNote = useMutation(api.notes.updateNote)

  // Note states
  const [title, setTitle] = useState(note?.title || "")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bibleReferenceInput, setBibleReferenceInput] = useState("")
  const [createdAt, setCreatedAt] = useState(note?.createdAt || "")
  const [isNotesMode, setisNotesMode] = useState(false)

  // Topic states
  const [topics, setTopics] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState("")
  const [isTopicsDialogOpen, setIsTopicsDialogOpen] = useState(false)

  // Initialisation DB
  useEffect(() => {
    const now = new Date();
    setCreatedAt(now.toLocaleString());
    initialiseDB(nivData as NIVData[]).catch(error => {
      console.error('Error initializing database:', error);
      toast.error('Failed to initialize the Bible database. Please refresh the page.');
    });
  }, []);

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setCreatedAt(new Date(note._creationTime).toLocaleString())
      setTopics(note.topics || [])
    }
  }, [note])

  const handleAddBibleSection = async () => {
    if (!bibleReferenceInput) {
      toast.error("Please enter a Bible reference");
      return;
    }
    try {
      const verses = await getVersesFromDB(bibleReferenceInput);
      const content = verses.verses.map(({ book, chapter, text, verse }) => ({
        book,
        chapter,
        text,
        verse
      }));

      await createSection({
        noteId,
        bibleReference: bibleReferenceInput,
        content: content
      });

      setBibleReferenceInput("");
      setIsDialogOpen(false);
      toast.success("Bible section added successfully");
    } catch (error) {
      console.error("Error adding Bible section:", error);
      toast.error("Failed to add Bible section");
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()])
      setNewTopic("")
    }
  }

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove))
  }

  const handleSaveTopics = () => {
    updateNote({ noteId, topics })
    toast.success("Topics updated successfully")
    setIsTopicsDialogOpen(false)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setIsEditingTitle(true)
  }

  const handleTitleBlur = () => {
    updateNote({ noteId, title })
    setIsEditingTitle(false)
  }

  const handleToggleMode = () => {
    setisNotesMode(!isNotesMode)
  }

  return (
    <div className="min-h-screen bg-[#F8F3E8] p-4 relative z-0">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <button className="text-gray-600">
            <Link href="/my-notes">
              <ChevronLeft size={24} />
            </Link>
          </button>
          <button className="text-gray-600">
            <Share2 size={24} />
          </button>
        </header>

        <div className="mb-4 relative">
          <Input
            value={title}
            onChange={handleTitleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateNote({ noteId, title: title });
                e.currentTarget.blur();
              }
            }}
            onBlur={handleTitleBlur}
            placeholder="Note Title"
            className="text-2xl font-bold bg-transparent border-none w-full text-green-800 pr-20"
          />
          {isEditingTitle && (
            <Button
              onClick={() => {
                updateNote({ noteId, title: title });
                (document.activeElement as HTMLElement)?.blur();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              Update
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 font-semibold pl-4">Tags:</span>
            {topics.map((topic, index) => (
              <Badge key={index} variant="noteTag">{topic}</Badge>
            ))}
            <Dialog open={isTopicsDialogOpen} onOpenChange={setIsTopicsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0">
                  <Plus size={16} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Topics</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {topics.map(topic => (
                    <Badge key={topic} variant="noteTag" className="px-2 py-1">
                      {topic}
                      <button onClick={() => handleRemoveTopic(topic)} className="ml-2">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center">
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Add a topic"
                    className="mr-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTopic()
                      }
                    }}
                  />
                  <Button onClick={handleAddTopic} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <Button onClick={handleSaveTopics} className="mt-2">
                  Save Topics
                </Button>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-600">{createdAt}</p>
        </div>
        <div className="p-4 flex items-center justify-center mb-4">
          <span className={`text-sm font-semibold mr-4 ${!isNotesMode ? 'text-emerald-500 font-bold' : 'text-gray-700'}`}>Bible Mode</span>
          <Switch checked={isNotesMode} variant="biblenoteswitch" onCheckedChange={handleToggleMode} />
          <span className={`text-sm font-semibold ml-4 ${isNotesMode ? 'text-emerald-500 font-bold' : 'text-gray-700'}`}>Notes Mode</span>
        </div>
        <div className="border-t border-gray-700 my-4"></div>



        {!isNotesMode ? (
          <div className="p-4">
            <div className="p-4 flex justify-center">
              <Button onClick={() => setIsDialogOpen(true)}>Add Bible Section</Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bible Section</DialogTitle>
                  <DialogDescription>
                    Enter a Bible reference to create a new section.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={bibleReferenceInput}
                  onChange={(e) => setBibleReferenceInput(e.target.value)}
                  placeholder="Enter verse reference (e.g. John 3:16-20)"
                  className="mb-2"
                />
                <Button onClick={handleAddBibleSection}>Submit</Button>
              </DialogContent>
            </Dialog>
            {sections?.map((section) => (
              <BibleAnnotation
                key={section._id}
                noteId={noteId}
                section={section}
                annotations={annotations?.filter(a => a.sectionId === section._id) || []}
              />
            ))}
            <Collapsible className="mt-8">
              <CollapsibleTrigger className="w-full p-2 rounded-t-lg flex justify-center">
                <h3 className="text-lg font-semibold">All Annotations</h3>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2 bg-white rounded-b-lg border">
                {annotations && annotations.map((annotation) => (
                  <div key={annotation._id} className="mb-4 p-2 bg-gray-100 rounded">
                    <p className="font-semibold">{annotation.verses.join(', ')}</p>
                    <p className="text-sm mt-1">{annotation.content}</p>
                  </div>
                ))}
                {(!annotations || annotations.length === 0) && <p>No annotations yet</p>}
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          <NoteTaking
            noteId={noteId}
            userId={convexUserId as Id<"users">}
          />
        )}
      </div>
    </div>
  )
}
