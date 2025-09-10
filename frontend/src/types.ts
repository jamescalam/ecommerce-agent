export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ToolCall {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed'
  arguments?: string
  output?: string
}

export type ContentItem = 
  | { type: 'text'; content: string }
  | { type: 'tool'; toolCall: ToolCall }

export interface ChatOutput {
  id: string
  question: string
  isComplete: boolean
  content: ContentItem[]
  isUserOnly?: boolean
}