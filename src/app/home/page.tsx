"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Menu, Plus, Tag, X } from "lucide-react";
import FileList, { File, GroupedFiles } from "@/components/FileList";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

// Mock data for recently edited files and tags
const recentFiles: File[] = [
  {
    id: 1,
    title: "Sunday Sermon Notes",
    verse: "John 3:16",
    date: new Date(2023, 5, 1),
    tags: ["sermon", "love"],
  },
  {
    id: 2,
    title: "Bible Study - Ephesians",
    verse: "Ephesians 2:8-9",
    date: new Date(2023, 5, 15),
    tags: ["study", "grace"],
  },
  {
    id: 3,
    title: "Prayer Journal",
    verse: "Philippians 4:6-7",
    date: new Date(2023, 6, 1),
    tags: ["prayer", "anxiety"],
  },
  {
    id: 4,
    title: "Devotional Thoughts",
    verse: "Psalm 23:1",
    date: new Date(2023, 6, 15),
    tags: ["devotional", "trust"],
  },
  {
    id: 5,
    title: "Church Meeting Notes",
    verse: "Acts 2:42",
    date: new Date(2023, 7, 1),
    tags: ["meeting", "community"],
  },
];

const allTags: string[] = [
  "sermon",
  "love",
  "study",
  "grace",
  "prayer",
  "anxiety",
  "devotional",
  "trust",
  "meeting",
  "community",
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState("");

  const { user } = useUser();
  const username = user?.firstName || "";

  const filteredFiles = recentFiles.filter(
    (file) =>
      (file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.verse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )) &&
      (selectedTags.length === 0 ||
        selectedTags.some((tag) => file.tags.includes(tag)))
  );

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const groupedFiles: GroupedFiles = filteredFiles.reduce((acc, file) => {
    const month = file.date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(file);
    return acc;
  }, {} as GroupedFiles);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="bg-emerald-600 text-white p-4 flex items-center justify-between">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-2">Search Notes</h2>
              <Input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <FileList groupedFiles={groupedFiles} />
            </div>
          </SheetContent>
        </Sheet>
        <UserButton />
      </header>
      <main className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-emerald-800">
            Welcome{username ? `, ${username}` : ""}
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 border-emerald-600"
              >
                <Tag className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <div className="mb-6">
                <Input
                  type="search"
                  placeholder="Search labels..."
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  className="mb-4"
                />
                <div className="flex flex-wrap gap-2 mb-4">
                  {filteredTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        selectedTags.includes(tag) ? "default" : "outline"
                      }
                      className="cursor-pointer text-sm py-1 px-3"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex items-center mb-4">
                    <span className="mr-2 text-sm text-emerald-700">
                      Filtered by:
                    </span>
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        className="mr-1 cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTags([])}
                      className="ml-2 text-xs text-emerald-600"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <h2 className="text-xl font-semibold text-emerald-700 mb-4">
          Recently Edited
        </h2>
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <div key={file.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-lg">{file.title}</h3>
              <p className="text-emerald-600">{file.verse}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {file.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Link href="/note">
        <Button
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
