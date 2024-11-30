import { API, BlockTool } from '@editorjs/editorjs';
import { getVersesFromDB } from '@/utils/initDB';

interface BibleVerseData {
  reference: string;
  formattedReference: string;
  verses: Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
}

export default class BibleVerseTool implements BlockTool {
  api: API;
  readOnly: boolean;
  data: BibleVerseData;
  wrapper: HTMLElement;

  static get toolbox() {
    return {
      title: 'Bible Verse',
      icon: '📖'
    };
  }

  constructor({ data, api, readOnly }: { data: BibleVerseData; api: API; readOnly: boolean }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      reference: data?.reference || '',
      formattedReference: data?.formattedReference || '',
      verses: data?.verses || []
    };

    // Create wrapper element
    this.wrapper = document.createElement('div');
  }

  render() {
    this.wrapper.innerHTML = '';

    // Create main container
    const container = document.createElement('div');
    container.classList.add('bible-verse-block', 'border', 'rounded-md', 'my-2');

    const renderContent = async () => {
      if (!this.data.reference && !this.readOnly) {
        const reference = prompt('Enter Bible reference (e.g., "John 3:16" or "Genesis 1:1-3"):');
        if (reference) {
          try {
            const result = await getVersesFromDB(reference);
            this.data = {
              reference,
              formattedReference: result.formattedReference,
              verses: result.verses
            };
          } catch (error) {
            console.error('Error fetching Bible verses:', error);
          }
        }
      }

      container.innerHTML = '';

      if (this.data.verses && this.data.verses.length > 0) {
        // Create header container
        const headerContainer = document.createElement('div');
        headerContainer.classList.add(
          'w-full',
          'flex',
          'items-center',
          'justify-between',
          'p-4',
          'hover:bg-gray-50'
        );

        // Create left side of header with reference
        const headerLeft = document.createElement('div');
        headerLeft.classList.add('flex', 'items-center', 'gap-2');
        
        const headerText = document.createElement('span');
        headerText.classList.add('font-semibold');
        headerText.textContent = `📖 ${this.data.formattedReference}`;
        
        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = '▼';
        toggleIcon.classList.add('text-sm', 'transition-transform', 'duration-200');
        
        headerLeft.appendChild(headerText);
        headerLeft.appendChild(toggleIcon);

        // Create edit button if not in readonly mode
        if (!this.readOnly) {
          const editButton = document.createElement('button');
          editButton.classList.add(
            'px-2',
            'py-1',
            'text-sm',
            'text-gray-600',
            'hover:bg-gray-100',
            'rounded'
          );
          editButton.textContent = 'Edit';
          editButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newReference = prompt('Enter Bible reference:', this.data.reference);
            if (newReference) {
              try {
                const result = await getVersesFromDB(newReference);
                this.data = {
                  reference: newReference,
                  formattedReference: result.formattedReference,
                  verses: result.verses
                };
                renderContent(); // Re-render the content
              } catch (error) {
                console.error('Error fetching Bible verses:', error);
              }
            }
          });
          headerContainer.appendChild(headerLeft);
          headerContainer.appendChild(editButton);
        } else {
          headerContainer.appendChild(headerLeft);
        }

        container.appendChild(headerContainer);

        // Create verses container
        const versesContainer = document.createElement('div');
        versesContainer.classList.add('p-4', 'border-t');

        // Add verses with verse numbers
        this.data.verses.forEach(verse => {
          const verseElement = document.createElement('p');
          verseElement.classList.add('my-1');
          
          const verseNumber = document.createElement('sup');
          verseNumber.classList.add('mr-1', 'font-semibold', 'text-gray-500');
          verseNumber.textContent = verse.verse.toString();
          
          verseElement.appendChild(verseNumber);
          verseElement.appendChild(document.createTextNode(verse.text));
          versesContainer.appendChild(verseElement);
        });

        container.appendChild(versesContainer);

        // Add toggle functionality
        let isCollapsed = false;
        headerContainer.addEventListener('click', (e) => {
          if (e.target === headerContainer || e.target === headerLeft || e.target === toggleIcon) {
            isCollapsed = !isCollapsed;
            versesContainer.style.display = isCollapsed ? 'none' : 'block';
            toggleIcon.style.transform = isCollapsed ? 'rotate(-90deg)' : '';
          }
        });
      } else {
        const placeholder = document.createElement('div');
        placeholder.classList.add('text-gray-400', 'p-4', 'flex', 'items-center', 'justify-between');
        placeholder.textContent = 'No verses found';

        // Add edit button if not in readonly mode
        if (!this.readOnly) {
          const editButton = document.createElement('button');
          editButton.classList.add(
            'px-2',
            'py-1',
            'text-sm',
            'text-gray-600',
            'hover:bg-gray-100',
            'rounded'
          );
          editButton.textContent = 'Edit';
          editButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newReference = prompt('Enter Bible reference:', this.data.reference);
            if (newReference) {
              try {
                const result = await getVersesFromDB(newReference);
                this.data = {
                  reference: newReference,
                  formattedReference: result.formattedReference,
                  verses: result.verses
                };
                renderContent(); // Re-render the content
              } catch (error) {
                console.error('Error fetching Bible verses:', error);
              }
            }
          });
          placeholder.appendChild(editButton);
        }
        
        container.appendChild(placeholder);
      }
    };

    // Initial render
    renderContent();

    this.wrapper.appendChild(container);
    return this.wrapper;
  }

  save() {
    return {
      reference: this.data.reference,
      formattedReference: this.data.formattedReference,
      verses: this.data.verses
    };
  }

  static get isReadOnlySupported() {
    return true;
  }
}