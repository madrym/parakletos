// src/components/FileList.tsx
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface File {
  id: number;
  title: string;
  verse: string;
  date: Date;
  tags: string[];
}

export interface GroupedFiles {
  [key: string]: File[];
}

interface FileListProps {
  groupedFiles: GroupedFiles;
}

const FileList: React.FC<FileListProps> = ({ groupedFiles }) => {
  return (
    <ScrollArea className="h-[calc(100vh-100px)]">
      {Object.entries(groupedFiles).map(([month, files]) => (
        <div key={month} className="mb-4">
          <h3 className="font-semibold text-emerald-800 mb-2">{month}</h3>
          {files.map((file) => (
            <div key={file.id} className="p-2 hover:bg-emerald-100 rounded">
              <p className="font-medium">{file.title}</p>
              <p className="text-sm text-emerald-600">{file.verse}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {file.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </ScrollArea>
  );
};

export default FileList;
