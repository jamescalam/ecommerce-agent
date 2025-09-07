'use client'

import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'

interface CodeRendererProps {
  code: string
  language?: string
}

export function CodeRenderer({ 
  code, 
  language = 'typescript'
}: CodeRendererProps) {
  const [html, setHtml] = useState<string>('')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const highlightCode = async () => {
      const theme = isDark ? 'github-dark' : 'github-light'
      try {
        let highlighted = await codeToHtml(code, {
          lang: language,
          theme,
        })
        setHtml(highlighted)
      } catch (error) {
        // Fallback if language is not supported
        let fallback = await codeToHtml(code, {
          lang: 'text',
          theme,
        })
        setHtml(fallback)
      }
    }

    highlightCode()
  }, [code, language, isDark])

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: html }}
      className="[&>pre]:bg-zinc-50 [&>pre]:dark:bg-zinc-900 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:border-0"
    />
  )
}