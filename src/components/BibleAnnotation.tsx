import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Lightbulb, X } from 'lucide-react'
import { BibleVerse } from '@/app/types'
import { Id } from "../../convex/_generated/dataModel"

interface Annotation {
  _id: Id<"noteSectionAnnotations">
  noteId: Id<"notes">
  sectionId: Id<"noteSections">
  content: string
  verses: string[]
}

interface BibleAnnotationProps {
  noteId: Id<"notes">
  section: {
    _id: Id<"noteSections">
    bibleReference: string
    content: BibleVerse[]
  }
  annotations: Annotation[]
}

export function BibleAnnotation({ noteId, section, annotations }: BibleAnnotationProps) {
  const [selectedVerses, setSelectedVerses] = useState<string[]>([])
  const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState("")
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const createAnnotation = useMutation(api.noteSectionAnnotations.createNoteSectionAnnotation)
  const deleteNoteSection = useMutation(api.noteSections.deleteNoteSection)

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

    const rect = event.currentTarget.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    setToolbarPosition({
      top: rect.top + scrollTop - 40,
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
        sectionId: section._id,
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
    const sortedAnnotations = annotations.sort((a, b) => {
      const compareVerses = (verseA: string, verseB: string) => {
        const [aBook, aChapter, aVerse] = verseA.split(/\s|:/);
        const [bBook, bChapter, bVerse] = verseB.split(/\s|:/);
        if (aBook !== bBook) return aBook.localeCompare(bBook);
        if (aChapter !== bChapter) return parseInt(aChapter) - parseInt(bChapter);
        return parseInt(aVerse) - parseInt(bVerse);
      };

      // Sort verses within each annotation
      a.verses.sort(compareVerses);
      b.verses.sort(compareVerses);

      // Compare the first verse of each annotation
      return compareVerses(a.verses[0], b.verses[0]);
    });

    return sortedAnnotations.reduce((acc, annotation) => {
      annotation.verses.forEach((verseRef: string) => {
        const match = verseRef.match(/^(\d*\s*\w+)\s*(\d+):(\d+)$/);
        if (!match) {
          console.error("Invalid verse reference format:", verseRef);
          return;
        }
        const [, book, chapter, verse] = match;
        
        section.content.forEach((verseContent: BibleVerse) => {
          if (verseContent.book === book.trim() && 
              verseContent.chapter === parseInt(chapter) && 
              verseContent.verse === parseInt(verse)) {
            const key = `${section._id}-${verseRef}`;
            if (!acc[key]) acc[key] = [];
            if (!acc[key].some((existingAnnotation: Annotation) => existingAnnotation._id === annotation._id)) {
              acc[key].push(annotation);
            }
          }
        });
      });
      return acc;
    }, {} as Record<string, typeof annotations>);
  };

  const organisedAnnotations = organiseAnnotations();

  const handleDeleteSection = async () => {
    try {
      await deleteNoteSection({ noteId, noteSectionId: section._id })
      toast.success("Section deleted successfully")
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error("Failed to delete section")
    }
  }

  return (
    <Collapsible className="mb-4">
      <CollapsibleTrigger className="w-full text-left p-2 rounded-t-lg flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bible Reference: {section.bibleReference}</h3>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 hover:bg-red-100 rounded-full group"
              title="Delete Section"
            >
              <X className="h-4 w-4 text-gray-500 group-hover:text-red-500" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this section?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteSection}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-2 bg-white rounded-b-lg border">
        {section.content.map((verse: BibleVerse, index: number) => {
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
                  {verseAnnotations.map((annotation: Annotation, annotationIndex: number) => (
                    <p key={annotationIndex} className="text-sm mt-2">{annotation.content}</p>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CollapsibleContent>

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
    </Collapsible>
  )
}
