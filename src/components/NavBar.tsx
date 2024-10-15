'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserButton } from "@clerk/nextjs"
import { Menu, X, Home, Book, BookOpen, BookImage, Search } from 'lucide-react'

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const toggleSidebar = () => setIsOpen(!isOpen)

  const navItems = [
    { name: 'Home', icon: <Home size={20} />, route: '/home' },
    { name: 'My Notes', icon: <Book size={20} />, route: '/my-notes' },
    { name: 'Devotions', icon: <BookOpen size={20} />, route: '/devotions' },
    { name: 'Bible Study', icon: <BookImage size={20} />, route: '/bible-study' },
    { name: 'Quick Lookup', icon: <Search size={20} />, route: '/bible' },
  ]

  return (
    <nav className="bg-emerald-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-white mr-4">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link href="/home" className="text-white text-xl font-bold">
            Parakletos
          </Link>
        </div>
        <UserButton appearance={{ elements: { avatarBox: { width: 40, height: 40 } } }} />
      </div>

      {/* Sidebar */}
      <div className={`fixed z-50 top-0 left-0 h-full w-64 bg-emerald-700 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4">
          <button onClick={toggleSidebar} className="text-white mb-4">
            <X size={24} />
          </button>
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                router.push(item.route)
                setIsOpen(false)
              }}
              className="flex items-center text-white py-2 px-4 w-full hover:bg-emerald-600 rounded"
            >
              {item.icon}
              <span className="ml-2">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default NavBar

