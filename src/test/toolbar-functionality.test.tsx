import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock @dnd-kit modules
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  arrayMove: vi.fn(),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('Toolbar Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  const setupNoteForEditing = async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Switch to Notes tab
    await user.click(screen.getByText('Notes'))
    
    // Add a new note
    await user.click(screen.getByLabelText('Add new item'))
    
    // Get the textarea
    const textarea = screen.getByPlaceholderText(/Start writing your note/) as HTMLTextAreaElement
    
    return { user, textarea }
  }

  it('bold button adds bold markdown when text is selected', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Type some text
    await user.type(textarea, 'test text')
    
    // Select "test"
    textarea.setSelectionRange(0, 4)
    fireEvent.select(textarea)
    
    // Click bold button
    const boldButton = screen.getByTitle('Bold (Ctrl+B)')
    await user.click(boldButton)
    
    // Check if bold markdown was applied
    expect(textarea.value).toBe('**test** text')
  })

  it('bold button adds bold markdown placeholders when no text is selected', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Type some text and position cursor
    await user.type(textarea, 'Hello ')
    
    // Click bold button
    const boldButton = screen.getByTitle('Bold (Ctrl+B)')
    await user.click(boldButton)
    
    // Check if bold placeholders were added
    expect(textarea.value).toBe('Hello ****')
    
    // Check cursor position is between the asterisks
    expect(textarea.selectionStart).toBe(8) // Position between **|**
  })

  it('italic button works correctly', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Type and select text
    await user.type(textarea, 'italic text')
    textarea.setSelectionRange(0, 6) // Select "italic"
    fireEvent.select(textarea)
    
    // Click italic button
    const italicButton = screen.getByTitle('Italic (Ctrl+I)')
    await user.click(italicButton)
    
    expect(textarea.value).toBe('*italic* text')
  })

  it('heading button toggles heading format', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Type a line
    await user.type(textarea, 'My heading')
    
    // Click heading button
    const headingButton = screen.getByTitle('Heading')
    await user.click(headingButton)
    
    expect(textarea.value).toBe('# My heading')
    
    // Click again to remove heading
    await user.click(headingButton)
    
    expect(textarea.value).toBe('My heading')
  })

  it('bullet list button adds bullet point', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Click bullet button at start
    const bulletButton = screen.getByTitle('Bullet List')
    await user.click(bulletButton)
    
    expect(textarea.value).toBe('- ')
    expect(textarea.selectionStart).toBe(2) // Cursor after "- "
  })

  it('bullet list button adds new line with bullet when not at start', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Type some text first
    await user.type(textarea, 'Some text')
    
    // Click bullet button
    const bulletButton = screen.getByTitle('Bullet List')
    await user.click(bulletButton)
    
    expect(textarea.value).toBe('Some text\n- ')
    expect(textarea.selectionStart).toBe(12) // Cursor after "\n- "
  })

  it('todo list button adds todo checkbox', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Click todo button
    const todoButton = screen.getByTitle('Todo List')
    await user.click(todoButton)
    
    expect(textarea.value).toBe('- [ ] ')
    expect(textarea.selectionStart).toBe(6) // Cursor after "- [ ] "
  })

  it('todo list button adds new line with todo when not at start', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Type some text first
    await user.type(textarea, 'Some text')
    
    // Click todo button
    const todoButton = screen.getByTitle('Todo List')
    await user.click(todoButton)
    
    expect(textarea.value).toBe('Some text\n- [ ] ')
    expect(textarea.selectionStart).toBe(16) // Cursor after "\n- [ ] "
  })

  it('toolbar buttons preserve focus on textarea', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Type some text and ensure textarea has focus
    await user.type(textarea, 'test')
    expect(document.activeElement).toBe(textarea)
    
    // Click bold button
    const boldButton = screen.getByTitle('Bold (Ctrl+B)')
    await user.click(boldButton)
    
    // Textarea should still have focus
    expect(document.activeElement).toBe(textarea)
  })

  it('multiple toolbar operations work in sequence', async () => {
    const { user, textarea } = await setupNoteForEditing()
    
    // Add a heading
    const headingButton = screen.getByTitle('Heading')
    await user.click(headingButton)
    
    // Type heading text
    await user.type(textarea, 'Main Title')
    
    // Move to new line
    await user.keyboard('{Enter}{Enter}')
    
    // Add a bullet point
    const bulletButton = screen.getByTitle('Bullet List')
    await user.click(bulletButton)
    
    // Type bullet text
    await user.type(textarea, 'First item')
    
    // Move to new line and add todo
    await user.keyboard('{Enter}')
    const todoButton = screen.getByTitle('Todo List')
    await user.click(todoButton)
    
    // Type todo text
    await user.type(textarea, 'Todo item')
    
    const expectedContent = '# Main Title\n\n- First item\n- [ ] Todo item'
    expect(textarea.value).toBe(expectedContent)
  })

  it('toolbar shows only when note is in edit mode', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Switch to Notes tab
    await user.click(screen.getByText('Notes'))
    
    // Initially no toolbar should be visible
    expect(screen.queryByTitle('Bold (Ctrl+B)')).not.toBeInTheDocument()
    
    // Add a new note - toolbar should appear
    await user.click(screen.getByLabelText('Add new item'))
    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument()
    
    // Type some content and save by clicking away
    const textarea = screen.getByPlaceholderText(/Start writing your note/)
    await user.type(textarea, 'Test content')
    await user.tab() // This should save and exit edit mode
    
    // Toolbar should be hidden again
    await waitFor(() => {
      expect(screen.queryByTitle('Bold (Ctrl+B)')).not.toBeInTheDocument()
    })
  })
}) 