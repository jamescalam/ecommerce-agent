'use client'

import { Card, CardContent } from './ui/card'
import { cn } from '@/lib/utils'
import type { ChatOutput, ToolCall } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeRenderer } from './CodeRenderer'
import { Badge } from './ui/badge'
import { useState, useEffect } from 'react'

interface ChatOutputProps {
  output: ChatOutput
  className?: string
}

function ThinkingIndicator({ hasResponse, isComplete }: { hasResponse: boolean, isComplete: boolean }) {
  const [charIndex, setCharIndex] = useState(0)
  const thinkingChars = ['✧', '✦', '✴', '✳', '✻', '✽', '✿', '❀']
  
  useEffect(() => {
    if (hasResponse) return
    
    const interval = setInterval(() => {
      setCharIndex(prev => (prev + 1) % thinkingChars.length)
    }, 200)
    
    return () => clearInterval(interval)
  }, [hasResponse, thinkingChars.length])
  
  if (hasResponse || isComplete) {
    return <span className="text-white font-bold text-sm">></span>
  }
  
  return <span className="text-white font-bold text-sm">{thinkingChars[charIndex]}</span>
}

export function ChatOutput({ output, className }: ChatOutputProps) {
  if (output.isUserOnly) {
    // Only show user message for user-only outputs
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex justify-end items-start">
          <div className="max-w-[70%]">
            <Card className="bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 shadow-lg border-0">
              <CardContent className="px-4 py-3">
                <p className="text-sm leading-relaxed">{output.question}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* User Question (only if not user-only and has question) */}
      {output.question && (
        <div className="flex justify-end items-start">
          <div className="max-w-[70%]">
            <Card className="bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 shadow-lg border-0">
              <CardContent className="px-4 py-3">
                <p className="text-sm leading-relaxed">{output.question}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Assistant Response */}
      <div className="flex justify-start items-start">
        {/* Thinking indicator column */}
        <div className="flex-shrink-0 pt-[1.25rem]">
          <ThinkingIndicator hasResponse={!!output.response} isComplete={output.isComplete} />
        </div>
        
        {/* Content column */}
        <div className="max-w-[70%] p-5">
          {/* Tool Call Indicators */}
          {output.toolCalls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {output.toolCalls.map((toolCall) => (
                <Badge
                  key={`${toolCall.name}-${toolCall.timestamp}`}
                  variant="secondary"
                  className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {toolCall.name}
                  {toolCall.status === 'running' && (
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          )}

          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-zinc-800 dark:prose-headings:text-zinc-200 prose-p:text-zinc-700 dark:prose-p:text-zinc-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }: any) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {output.response || ' '}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}