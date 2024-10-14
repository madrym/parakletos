'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Id } from '../../../convex/_generated/dataModel'

export default function MyNotesPage() {
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const convexUser = useQuery(api.users.getUser, { tokenIdentifier: user?.id ?? '' })
  const notesWithSections = useQuery(api.notes.getNotesWithSections, { userId: convexUser?._id as Id<"users"> })

  const filteredNotes = notesWithSections?.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.sections.some(section => 
      section.bibleReference.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-emerald-700">My Notes</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <Input 
          type="text" 
          placeholder="Search notes or Bible references" 
          className="w-full bg-gray-100 border-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      <div className="space-y-6">
        {filteredNotes?.map(note => (
          <div key={note._id} className="bg-white rounded-lg shadow-md p-4">
            <Link href={`/notes/${note._id}`}>
              <h2 className="text-xl font-semibold mb-2 hover:text-emerald-600">{note.title}</h2>
            </Link>
            <p className="text-gray-600 mb-3">
              Created: {new Date(note.createdAt).toLocaleDateString()}
            </p>
            <h3 className="font-semibold mb-2">Bible Sections:</h3>
            <ul className="list-disc list-inside">
              {note.sections.map((section, index) => (
                <li key={index} className="mb-1">
                    {section.bibleReference}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {filteredNotes?.length === 0 && (
        <p className="text-center text-gray-600 mt-8">No notes found.</p>
      )}

      <Button 
        className="fixed top-5 left-5 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => router.push('/home')}
      >
        Back to Home
      </Button>
    </div>
  )
}