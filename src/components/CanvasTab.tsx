import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  StickyNote,
  Palette,
  Move,
  Plus,
  X,
  CornerDownRight
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

interface Sticker {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
}

interface CanvasImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const STICKER_COLORS = [
  'bg-yellow-200 border-yellow-300',
  'bg-blue-200 border-blue-300',
  'bg-green-200 border-green-300',
  'bg-pink-200 border-pink-300',
  'bg-purple-200 border-purple-300',
  'bg-orange-200 border-orange-300',
];

export const CanvasTab: React.FC = () => {
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [documents, setDocuments] = useState<CanvasDocument[]>([]);
  const [currentDoc, setCurrentDoc] = useState<CanvasDocument | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const canvasRef = useRef<HTMLDivElement>(null);
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

  // Load documents and stickers from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('canvas-documents');
    const savedStickers = localStorage.getItem('canvas-stickers');
    const savedImages = localStorage.getItem('canvas-images');
    
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

    if (savedStickers) {
      setStickers(JSON.parse(savedStickers));
    }

    if (savedImages) {
      setImages(JSON.parse(savedImages));
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

  // Save stickers and images to localStorage
  useEffect(() => {
    localStorage.setItem('canvas-stickers', JSON.stringify(stickers));
  }, [stickers]);

  useEffect(() => {
    localStorage.setItem('canvas-images', JSON.stringify(images));
  }, [images]);

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

  // Add new sticker
  const addSticker = () => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      content: '',
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      color: STICKER_COLORS[Math.floor(Math.random() * STICKER_COLORS.length)],
      width: 250,
      height: 150,
    };
    setStickers(prev => [...prev, newSticker]);
    setSelectedSticker(newSticker.id);
    
    // Focus the textarea after a short delay to ensure it's rendered
    setTimeout(() => {
      const textarea = document.querySelector(`[data-sticker-id="${newSticker.id}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 200);
  };

  // Update sticker content
  const updateStickerContent = (id: string, content: string) => {
    setStickers(prev => prev.map(sticker => 
      sticker.id === id ? { ...sticker, content } : sticker
    ));
  };

  // Delete sticker
  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(sticker => sticker.id !== id));
    setSelectedSticker(null);
  };

  // Handle sticker drag start
  const handleStickerDragStart = (e: React.MouseEvent, stickerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setSelectedSticker(stickerId);
    
    const sticker = stickers.find(s => s.id === stickerId);
    if (sticker) {
      setDragOffset({
        x: e.clientX - sticker.x,
        y: e.clientY - sticker.y,
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && selectedSticker) {
      e.preventDefault();
      setStickers(prev => prev.map(sticker => 
        sticker.id === selectedSticker 
          ? { 
              ...sticker, 
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y,
            }
          : sticker
      ));
    }
  }, [isDragging, selectedSticker, dragOffset]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle sticker click to select
  const handleStickerClick = (stickerId: string) => {
    setSelectedSticker(stickerId);
  };



  // Handle image paste
  const handleImagePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            const newImage: CanvasImage = {
              id: `image-${Date.now()}`,
              src,
              x: Math.random() * 200 + 50,
              y: Math.random() * 200 + 50,
              width: 200,
              height: 150,
            };
            setImages(prev => [...prev, newImage]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, []);

  // Add paste event listener
  useEffect(() => {
    document.addEventListener('paste', handleImagePaste);
    return () => {
      document.removeEventListener('paste', handleImagePaste);
    };
  }, [handleImagePaste]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          const newImage: CanvasImage = {
            id: `image-${Date.now()}`,
            src,
            x: Math.random() * 200 + 50,
            y: Math.random() * 200 + 50,
            width: 200,
            height: 150,
          };
          setImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
          {/* Canvas Tools */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={addSticker}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title="Add Sticker"
            >
              <StickyNote size={14} />
            </button>
            <button
              onClick={() => setShowStickerPanel(!showStickerPanel)}
              className={`p-1 rounded transition-colors ${
                showStickerPanel ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Sticker Panel"
            >
              <Palette size={14} />
            </button>
          </div>

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
        <div 
          ref={canvasRef}
          className={`h-full transition-colors duration-300 relative overflow-hidden ${
            darkMode ? 'bg-gray-900' : 'bg-white'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSticker(null);
            }
          }}
        >
          {/* Stickers */}
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className={`absolute border-2 rounded-lg shadow-lg ${
                sticker.color
              } ${selectedSticker === sticker.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: sticker.x,
                top: sticker.y,
                width: sticker.width,
                height: sticker.height,
              }}
              onClick={() => handleStickerClick(sticker.id)}
            >
              {/* Drag Handle */}
              <div 
                className="flex items-center justify-between p-2 border-b border-gray-300 cursor-move select-none bg-gray-50"
                onMouseDown={(e) => handleStickerDragStart(e, sticker.id)}
              >
                <div className="flex items-center gap-1">
                  <Move size={12} className="text-gray-500" />
                  <span className="text-xs text-gray-500">Drag to move</span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteSticker(sticker.id);
                  }}
                  className="text-gray-500 hover:text-red-600 transition-colors p-1 rounded"
                  title="Delete note"
                >
                  <X size={12} />
                </button>
              </div>
              
              {/* Text Area */}
              <div className="relative flex-1">
                <textarea
                  data-sticker-id={sticker.id}
                  value={sticker.content}
                  onChange={(e) => updateStickerContent(sticker.id, e.target.value)}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedSticker(sticker.id);
                  }}
                  onFocus={() => {
                    setSelectedSticker(sticker.id);
                  }}
                  onBlur={() => {
                    // Keep selection active
                  }}
                  className="w-full p-3 bg-transparent border-0 resize-none focus:outline-none text-sm leading-relaxed"
                  placeholder="Write your note..."
                  style={{ 
                    height: `${sticker.height - 50}px`,
                    minHeight: '60px'
                  }}
                />
                
                {/* Resize Handle */}
                <div 
                  className="absolute bottom-1 right-1 cursor-se-resize text-gray-400 hover:text-gray-600 p-1"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    // TODO: Add resize functionality
                  }}
                  title="Resize note"
                >
                  <CornerDownRight size={12} />
                </div>
              </div>
            </div>
          ))}

          {/* Images */}
          {images.map((image) => (
            <div
              key={image.id}
              className="absolute cursor-move"
              style={{
                left: image.x,
                top: image.y,
                width: image.width,
                height: image.height,
              }}
            >
              <img
                src={image.src}
                alt="Canvas image"
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
            </div>
          ))}

          {/* Editor */}
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

          {/* Sticker Panel */}
          {showStickerPanel && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Stickers</h3>
                <button
                  onClick={() => setShowStickerPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={addSticker}
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Sticker</span>
                </button>
                <div className="text-xs text-gray-500">
                  Drag images here or paste from clipboard
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 