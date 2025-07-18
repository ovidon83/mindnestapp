import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Target,
  Moon,
  Maximize2,
  Save,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { useMindnestStore } from '../store';

interface CanvasDocument {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CanvasView: React.FC = () => {
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [documents, setDocuments] = useState<CanvasDocument[]>([]);
  const [currentDoc, setCurrentDoc] = useState<CanvasDocument | null>(null);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const { addNote } = useMindnestStore();

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
      }),
      Underline,
      Highlight,
      Placeholder.configure({
        placeholder: 'Start writing your thoughts...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setCurrentDoc(prev => prev ? {
        ...prev,
        content,
        updatedAt: new Date()
      } : null);
    },
  });

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('canvas-documents');
    if (savedDocs) {
      const parsedDocs = JSON.parse(savedDocs).map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }));
      setDocuments(parsedDocs);
      if (parsedDocs.length > 0) {
        setCurrentDoc(parsedDocs[0]);
      }
    } else {
      // Create default document
      const defaultDoc: CanvasDocument = {
        id: 'default',
        title: 'Untitled Document',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setDocuments([defaultDoc]);
      setCurrentDoc(defaultDoc);
    }
  }, []);

  // Update editor content when currentDoc changes
  useEffect(() => {
    if (editor && currentDoc) {
      const currentContent = editor.getHTML();
      if (currentContent !== currentDoc.content) {
        editor.commands.setContent(currentDoc.content);
      }
    }
  }, [currentDoc?.id, editor]);

  // Auto-save functionality
  useEffect(() => {
    if (currentDoc) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentDoc?.content, currentDoc?.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setCurrentDoc(prev => prev ? {
      ...prev,
      title,
      updatedAt: new Date()
    } : null);
  };

  // Save document
  const handleSave = async () => {
    if (!currentDoc) return;
    
    setIsSaving(true);
    try {
      // Update documents array
      const updatedDocs = documents.map(doc => 
        doc.id === currentDoc.id ? currentDoc : doc
      );
      setDocuments(updatedDocs);
      
      // Save to local storage
      localStorage.setItem('canvas-documents', JSON.stringify(updatedDocs));
      setLastSaved(new Date());
      
      // Also save as a note in the main store if content exists
      if (currentDoc.content.trim()) {
        addNote({
          title: currentDoc.title,
          content: currentDoc.content,
          tags: ['canvas', 'writing'],
        });
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Format text using TipTap commands
  const formatText = (command: string) => {
    if (!editor) return;
    
    editor.chain().focus();
    
    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'highlight':
        editor.chain().focus().toggleHighlight().run();
        break;
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      default:
        break;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!currentDoc || !editor) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">📄</span>
            <input
              ref={titleInputRef}
              value={currentDoc?.title || 'Untitled Document'}
              onChange={handleTitleChange}
              className="text-lg font-medium text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 min-w-0"
              placeholder="Untitled Document"
            />
          </div>
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Formatting Tools */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => formatText('bold')}
              className={`p-1 rounded transition-colors ${
                editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => formatText('italic')}
              className={`p-1 rounded transition-colors ${
                editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => formatText('underline')}
              className={`p-1 rounded transition-colors ${
                editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Underline"
            >
              <UnderlineIcon size={14} />
            </button>
            <button
              onClick={() => formatText('highlight')}
              className={`p-1 rounded transition-colors ${
                editor.isActive('highlight') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Highlight"
            >
              <div className="w-3.5 h-3.5 bg-yellow-300 rounded-sm" />
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => formatText('h1')}
              className={`p-1 rounded transition-colors ${
                editor.isActive({ heading: { level: 1 } }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Heading 1"
            >
              <Heading1 size={14} />
            </button>
            <button
              onClick={() => formatText('h2')}
              className={`p-1 rounded transition-colors ${
                editor.isActive({ heading: { level: 2 } }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Heading 2"
            >
              <Heading2 size={14} />
            </button>
            <button
              onClick={() => formatText('h3')}
              className={`p-1 rounded transition-colors ${
                editor.isActive({ heading: { level: 3 } }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Heading 3"
            >
              <Heading3 size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => formatText('bulletList')}
              className={`p-1 rounded transition-colors ${
                editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Bullet List"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => formatText('orderedList')}
              className={`p-1 rounded transition-colors ${
                editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Numbered List"
            >
              <ListOrdered size={14} />
            </button>
            <button
              onClick={() => formatText('blockquote')}
              className={`p-1 rounded transition-colors ${
                editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Quote"
            >
              <Quote size={14} />
            </button>
            <button
              onClick={() => formatText('codeBlock')}
              className={`p-1 rounded transition-colors ${
                editor.isActive('codeBlock') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Code Block"
            >
              <Code size={14} />
            </button>
          </div>
          
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              title="Save"
            >
              <Save size={14} />
            </button>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`p-1 rounded transition-colors ${
                focusMode ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Focus Mode"
            >
              <Target size={14} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1 rounded transition-colors ${
                darkMode ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
            <button
              onClick={toggleFullscreen}
              className={`p-1 rounded transition-colors ${
                isFullscreen ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        focusMode ? 'max-w-5xl mx-auto' : ''
      }`}>
        <div className={`h-full transition-colors duration-300 ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
          <div className="h-full flex flex-col">
            <div className="flex-1 relative">
              <EditorContent 
                editor={editor} 
                className={`w-full h-full p-12 focus:outline-none ${
                  darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 