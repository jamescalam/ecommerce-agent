'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatTextArea } from '@/components/ChatTextArea'
import { ChatOutput } from '@/components/ChatOutput'
import { Sidebar } from '@/components/Sidebar'
import type { Message, ChatOutput as ChatOutputType } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [outputs, setOutputs] = useState<ChatOutputType[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSidebarLogo, setShowSidebarLogo] = useState(false)
  const [messageQueue, setMessageQueue] = useState<Message[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [outputs])

  // Handle logo animation when first message is sent
  useEffect(() => {
    if (outputs.length > 0 && !showSidebarLogo) {
      // Wait for center logo to fade out, then show sidebar logo
      const timer = setTimeout(() => {
        setShowSidebarLogo(true)
      }, 300) // Half of the fade duration for smooth transition
      return () => clearTimeout(timer)
    }
  }, [outputs.length, showSidebarLogo])

  const processMessages = useCallback(async (messages: Message[]) => {
    // Create separate chat outputs for each message (user messages)
    const userOutputs = messages.map((message) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      question: message.content,
      isComplete: true,
      content: [],
      isUserOnly: true
    }))

    // Create a single response output for the AI
    const responseOutputId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const responseOutput = {
      id: responseOutputId,
      question: '',
      isComplete: false,
      content: [],
      isUserOnly: false
    }

    // Add all user messages and the AI response output
    setOutputs(prev => [...prev, ...userOutputs, responseOutput])
    const outputIds = [responseOutputId]

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let currentTextBuffer = ''
      let isStreamingTool = false
      let hasStartedTextStreaming = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data && data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data)
                const outputId = outputIds[0] // Single response output
                
                // Handle tool_call events - create new tool (but ignore if text already started)
                if (parsed.type === 'tool_call' && parsed.params && !hasStartedTextStreaming) {
                  // Flush any pending text before tool (but keep it in buffer)
                  if (currentTextBuffer) {
                    setOutputs(prev => prev.map(output => {
                      if (output.id === outputId) {
                        const lastTextIndex = output.content.findLastIndex(item => item.type === 'text')
                        if (lastTextIndex >= 0) {
                          const updatedContent = [...output.content]
                          updatedContent[lastTextIndex] = { type: 'text', content: currentTextBuffer }
                          return { ...output, content: updatedContent }
                        } else {
                          return { ...output, content: [...output.content, { type: 'text', content: currentTextBuffer }] }
                        }
                      }
                      return output
                    }))
                    // Don't clear the buffer - we've already saved the text
                  }
                  
                  isStreamingTool = true
                  // Reset buffer for any text that comes after the tool
                  currentTextBuffer = ''
                  const newToolCall = {
                    id: parsed.params.id,
                    name: parsed.params.name,
                    status: 'running' as const,
                    arguments: ''
                  }
                  
                  setOutputs(prev => prev.map(output => 
                    output.id === outputId 
                      ? { ...output, content: [...output.content, { type: 'tool', toolCall: newToolCall }] }
                      : output
                  ))
                }
                
                // Handle tool_args events - append arguments (ignore if text already started)
                else if (parsed.type === 'tool_args' && parsed.params && !hasStartedTextStreaming) {
                  const toolId = parsed.params.id // Assuming you'll add this
                  const args = parsed.params.arguments || ''
                  
                  setOutputs(prev => prev.map(output => {
                    if (output.id === outputId) {
                      return {
                        ...output,
                        content: output.content.map(item => 
                          item.type === 'tool' && item.toolCall.id === toolId
                            ? { ...item, toolCall: { ...item.toolCall, arguments: (item.toolCall.arguments || '') + args } }
                            : item
                        )
                      }
                    }
                    return output
                  }))
                }
                
                // Handle tool_output events - complete tool with output (ignore if text already started)
                else if (parsed.type === 'tool_output' && parsed.params && !hasStartedTextStreaming) {
                  isStreamingTool = false
                  
                  setOutputs(prev => prev.map(output => {
                    if (output.id === outputId) {
                      return {
                        ...output,
                        content: output.content.map(item => 
                          item.type === 'tool' && item.toolCall.id === parsed.params.id
                            ? { 
                                ...item, 
                                toolCall: { 
                                  ...item.toolCall, 
                                  output: parsed.params.output, 
                                  status: 'completed' as const 
                                } 
                              }
                            : item
                        )
                      }
                    }
                    return output
                  }))
                }
                
                // Handle text streaming via callback events
                else if (parsed.type === 'callback' && typeof parsed.token === 'string') {
                  currentTextBuffer += parsed.token
                  hasStartedTextStreaming = true // Mark that text streaming has begun
                  
                  // Always update the UI with text, even during tool streaming
                  setOutputs(prev => prev.map(output => {
                    if (output.id === outputId) {
                      // Check if we need to create a new text item or update existing
                      const contents = [...output.content]
                      const lastIndex = contents.length - 1
                      const lastItem = contents[lastIndex]
                      
                      // If the last item is a text item and we're not in tool streaming, update it
                      // If we're in tool streaming or last item is not text, create new text item
                      if (!isStreamingTool && lastItem?.type === 'text') {
                        contents[lastIndex] = { type: 'text', content: currentTextBuffer }
                      } else if (isStreamingTool || lastItem?.type !== 'text') {
                        // Add new text content after the tool
                        contents.push({ type: 'text', content: currentTextBuffer })
                        isStreamingTool = false // Reset flag since we're now streaming text
                      }
                      
                      return { ...output, content: contents }
                    }
                    return output
                  }))
                }
                
                // Handle end_node events to reset state
                else if (parsed.type === 'end_node') {
                  if (parsed.token === 'llm') {
                    // Reset text streaming flag when LLM node ends
                    hasStartedTextStreaming = false
                  } else {
                    // Reset tool streaming for tool nodes
                    isStreamingTool = false
                  }
                }
                
                // Handle start_node events to reset state
                else if (parsed.type === 'start_node' && parsed.token === 'llm') {
                  // Reset flags when a new LLM node starts
                  hasStartedTextStreaming = false
                  isStreamingTool = false
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e)
              }
            }
          }
        }
      }

      // Flush any remaining text buffer and mark complete
      const outputId = outputIds[0]
      if (currentTextBuffer) {
        setOutputs(prev => prev.map(output => {
          if (output.id === outputId) {
            const lastTextIndex = output.content.findLastIndex(item => item.type === 'text')
            
            if (lastTextIndex >= 0) {
              const updatedContent = [...output.content]
              updatedContent[lastTextIndex] = { type: 'text', content: currentTextBuffer }
              return { ...output, content: updatedContent, isComplete: true }
            } else {
              return { 
                ...output, 
                content: [...output.content, { type: 'text', content: currentTextBuffer }],
                isComplete: true
              }
            }
          }
          return output
        }))
      } else {
        // Just mark as complete
        setOutputs(prev => prev.map(output => 
          output.id === outputId 
            ? { ...output, isComplete: true }
            : output
        ))
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Update all outputs with error message
      setOutputs(prev => prev.map(output => 
        outputIds.includes(output.id) 
          ? { 
              ...output, 
              content: [...output.content, { type: 'text', content: 'Sorry, there was an error processing your request. Please try again.' }],
              isComplete: true 
            }
          : output
      ))
    } finally {
      // Don't set isGenerating to false here - let sendMessage handle it
    }
  }, [])

  const sendMessage = useCallback(async (message: Message) => {
    if (isGenerating) {
      // Add to queue if AI is currently responding
      setMessageQueue(prev => [...prev, message])
      return
    }

    setIsGenerating(true)
    
    // Process current message and all queued messages
    const messagesToProcess = [message, ...messageQueue]
    setMessageQueue([]) // Clear the queue
    
    try {
      await processMessages(messagesToProcess)
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, messageQueue, processMessages])

  // Process queued messages when generation completes
  useEffect(() => {
    if (!isGenerating && messageQueue.length > 0) {
      const queuedMessages = [...messageQueue]
      setMessageQueue([])
      setIsGenerating(true)
      
      processMessages(queuedMessages).finally(() => {
        setIsGenerating(false)
      })
    }
  }, [isGenerating, messageQueue, processMessages])

  const handleNewChat = () => {
    setOutputs([])
    setIsGenerating(false)
    setShowSidebarLogo(false)
    setMessageQueue([])
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar onNewChat={handleNewChat} showLogo={showSidebarLogo} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 relative">
            {/* Welcome Screen with fade out */}
            {outputs.length === 0 && (
              <div className={`flex items-center justify-center h-full pt-8 transition-all duration-500 ${isGenerating ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto">
                    <img 
                      src="/pluto-light-icon.svg" 
                      alt="Pluto" 
                      className="w-full h-full dark:hidden"
                    />
                    <img 
                      src="/pluto-dark-icon.svg" 
                      alt="Pluto" 
                      className="w-full h-full hidden dark:block"
                    />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                    Start a conversation by typing a message below. I can help answer questions, explain concepts, or assist with various tasks.
                  </p>
                </div>
              </div>
            )}
            
            {/* Chat Messages with fade in */}
            {outputs.length > 0 && (
              <div className="space-y-8 max-w-4xl mx-auto py-8 animate-fadeIn">
                {outputs.map((output) => (
                  <ChatOutput key={output.id} output={output} />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <div className="px-6 max-w-4xl mx-auto">
              {messageQueue.length > 0 && (
                <div className="mb-3 text-center">
                  <div className="inline-flex items-center space-x-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-2 rounded-lg text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{messageQueue.length} message{messageQueue.length > 1 ? 's' : ''} queued</span>
                  </div>
                </div>
              )}
              <ChatTextArea
                onSendMessage={sendMessage}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}