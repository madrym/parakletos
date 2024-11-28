'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import EditorJS, { OutputData, LogLevels, BlockToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import EditorjsList from '@editorjs/list';
import Annotation from 'editorjs-annotation';
import Delimiter from '@editorjs/delimiter';
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import BibleVerseTool from './editor/BibleVerseTool';
import { getVersesFromDB } from '@/utils/initDB';
import { Card } from "@/components/ui/card";

interface NoteTakingProps {
  noteId: Id<"notes">;
  userId: Id<"users">;
}

interface VersePreview {
  formattedReference: string;
  verses: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }[];
}

const NoteTaking: React.FC<NoteTakingProps> = ({ noteId, userId }) => {
  const editorRef = useRef<EditorJS | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const noteFreeTextIdRef = useRef<Id<"noteFreeText"> | null>(null);
  const editorId = `editorjs-${noteId}`;
  const [isSaved, setIsSaved] = useState(false);
  const [versePreview, setVersePreview] = useState<VersePreview | null>(null);
  const [lastTypedText, setLastTypedText] = useState<string>('');

  const createNoteFreeText = useMutation(api.noteFreeText.createNoteFreeText);
  const updateNoteFreeText = useMutation(api.noteFreeText.updateNoteFreeText);
  const noteFreeText = useQuery(api.noteFreeText.getNoteFreeText, { noteId });

  // Initialize noteFreeText if it doesn't exist
  useEffect(() => {
    const initializeNoteFreeText = async () => {
      if (noteFreeText !== undefined && noteFreeText.length === 0) {
        try {
          const newNoteFreeTextId = await createNoteFreeText({
            noteId,
            userId,
            content: JSON.stringify({ blocks: [] })
          });
          noteFreeTextIdRef.current = newNoteFreeTextId;
        } catch (error) {
          console.error('Error creating noteFreeText:', error);
        }
      } else if (noteFreeText && noteFreeText.length > 0) {
        noteFreeTextIdRef.current = noteFreeText[0]._id;
      }
    };

    initializeNoteFreeText();
  }, [noteFreeText, noteId, userId, createNoteFreeText]);

  const saveEditorContent = useCallback(async (content: OutputData) => {
    try {
      console.log('saveEditorContent - noteFreeTextIdRef.current', noteFreeTextIdRef.current);
      if (!noteFreeTextIdRef.current) {
        return;
      }
      console.log('saveEditorContent - content', content);
      await updateNoteFreeText({
        noteFreeTextId: noteFreeTextIdRef.current,
        content: JSON.stringify(content),
      });
      console.log('saveEditorContent - noteFreeTextIdRef.current', noteFreeTextIdRef.current);
      setIsSaved(true);
    } catch (error) {
      console.error('Error in saveEditorContent:', error);
      setIsSaved(false);
    }
  }, [updateNoteFreeText]);

  const debouncedSave = useMemo(() => 
    debounce((content: OutputData) => {
      console.log('debouncedSave - content', content);
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

  const detectBibleReference = (text: string) => {
    // Basic regex to match common Bible verse patterns
    const bibleReferenceRegex = /\b(\d?\s*[a-z]+(?:\s+[a-z]+)?)\s*(\d+)(?::(\d+)(?:-(\d+))?)?\b/i;
    const match = text.match(bibleReferenceRegex);
    return match;
  };

  const handleVerseInsertion = async () => {
    if (versePreview && editorRef.current) {
      await editorRef.current.blocks.insert('bibleVerse', {
        reference: versePreview.formattedReference,
        formattedReference: versePreview.formattedReference,
        verses: versePreview.verses
      });
      setVersePreview(null);
    }
  };

  useEffect(() => {
    let currentEditor: EditorJS | null = null;

    if (noteFreeText !== undefined && !editorRef.current) {
      currentEditor = new EditorJS({
        holder: editorId,
        tools: {
          header: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: ['bold', 'italic', 'annotation', 'link']
          },
          paragraph: {
            class: Paragraph as unknown as BlockToolConstructable,
            inlineToolbar: ['bold', 'italic', 'annotation', 'link']
          },
          list: {
            class: EditorjsList as unknown as BlockToolConstructable
          },
          annotation: Annotation,
          bibleVerse: {
            class: BibleVerseTool as unknown as BlockToolConstructable,
          },
          delimiter: {
            class: Delimiter as unknown as BlockToolConstructable,
          }
        },
        data: noteFreeText && noteFreeText.length > 0 
          ? validateAndFixData(JSON.parse(noteFreeText[0].content))
          : { blocks: [] },
        onChange: async () => {
          if (currentEditor) {
            const outputData = await currentEditor.save();
            setIsSaved(false);
            debouncedSave(outputData);

            const currentBlockIndex = await currentEditor.blocks.getCurrentBlockIndex();
            const currentBlock = await currentEditor.blocks.getBlockByIndex(currentBlockIndex);
            if (currentBlock && currentBlock.name === 'paragraph') {
              const text = currentBlock.holder.textContent || '';
              
              // Only process if the text has changed significantly
              if (Math.abs(text.length - lastTypedText.length) > 0) {
                setLastTypedText(text);
                const match = detectBibleReference(text);
                
                if (match) {
                  try {
                    const reference = match[0];
                    const result = await getVersesFromDB(reference);
                    if (result.verses.length > 0) {
                      setVersePreview(result);
                    } else {
                      setVersePreview(null);
                    }
                  } catch (error) {
                    console.error('Error fetching verse:', error);
                    setVersePreview(null);
                  }
                } else {
                  setVersePreview(null);
                }
              }
            }
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
  }, [noteFreeText, editorId, debouncedSave, lastTypedText]);

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

  return (
    <div className="relative">
      <div 
        id={editorId}
        className="prose max-w-full min-h-[200px] border border-gray-300 rounded p-4"
      />
      {!isEditorReady && <div>Loading editor...</div>}
      {isSaved && (
        <div className="absolute top-2 right-2 text-sm text-green-700 font-semibold">
          Auto-saved
        </div>
      )}
      
      {versePreview && (
        <Card className="fixed bottom-20 right-4 p-4 w-[calc(100%-2rem)] max-w-sm bg-white shadow-lg border rounded-lg z-50">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{versePreview.formattedReference}</div>
              <button 
                onClick={() => setVersePreview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-sm max-h-40 overflow-y-auto">
              {versePreview.verses.map((verse, index) => (
                <div key={index} className="mb-2">
                  <span className="font-semibold">{verse.verse}</span> {verse.text}
                </div>
              ))}
            </div>
            <Button 
              className="mt-2 w-full"
              onClick={handleVerseInsertion}
            >
              Insert Verse
            </Button>
          </div>
        </Card>
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
