'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import EditorJS, { OutputData, LogLevels } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import BibleVerseTool from './editor/BibleVerseTool';

interface NoteTakingProps {
  noteId: Id<"notes">;
  userId: Id<"users">;
}

const NoteTaking: React.FC<NoteTakingProps> = ({ noteId }) => {
  const editorRef = useRef<EditorJS | null>(null);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [, setLastSavedContent] = useState<string>('');
  const noteFreeTextIdRef = useRef<Id<"noteFreeText"> | null>(null);
  const editorId = `editorjs-${noteId}`;
  const [isSaved, setIsSaved] = useState(false);

  const updateNoteFreeText = useMutation(api.noteFreeText.updateNoteFreeText);
  const noteFreeText = useQuery(api.noteFreeText.getNoteFreeText, { noteId });

  useEffect(() => {
    // Initialize lastSavedContent when note data is loaded
    if (noteFreeText && noteFreeText.length > 0) {
      try {
        const content = JSON.parse(noteFreeText[0].content);
        const normalizedContent = {
          ...content,
          time: undefined,
          blocks: content.blocks.map((block: any) => ({
            ...block,
            id: undefined
          }))
        };
        setLastSavedContent(JSON.stringify(normalizedContent));
      } catch (error) {
        console.error('Error parsing initial content:', error);
      }
    }
  }, [noteFreeText]);

  const saveEditorContent = useCallback(async (content: OutputData) => {
    try {
      if (!noteFreeTextIdRef.current) {
        return;
      }

      await updateNoteFreeText({
        noteFreeTextId: noteFreeTextIdRef.current,
        content: JSON.stringify(content),
      });
      
      setIsSaved(true);
    } catch (error) {
      console.error('Error in saveEditorContent:', error);
      setIsSaved(false);
    }
  }, [updateNoteFreeText]);

  const debouncedSave = useMemo(() => 
    debounce((content: OutputData) => {
      saveEditorContent(content);
    }, 2000),
    [saveEditorContent]
  );

  const validateAndFixData = (data: any): OutputData => {
    if (!data || typeof data !== 'object') {
      return { blocks: [] };
    }

    if (!Array.isArray(data.blocks)) {
      data.blocks = [];
    }

    data.blocks = data.blocks.map((block: any) => {
      if (typeof block !== 'object' || !block.type) {
        return null;
      }

      if (!block.data) {
        block.data = {};
      }

      switch (block.type) {
        case 'paragraph':
          if (typeof block.data.text !== 'string') {
            block.data.text = '';
          }
          break;
        case 'header':
          if (typeof block.data.text !== 'string') {
            block.data.text = '';
          }
          if (typeof block.data.level !== 'number' || block.data.level < 1 || block.data.level > 6) {
            block.data.level = 2;
          }
          break;
        case 'list':
          if (!Array.isArray(block.data.items)) {
            block.data.items = [];
          }
          block.data.items = block.data.items.filter((item: any) => typeof item === 'string');
          break;
        case 'quote':
          if (typeof block.data.text !== 'string') {
            block.data.text = '';
          }
          if (typeof block.data.caption !== 'string') {
            block.data.caption = '';
          }
          break;
        case 'bibleVerse':
          if (!block.data.reference || !block.data.formattedReference || !Array.isArray(block.data.verses)) {
            return null;
          }
          break;
        default:
          return null;
      }

      return block;
    }).filter(Boolean);

    return data;
  };

  const handleToolSelect = async (tool: string) => {
    setIsToolbarOpen(false);
    if (editorRef.current) {
      if (tool === 'bibleVerse') {
        // Let the tool handle the prompt and verse fetching
        await editorRef.current.blocks.insert('bibleVerse');
      } else {
        editorRef.current.blocks.insert(tool);
      }
    }
  };

  useEffect(() => {
    let currentEditor: EditorJS | null = null;

    if (noteFreeText !== undefined && !editorRef.current) {
      currentEditor = new EditorJS({
        holder: editorId,
        tools: {
          paragraph: Paragraph,
          header: Header,
          list: List,
          quote: Quote,
          bibleVerse: BibleVerseTool
        },
        data: noteFreeText && noteFreeText.length > 0 
          ? validateAndFixData(JSON.parse(noteFreeText[0].content))
          : { blocks: [] },
        onChange: async () => {
          if (currentEditor) {
            const outputData = await currentEditor.save();
            setIsSaved(false);
            debouncedSave(outputData);
          }
        },
        onReady: () => {
          setIsEditorReady(true);
        },
        autofocus: true,
        placeholder: 'Start typing your note here...',
        logLevel: 'ERROR' as LogLevels,
      });

      editorRef.current = currentEditor;
    }

    return () => {
      if (currentEditor && editorRef.current === currentEditor) {
        // Cleanup only on unmount
      }
    };
  }, [noteFreeText, editorId, debouncedSave]);

  useEffect(() => {
    const storedId = localStorage.getItem(`noteFreeTextId_${noteId}`);
    if (storedId) {
      noteFreeTextIdRef.current = storedId as Id<"noteFreeText">;
    }
  }, [noteId]);

  useEffect(() => {
    if (noteFreeText && noteFreeText.length > 0 && !noteFreeTextIdRef.current) {
      noteFreeTextIdRef.current = noteFreeText[0]._id;
      localStorage.setItem(`noteFreeTextId_${noteId}`, noteFreeText[0]._id);
    }
  }, [noteFreeText, noteId]);

  const renderToolbar = () => (
    <Dialog open={isToolbarOpen} onOpenChange={setIsToolbarOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-4 right-4 rounded-full">+</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleToolSelect('header')}>Header</Button>
          <Button onClick={() => handleToolSelect('paragraph')}>Paragraph</Button>
          <Button onClick={() => handleToolSelect('list')}>List</Button>
          <Button onClick={() => handleToolSelect('quote')}>Quote</Button>
          <Button onClick={() => handleToolSelect('bibleVerse')}>Bible Verse</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="relative">
      <div 
        id={editorId}
        className="prose max-w-full min-h-[200px] border border-gray-300 rounded p-4"
      />
      {isEditorReady && renderToolbar()}
      {!isEditorReady && <div>Loading editor...</div>}
      {isSaved && (
        <div className="absolute top-2 right-2 text-sm text-green-700 font-semibold">
          Auto-saved
        </div>
      )}
    </div>
  );
};

export default NoteTaking;

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
