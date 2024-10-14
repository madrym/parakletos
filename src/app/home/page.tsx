'use client'

import React from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { toast } from "react-hot-toast"
import { Id } from "../../../convex/_generated/dataModel";

export default function HomePage() {
  const { user } = useUser()
  const router = useRouter()
  const createNote = useMutation(api.notes.createNote)
  const convexUser = useQuery(api.users.getUser, { tokenIdentifier: user?.id ?? '' })
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push('/search')
  }

  const handleCreateNote = async () => {
    if (!convexUser) {
      console.error("User not found in Convex");
      return;
    }

    const newNoteId = await createNote({
      userId: convexUser._id,
      title: "New Note",
      topics: [],
    });
    
    router.push(`/notes/${newNoteId}`);
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-4xl font-bold mb-6 text-emerald-700">
        Hi {user?.firstName || 'there'}
      </h1>

      <form onSubmit={handleSearch} className="mb-6">
        <Input type="text" placeholder="Search notes" className="w-full bg-gray-100 border-none" />
      </form>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 h-48 bg-white rounded-lg overflow-hidden relative">
          <div className="absolute bottom-0 left-0 w-[calc(50%-0.5rem)] h-[calc(50%-1rem)] bg-emerald-50 rounded-lg">
            <Link href="/my-notes" className="block w-full h-full">
              <Button variant="ghost" className="w-full h-full text-base font-semibold text-gray-600 hover:bg-emerald-200">
                My notes
              </Button>
            </Link>
          </div>
          <div className="clip-path-right-angle absolute w-[calc(100%-0rem)] h-[calc(100%-0rem)] bg-emerald-50 rounded-lg">
            <Button 
              variant="ghost" 
              className="w-full h-full flex items-end justify-end p-4 hover:bg-emerald-200"
              onClick={handleCreateNote}
            >
              <span className="text-lg font-semibold text-gray-600 pr-6">Add new note</span>
            </Button>
          </div>
        </div>

        {[
          { text: 'Devotions', href: '/devotions' },
          { text: 'Bible Study', href: '/bible-study' },
          { text: 'Sermons', href: '/sermons' },
          { text: 'Quick Lookup', href: '/bible' }
        ].map((item) => (
          <div key={item.text} className="bg-emerald-50 rounded-lg h-24 hover:bg-emerald-200">
            <Link href={item.href} className="block h-full">
              <Button variant="ghost" className="w-full h-full text-base font-semibold text-gray-600 hover:bg-emerald-200">
                {item.text}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
