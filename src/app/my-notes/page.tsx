'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { Id } from '../../../convex/_generated/dataModel'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function MyNotesPage() {
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const convexUser = useQuery(api.users.getUser, { tokenIdentifier: user?.id ?? '' })
  const notesWithSections = useQuery(api.notes.getNotesWithSections, { userId: convexUser?._id as Id<"users"> })
  const notesWithFreeText = useQuery(api.notes.getNotesWithFreeText, { userId: convexUser?._id as Id<"users"> })
  const allTopics = Array.from(new Set(notesWithSections?.flatMap(note => note.topics) || []))

  const allNotes = [
    ...(notesWithSections?.map(note => ({
      ...note,
      freeText: notesWithFreeText?.find(ft => ft._id === note._id)?.freeText || [],
    })) ?? []),
    ...(notesWithFreeText?.filter(freeTextNote => 
      !notesWithSections?.some(sectionNote => sectionNote._id === freeTextNote._id)
    ).map(note => ({
      ...note,
      sections: []
    })) ?? [])
  ]

  const filteredNotes = allNotes
    .filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.sections.some(section => 
          section.bibleReference.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        note.freeText.some(freeText => 
          freeText.content.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        note.topics.some(topic => 
          topic.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesTopics = selectedTopics.length === 0 || 
        selectedTopics.some(topic => note.topics.includes(topic));

      return matchesSearch && matchesTopics;
    })
    .sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-emerald-700">My Notes</h1>

      <div className="flex mb-6 gap-2">
        <form onSubmit={handleSearch} className="flex-grow">
          <Input 
            type="text" 
            placeholder="Search notes, Bible references, or topics" 
            className="w-full bg-gray-100 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Filter by Topics</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <h4 className="font-medium leading-none">Select Topics</h4>
              {allTopics.map(topic => (
                <div key={topic} className="flex items-center space-x-2">
                  <Checkbox 
                    id={topic} 
                    checked={selectedTopics.includes(topic)}
                    onCheckedChange={() => handleTopicToggle(topic)}
                  />
                  <Label htmlFor={topic}>{topic}</Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-6">
        {filteredNotes.map(note => (
          <div key={note._id} className="bg-white rounded-lg shadow-md p-4">
            <Link href={`/notes/${note._id}`}>
              <h2 className="text-xl font-semibold mb-2 hover:text-emerald-600">{note.title}</h2>
            </Link>
            <p className="text-gray-600 mb-3">
              Created: {new Date(note.createdAt).toLocaleDateString()}
              {note.updatedAt && note.updatedAt !== note.createdAt && (
                <> | Last edited: {new Date(note.updatedAt).toLocaleDateString()}</>
              )}
            </p>
            <h3 className="font-semibold mb-2">Bible Sections:</h3>
            {note.sections && note.sections.length > 0 ? (
              <ul className="list-disc list-inside mb-2">
                {note.sections.map((section, index) => (
                  <li key={index} className="mb-2 pl-4">
                    {section.bibleReference}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mb-2">No Bible sections</p>
            )}
            <h3 className="font-semibold mb-2">Note Content:</h3>
            {note.freeText && note.freeText.length > 0 ? (
              <p className="text-gray-500 mb-2">
                Length: {note.freeText[0].content.length} characters
              </p>
            ) : (
              <p className="text-gray-500 mb-2">No note content</p>
            )}
            <h3 className="font-semibold mb-2">Topics:</h3>
            <div className="flex flex-wrap gap-2">
              {note.topics.length > 0 ? (
                note.topics.map((topic, index) => (
                  <span key={index} className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm">
                    {topic}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No topics</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <p className="text-center text-gray-600 mt-8">No notes found.</p>
      )}
    </div>
  )
}
