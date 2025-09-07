'use client'

import { Button } from './ui/button'
import { RefreshCw, MessageSquare, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onNewChat: () => void
  className?: string
  showLogo?: boolean
}

export function Sidebar({ onNewChat, className, showLogo = false }: SidebarProps) {
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  return (
    <div className={cn(
      "w-16 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-4 space-y-4",
      className
    )}>
      {/* Logo at top */}
      <div className={`w-10 h-10 flex items-center justify-center mb-2 transition-all duration-500 ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <img 
          src="/pluto-light-icon.svg" 
          alt="Pluto" 
          className="w-8 h-8 dark:hidden"
        />
        <img 
          src="/pluto-dark-icon.svg" 
          alt="Pluto" 
          className="w-8 h-8 hidden dark:block"
        />
      </div>

      {/* Divider */}
      <div className="w-10 h-px bg-zinc-200 dark:bg-zinc-700" />

      {/* New Chat Button */}
      <Button
        onClick={onNewChat}
        variant="ghost"
        size="icon"
        className="relative group hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="New Conversation"
      >
        <RefreshCw className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
      </Button>

      {/* Current Chat indicator */}
      <Button
        variant="ghost"
        size="icon"
        className="relative bg-zinc-100 dark:bg-zinc-800"
        title="Current Conversation"
      >
        <MessageSquare className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle at bottom */}
      <Button
        onClick={toggleTheme}
        variant="ghost"
        size="icon"
        className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="Toggle theme"
      >
        <Sun className="h-4 w-4 text-zinc-600 dark:text-zinc-400 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 text-zinc-600 dark:text-zinc-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </div>
  )
}