'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Loader2, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

interface ChatTextAreaProps {
  onSendMessage: (message: Message) => void
  isGenerating: boolean
  className?: string
}

export function ChatTextArea({ onSendMessage, isGenerating, className }: ChatTextAreaProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 40) + 'px'
    }
  }

  const handleSubmit = () => {
    if (text.trim()) {
      const message: Message = {
        role: 'user',
        content: text.trim()
      }
      onSendMessage(message)
      setText('')
      // Reset height immediately after clearing
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        handleSubmit()
      } else if (!e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    adjustHeight()
  }

  return (
    <div className={cn("flex items-end space-x-3 p-6", className)}>
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          className="h-10 min-h-[40px] max-h-[200px] resize-none border-zinc-300 dark:border-zinc-600 focus:border-zinc-900 dark:focus:border-white focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 rounded-lg px-3 py-2 leading-tight"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!text.trim()}
        size="icon"
        className="h-10 w-10 shrink-0 bg-zinc-800 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-100 focus:ring-2 focus:ring-zinc-500/20 shadow-lg border-0 rounded-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-zinc-900"
      >
        {isGenerating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CornerDownLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}