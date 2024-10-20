'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface NoteTakingProps {
  noteId: Id<"notes">;
  userId: Id<"users">;
}

const NoteTaking: React.FC<NoteTakingProps> = ({ noteId, userId }) => {
  const editorRef = useRef<EditorJS | null>(null);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const noteFreeTextIdRef = useRef<Id<"noteFreeText"> | null>(null);
  const editorId = `editorjs-${noteId}`;
  const [isSaved, setIsSaved] = useState(false);

  const createNoteFreeText = useMutation(api.noteFreeText.createNoteFreeText);
  const updateNoteFreeText = useMutation(api.noteFreeText.updateNoteFreeText);
  const noteFreeText = useQuery(api.noteFreeText.getNoteFreeText, { noteId });

  const saveEditorContent = useCallback(async (content: OutputData) => {
    const contentString = JSON.stringify(content);
    if (contentString === lastSavedContent) return;
    
    try {
      if (noteFreeTextIdRef.current) {
        await updateNoteFreeText({
          noteFreeTextId: noteFreeTextIdRef.current,
          content: contentString,
        });
      } else {
        const newNoteFreeTextId = await createNoteFreeText({
          userId,
          noteId,
          content: contentString,
        });
        noteFreeTextIdRef.current = newNoteFreeTextId;
        localStorage.setItem(`noteFreeTextId_${noteId}`, newNoteFreeTextId);
      }
      setLastSavedContent(contentString);
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving editor content:', error);
    }
  }, [updateNoteFreeText, createNoteFreeText, userId, noteId, lastSavedContent]);

  const debouncedSave = useCallback(
    debounce((content: OutputData) => saveEditorContent(content), 2000),
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
        default:
          return null;
      }

      return block;
    }).filter(Boolean);

    return data;
  };

  const initEditor = useCallback(() => {
    if (editorRef.current) return;

    let initialData: OutputData = { blocks: [] };
    if (noteFreeText && noteFreeText.length > 0) {
      try {
        const parsedData = JSON.parse(noteFreeText[0].content);
        initialData = validateAndFixData(parsedData);
        setLastSavedContent(JSON.stringify(initialData));
      } catch (error) {
        console.error('Error parsing initial data:', error);
      }
    }

    const editor = new EditorJS({
      holder: editorId,
      tools: {
        header: Header,
        list: List,
        paragraph: Paragraph,
        quote: Quote,
      },
      data: initialData,
      onChange: async () => {
        if (editorRef.current) {
          const content = await editorRef.current.save();
          setIsSaved(false);
          debouncedSave(content);
        }
      },
      onReady: () => {
        setIsEditorReady(true);
        console.log('Editor is ready');
      },
      autofocus: true,
      placeholder: 'Start typing your note here...',
    });
    editorRef.current = editor;
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

  useEffect(() => {
    if (noteFreeText !== undefined) {
      initEditor();
    }
//     return () => {
//       if (editorRef.current) {
//         editorRef.current.isReady.then(() => {
//           editorRef.current?.destroy();
//           editorRef.current = null;
//         });
//       }
//     };
  }, [initEditor, noteFreeText]);

  const handleToolSelect = (tool: string) => {
    setIsToolbarOpen(false);
    if (editorRef.current) {
      editorRef.current.blocks.insert(tool);
    }
  };

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
