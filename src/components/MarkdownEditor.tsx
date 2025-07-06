import React, { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import Emoji from '@tiptap/extension-emoji';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Image as ImageIcon,
  Smile,
  Undo2,
  Redo2,
  Quote,
  Minus,
  Type,
  Info,
  Upload,
  X,
  Search as SearchIcon
} from 'lucide-react';

// Simple emoji list for demo; replace with a full picker as needed
const EMOJI_LIST = ['😀','😃','😄','😁','😆','😅','😂','🙂','🙃','😉','😊','😍','🥰','😘','😗','😙','😚','😋','😜','🤩','🤔','🤗','🤫','🤭','🥳','😎','😇','🥲','😭','😡','😱','👍','🙏','🔥','💡','🎉','❤️','⭐','🌈','☀️','🌙','🍀','🍕','🍔','🍎','🍩','🍪','🍰','🍺','☕'];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const lowlight = createLowlight(common);

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link,
      Underline,
      Highlight,
      TaskList,
      TaskItem,
      Emoji,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: placeholder || 'Start typing...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-violet max-w-none min-h-[180px] focus:outline-none ' + (className || ''),
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          handleImageUpload(files[0]);
          return true;
        }
        return false;
      },
    },
  });

  // Keep editor in sync with value prop
  const lastValue = useRef(value);
  useEffect(() => {
    if (editor && value !== lastValue.current) {
      editor.commands.setContent(value || '', false);
      lastValue.current = value;
    }
  }, [value, editor]);

  // Sticky toolbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!toolbarRef.current) return;
      const { top } = toolbarRef.current.getBoundingClientRect();
      if (top < 16) {
        toolbarRef.current.classList.add('fixed', 'top-16', 'left-0', 'right-0', 'z-50', 'mx-auto', 'max-w-2xl', 'rounded-b-2xl', 'shadow-2xl');
      } else {
        toolbarRef.current.classList.remove('fixed', 'top-16', 'left-0', 'right-0', 'z-50', 'mx-auto', 'max-w-2xl', 'rounded-b-2xl', 'shadow-2xl');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Image upload handler
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (editor && typeof reader.result === 'string') {
        editor.chain().focus().setImage({ src: reader.result }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  // Emoji picker logic
  const filteredEmojis = emojiSearch
    ? EMOJI_LIST.filter(e => e.includes(emojiSearch))
    : EMOJI_LIST;

  if (!editor) return <div className="min-h-[180px] bg-white/80 rounded-2xl border border-gray-200 animate-pulse" />;

  return (
    <div className="border border-white/30 rounded-2xl bg-white/70 backdrop-blur-xl shadow-xl p-0 relative">
      {/* Sticky/Floating Toolbar */}
      <div ref={toolbarRef} className="flex flex-wrap gap-1 px-3 py-2 mb-2 items-center rounded-t-2xl bg-gradient-to-r from-violet-50/80 via-pink-50/80 to-cyan-50/80 shadow-sm border-b border-white/20 sticky top-0 z-30">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-violet-400 focus:outline-none ${editor.isActive('bold') ? 'bg-violet-100 text-violet-700 shadow' : 'hover:bg-violet-50 text-gray-700'}`} aria-label="Bold" title="Bold (Ctrl+B)"><Bold size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-pink-400 focus:outline-none ${editor.isActive('italic') ? 'bg-pink-100 text-pink-700 shadow' : 'hover:bg-pink-50 text-gray-700'}`} aria-label="Italic" title="Italic (Ctrl+I)"><Italic size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-cyan-400 focus:outline-none ${editor.isActive('underline') ? 'bg-cyan-100 text-cyan-700 shadow' : 'hover:bg-cyan-50 text-gray-700'}`} aria-label="Underline" title="Underline (Ctrl+U)"><UnderlineIcon size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-yellow-400 focus:outline-none ${editor.isActive('highlight') ? 'bg-yellow-100 text-yellow-700 shadow' : 'hover:bg-yellow-50 text-gray-700'}`} aria-label="Highlight" title="Highlight"><Type size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-violet-400 focus:outline-none ${editor.isActive('heading', { level: 1 }) ? 'bg-violet-200 text-violet-800 shadow' : 'hover:bg-violet-50 text-gray-700'}`} aria-label="Heading 1" title="Heading 1"><Heading size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-violet-400 focus:outline-none ${editor.isActive('bulletList') ? 'bg-violet-100 text-violet-700 shadow' : 'hover:bg-violet-50 text-gray-700'}`} aria-label="Bullet List" title="Bullet List"><List size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-violet-400 focus:outline-none ${editor.isActive('orderedList') ? 'bg-violet-100 text-violet-700 shadow' : 'hover:bg-violet-50 text-gray-700'}`} aria-label="Numbered List" title="Numbered List"><ListOrdered size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-green-400 focus:outline-none ${editor.isActive('taskList') ? 'bg-green-100 text-green-700 shadow' : 'hover:bg-green-50 text-gray-700'}`} aria-label="Task List" title="Task List"><CheckSquare size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-gray-400 focus:outline-none ${editor.isActive('codeBlock') ? 'bg-gray-200 text-gray-900 shadow' : 'hover:bg-gray-100 text-gray-700'}`} aria-label="Code Block" title="Code Block"><Code size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-pink-400 focus:outline-none ${editor.isActive('blockquote') ? 'bg-pink-100 text-pink-700 shadow' : 'hover:bg-pink-50 text-gray-700'}`} aria-label="Blockquote" title="Blockquote"><Quote size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-gray-300 focus:outline-none hover:bg-gray-100 text-gray-700" aria-label="Horizontal Rule" title="Horizontal Rule"><Minus size={18} /></button>
        {/* Image upload */}
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-blue-400 focus:outline-none hover:bg-blue-50 text-blue-700" aria-label="Insert Image" title="Insert Image"><Upload size={18} /></button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]); }} />
        {/* Emoji picker */}
        <div className="relative">
          <button type="button" onClick={() => setShowEmoji(v => !v)} className="p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-yellow-400 focus:outline-none hover:bg-yellow-50 text-yellow-700" aria-label="Insert Emoji" title="Insert Emoji"><Smile size={18} /></button>
          {showEmoji && (
            <div className="absolute left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 w-64 max-h-64 overflow-y-auto animate-fade-in">
              <div className="flex items-center mb-2">
                <SearchIcon size={16} className="text-gray-400 mr-2" />
                <input type="text" className="w-full px-2 py-1 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-400 focus:outline-none" placeholder="Search emoji..." value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} />
                <button className="ml-2 p-1 rounded hover:bg-gray-100" onClick={() => setShowEmoji(false)} aria-label="Close emoji picker"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {filteredEmojis.map(e => (
                  <button key={e} className="text-xl p-1 rounded-lg hover:bg-violet-100 focus:bg-violet-200" onClick={() => { editor.chain().focus().insertContent(e).run(); setShowEmoji(false); setEmojiSearch(''); }} aria-label={e}>{e}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Undo/Redo */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className="p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-gray-400 focus:outline-none hover:bg-gray-100 text-gray-700" aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className="p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-gray-400 focus:outline-none hover:bg-gray-100 text-gray-700" aria-label="Redo" title="Redo (Ctrl+Y)"><Redo2 size={18} /></button>
        {/* Shortcuts/help */}
        <button type="button" onClick={() => setShowShortcuts(v => !v)} className="p-2 rounded-xl transition-all duration-150 focus:ring-2 focus:ring-violet-400 focus:outline-none hover:bg-violet-50 text-violet-700" aria-label="Show Shortcuts" title="Show Keyboard Shortcuts"><Info size={18} /></button>
        {showShortcuts && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-80 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-violet-700">Keyboard Shortcuts</span>
              <button className="p-1 rounded hover:bg-gray-100" onClick={() => setShowShortcuts(false)} aria-label="Close shortcuts"><X size={16} /></button>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><b>Bold:</b> Ctrl+B</li>
              <li><b>Italic:</b> Ctrl+I</li>
              <li><b>Underline:</b> Ctrl+U</li>
              <li><b>Undo:</b> Ctrl+Z</li>
              <li><b>Redo:</b> Ctrl+Y</li>
              <li><b>Bullet List:</b> Ctrl+Shift+8</li>
              <li><b>Numbered List:</b> Ctrl+Shift+7</li>
              <li><b>Task List:</b> Ctrl+Shift+9</li>
              <li><b>Insert Emoji:</b> : (type colon)</li>
              <li><b>Insert Image:</b> Drag & drop or click image button</li>
            </ul>
          </div>
        )}
      </div>
      {/* Drag overlay */}
      {isDragging && <div className="absolute inset-0 bg-violet-100/60 z-40 flex items-center justify-center pointer-events-none rounded-2xl"><span className="text-violet-700 text-lg font-bold">Drop image to upload</span></div>}
      {/* Editor content */}
      <div
        className="p-4 min-h-[180px] rounded-b-2xl bg-white/80 focus-within:ring-2 focus-within:ring-violet-400 transition-all duration-200"
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDrop={e => { setIsDragging(false); const files = e.dataTransfer?.files; if (files && files.length > 0) handleImageUpload(files[0]); }}
        tabIndex={0}
        aria-label="Rich text editor content"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;