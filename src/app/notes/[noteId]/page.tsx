'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from "../../../../convex/_generated/dataModel"
import { toast, Toaster } from 'react-hot-toast'
import { initialiseDB, getVersesFromDB } from '@/utils/initDB';
import nivData from '@/data/NIV.json';
import { NIVData, BibleVerse } from '@/app/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PlusCircle, X, Lightbulb, Tag } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

export default function NotePage({ params }: { params: { noteId: string } }) {
  const noteId = params.noteId as Id<"notes">

  // Queries
  const note = useQuery(api.notes.getNoteById, { noteId })
  const sections = useQuery(api.noteSections.getNoteSections, { noteId })
  const annotations = useQuery(api.noteSectionAnnotations.getNoteSectionAnnotationsByNoteId, { noteId })

  // Mutations
  const createSection = useMutation(api.noteSections.createNoteSection)
  const createAnnotation = useMutation(api.noteSectionAnnotations.createNoteSectionAnnotation)
  const updateNote = useMutation(api.notes.updateNote)

  // Note states
  const [title, setTitle] = useState(note?.title || "")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bibleReferenceInput, setBibleReferenceInput] = useState("")
  const [createdAt, setCreatedAt] = useState(note?.createdAt || "")

  // Annotation states
  const [selectedVerses, setSelectedVerses] = useState<string[]>([])
  const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState("")
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null)

  // Add these new state variables
  const [topics, setTopics] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState("")
  const [isTopicsDialogOpen, setIsTopicsDialogOpen] = useState(false)

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

  const handleVerseClick = (verse: BibleVerse, event: React.MouseEvent) => {
    const verseReference = `${verse.book} ${verse.chapter}:${verse.verse}`
    
    setSelectedVerses(prev => {
      let updatedVerses;
      if (prev.includes(verseReference)) {
        updatedVerses = prev.filter(v => v !== verseReference)
      } else {
        updatedVerses = [...prev, verseReference]
      }
      return updatedVerses
    })

    // Update toolbar position
    const rect = event.currentTarget.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    setToolbarPosition({
      top: rect.top + scrollTop - 40, // 40px above the verse
      left: rect.left
    })
  }

  const handleAnnotationClick = () => {
    setIsAnnotationDialogOpen(true)
  }

  const handleAddAnnotation = async () => {
    if (newAnnotation.trim() === "") {
      toast.error("Please enter an annotation")
      return
    }
    try {
      await createAnnotation({
        noteId,
        sectionId: sections![0]._id, // Assuming the first section for simplicity
        content: newAnnotation,
        verses: Array.from(selectedVerses)
      })
      setNewAnnotation("")
      setSelectedVerses([])
      setIsAnnotationDialogOpen(false)
      toast.success("Annotation added successfully")
    } catch (error) {
      console.error("Error adding annotation:", error)
      toast.error("Failed to add annotation")
    }
  }

  const handleLightbulbClick = (annotationKey: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setActiveAnnotation(activeAnnotation === annotationKey ? null : annotationKey)
  }

  const organiseAnnotations = () => {
    if (!annotations || !sections) return {};

    return annotations.reduce((acc, annotation) => {
      annotation.verses.forEach(verseRef => {
        // Match the book name (including potential numbers), chapter, and verse
        const match = verseRef.match(/^(\d*\s*\w+)\s*(\d+)(?::(\d+))?$/);
        if (!match) {
          console.error("Invalid verse reference format:", verseRef);
          return;
        }
        const [, book, chapter, verse] = match;
        
        sections.forEach(section => {
          if (Array.isArray(section.content)) {
            section.content.forEach((verseContent: BibleVerse) => {
              if (verseContent.book === book.trim() && 
                  verseContent.chapter === parseInt(chapter) && 
                  (verse ? verseContent.verse === parseInt(verse) : true)) {
                const key = `${section._id}-${verseRef}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(annotation);
              }
            });
          }
        });
      });
      return acc;
    }, {} as Record<string, typeof annotations>);
  };

  // Add these new functions
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
  }

  const organisedAnnotations = organiseAnnotations();

  return (
    <div className="min-h-screen bg-emerald-50 p-4 relative z-0">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden mb-4">
        <div className="p-4 bg-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <div className="relative w-full mr-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateNote({ noteId, title: title });
                    e.currentTarget.blur();
                  }
                }}
                onFocus={() => setIsEditingTitle(true)}
                onBlur={() => {
                  updateNote({ noteId, title: title });
                  setIsEditingTitle(false);
                }}
                placeholder="Note Title"
                className="text-2xl font-bold bg-transparent border-none w-full pr-20"
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
            <Dialog open={isTopicsDialogOpen} onOpenChange={setIsTopicsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Topics
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Topics</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {topics.map(topic => (
                    <Badge key={topic} variant="secondary" className="px-2 py-1">
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
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <Button onClick={() => {
                  handleSaveTopics();
                  setIsTopicsDialogOpen(false);
                }} className="mt-2">
                  Save Topics
                </Button>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-600">Created: {createdAt}</p>
        </div>
        <div className="p-4">
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
        <div className="p-4">
          {sections?.map((section) => (
            <Collapsible key={section._id} className="mb-4">
              <CollapsibleTrigger className="w-full text-left p-2 bg-emerald-100 rounded-t-lg">
                <h3 className="text-lg font-semibold">{section.bibleReference}</h3>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2 bg-white rounded-b-lg border border-emerald-100">
                {Array.isArray(section.content) ? (
                  section.content.map((verse: BibleVerse, index: number) => {
                    const verseReference = `${verse.book} ${verse.chapter}:${verse.verse}`
                    const annotationKey = `${section._id}-${verseReference}`
                    const verseAnnotations = organisedAnnotations[annotationKey] || []
                    return (
                      <div key={index} className="mb-4 relative">
                        <div className="flex items-center">
                          {verseAnnotations.length > 0 && (
                            <button
                              onClick={(e) => handleLightbulbClick(annotationKey, e)}
                              className="p-2 hover:bg-gray-100 rounded-full mr-2"
                              title="View Annotations"
                            >
                              <Lightbulb className="h-5 w-5 text-yellow-500" />
                            </button>
                          )}
                          <button
                            className={`text-left mb-2 flex-grow hover:bg-gray-100 p-1 rounded ${
                              selectedVerses.includes(verseReference) ? 'bg-yellow-100 underline font-semibold' : ''
                            }`}
                            onClick={(e) => handleVerseClick(verse, e)}
                          >
                            <span className="font-semibold mr-2">{verse.verse}.</span>
                            {verse.text}
                          </button>
                        </div>
                        {activeAnnotation === annotationKey && (
                          <div className="absolute left-0 mt-2 p-2 bg-white shadow-lg rounded-lg z-10 max-w-xs">
                            <button
                              onClick={() => setActiveAnnotation(null)}
                              className="absolute top-1 right-1 p-1 hover:bg-gray-100 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            {verseAnnotations.map((annotation, annotationIndex) => (
                              <p key={annotationIndex} className="text-sm mt-2">{annotation.content}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p>No content available</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
        
        {selectedVerses.length > 0 && (
          <div
            ref={toolbarRef}
            className="fixed bg-white shadow-md rounded-md p-2 z-10"
            style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px` }}
          >
            <button
              onClick={handleAnnotationClick}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Add Annotation"
            >
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </button>
          </div>
        )}

        <Dialog open={isAnnotationDialogOpen} onOpenChange={setIsAnnotationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Annotation</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                placeholder="Enter your annotation..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAddAnnotation}>Save Annotation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Collapsible className="mt-8">
          <CollapsibleTrigger className="w-full text-left p-2 bg-emerald-100 rounded-t-lg">
            <h3 className="text-lg font-semibold">All Annotations</h3>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-2 bg-white rounded-b-lg border border-emerald-100">
            {annotations?.map((annotation, index) => (
              <div key={index} className="mb-4 p-2 bg-gray-100 rounded">
                <p className="font-semibold">{annotation.verses.join(', ')}</p>
                <p className="text-sm mt-1">{annotation.content}</p>
              </div>
            ))}
            {(!annotations || annotations.length === 0) && <p>No annotations yet</p>}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
