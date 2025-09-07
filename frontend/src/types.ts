export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ToolCall {
  name: string
  status: 'pending' | 'running' | 'completed'
  timestamp: number
}

export interface ChatOutput {
  id: string
  question: string
  response: string
  isComplete: boolean
  toolCalls: ToolCall[]
  isUserOnly?: boolean
}