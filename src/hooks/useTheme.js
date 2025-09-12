import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Get theme from localStorage or system preference
    const saved = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = saved || (systemPrefersDark ? 'dark' : 'light')
    
    setTheme(initialTheme)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.style.colorScheme = theme
      localStorage.setItem('theme', theme)
    } catch (error) {
      console.error('Error setting theme:', error)
    }
  }, [theme, mounted])

  return { theme, setTheme, mounted }
}
