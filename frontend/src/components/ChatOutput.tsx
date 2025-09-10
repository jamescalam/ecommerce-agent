'use client'

import { Card, CardContent } from './ui/card'
import { cn } from '@/lib/utils'
import type { ChatOutput, ToolCall, ContentItem } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeRenderer } from './CodeRenderer'
import { Badge } from './ui/badge'
import { useState, useEffect } from 'react'

interface ChatOutputProps {
  output: ChatOutput
  className?: string
}

function ThinkingIndicator({ hasContent, isComplete }: { hasContent: boolean, isComplete: boolean }) {
  const [charIndex, setCharIndex] = useState(0)
  const thinkingChars = ['✧', '✦', '✴', '✳', '✻', '✽', '✿', '❀']
  
  useEffect(() => {
    if (isComplete) return
    
    const interval = setInterval(() => {
      setCharIndex(prev => (prev + 1) % thinkingChars.length)
    }, 200)
    
    return () => clearInterval(interval)
  }, [isComplete, thinkingChars.length])
  
  // Show ">" when content exists and complete, thinking chars when still loading
  if (isComplete && hasContent) {
    return <span className="text-zinc-600 dark:text-zinc-400 font-mono text-sm">{'>'}</span>
  } else if (!isComplete) {
    return <span className="text-zinc-600 dark:text-zinc-400 font-bold text-sm animate-pulse">{thinkingChars[charIndex]}</span>
  }
  
  return null
}

export function ChatOutput({ output, className }: ChatOutputProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  
  const toggleToolExpansion = (toolName: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toolName)) {
        newSet.delete(toolName)
      } else {
        newSet.add(toolName)
      }
      return newSet
    })
  }
  
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
      <div className="space-y-4">
        {/* Render content in order */}
        {output.content && output.content.map((item, index) => {
          if (item.type === 'text') {
            return (
              <div key={index} className="flex justify-start items-start">
                {/* Show indicator only for text content */}
                <div className="flex-shrink-0 pt-[1.25rem] mr-2">
                  {output.isComplete ? (
                    <span className="text-zinc-600 dark:text-zinc-400 font-mono text-sm">{'>'}</span>
                  ) : index === output.content.length - 1 ? (
                    <ThinkingIndicator hasContent={true} isComplete={false} />
                  ) : (
                    <span className="text-zinc-600 dark:text-zinc-400 font-mono text-sm">{'>'}</span>
                  )}
                </div>
                <div className="max-w-[70%] p-5">
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
                        },
                        table({ children }: any) {
                          return (
                            <div className="overflow-x-auto -mx-5 px-5">
                              <table className="min-w-full">{children}</table>
                            </div>
                          )
                        },
                        pre({ children }: any) {
                          return (
                            <pre className="overflow-x-auto">{children}</pre>
                          )
                        }
                      }}
                    >
                      {item.content || ' '}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )
          } else if (item.type === 'tool') {
            const toolCall = item.toolCall
            const isExpanded = expandedTools.has(toolCall.id)
            return (
              <div key={toolCall.id} className="flex justify-start items-start">
                {/* No indicator for tool calls */}
                <div className="flex-shrink-0 pt-[1.25rem] mr-2">
                  <span className="text-transparent text-sm">{'>'}</span>
                </div>
                <div className="max-w-[70%] p-5">
                  <button
                    onClick={() => toggleToolExpansion(toolCall.id)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-opacity-80 transition-colors text-sm font-medium ${
                      toolCall.status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{toolCall.name}</span>
                    {toolCall.status === 'running' && (
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    )}
                    {toolCall.status === 'completed' && (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    )}
                    {(toolCall.arguments || toolCall.output) && (
                      <svg 
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  {isExpanded && (toolCall.arguments || toolCall.output) && (
                    <div className="mt-2 ml-4 space-y-3">
                      {toolCall.arguments && (
                        <div>
                          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Arguments:</div>
                          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-mono max-h-48 overflow-auto">
                            <pre className="text-zinc-700 dark:text-zinc-300">
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(toolCall.arguments), null, 2)
                                } catch {
                                  return toolCall.arguments
                                }
                              })()}
                            </pre>
                          </div>
                        </div>
                      )}
                      {toolCall.output && (
                        <div>
                          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Output:</div>
                          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-mono max-h-48 overflow-auto">
                            <pre className="text-zinc-700 dark:text-zinc-300">
                              {toolCall.output}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
