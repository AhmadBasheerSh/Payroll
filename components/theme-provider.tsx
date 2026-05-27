'use client'

import * as React from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  enableColorScheme?: boolean
  storageKey?: string
  themes?: Array<Theme>
  disableTransitionOnChange?: boolean
}

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  themes: Theme[]
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)
const SYSTEM_THEME_MEDIA = '(prefers-color-scheme: dark)'
const DEFAULT_STORAGE_KEY = 'theme'
const DEFAULT_ATTRIBUTE = 'data-theme'
const DEFAULT_THEMES: Theme[] = ['light', 'dark']

function getSystemTheme() {
  return window.matchMedia(SYSTEM_THEME_MEDIA).matches ? 'dark' : 'light'
}

function getStoredTheme(storageKey: string, defaultTheme: Theme) {
  if (typeof window === 'undefined') return defaultTheme

  try {
    const storedValue = localStorage.getItem(storageKey)
    return storedValue === 'light' || storedValue === 'dark' || storedValue === 'system'
      ? storedValue
      : defaultTheme
  } catch {
    return defaultTheme
  }
}

function applyTheme(
  theme: Theme,
  attribute: string,
  enableColorScheme: boolean,
  resolvedTheme: 'light' | 'dark',
  themes: string[]
) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const themeValue = theme === 'system' ? resolvedTheme : theme

  if (attribute === 'class') {
    root.classList.remove(...themes.filter(t => t !== 'system'))
    root.classList.add(themeValue)
  } else {
    root.setAttribute(attribute, themeValue)
  }

  if (enableColorScheme) {
    root.style.colorScheme = resolvedTheme
  }
}

function useDisableTransitionOnChange() {
  const cleanupRef = React.useRef<(() => void) | null>(null)

  return React.useCallback((disable: boolean) => {
    if (!disable || typeof document === 'undefined') return

    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    const style = document.createElement('style')
    style.textContent = '* { transition: none !important; }'
    document.head.appendChild(style)

    cleanupRef.current = () => {
      requestAnimationFrame(() => {
        style.remove()
      })
    }
  }, [])
}

export function ThemeProvider({
  children,
  attribute = DEFAULT_ATTRIBUTE,
  defaultTheme = 'light',
  enableSystem = true,
  enableColorScheme = true,
  storageKey = DEFAULT_STORAGE_KEY,
  themes = DEFAULT_THEMES,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(() =>
    defaultTheme === 'dark' ? 'dark' : 'light'
  )
  const [mounted, setMounted] = React.useState(false)
  const disableTransition = useDisableTransitionOnChange()

  React.useEffect(() => {
    const initialTheme = getStoredTheme(storageKey, defaultTheme)
    setTheme(initialTheme)

    const actualTheme =
      initialTheme === 'system' && enableSystem
        ? getSystemTheme()
        : initialTheme === 'dark'
        ? 'dark'
        : 'light'

    setResolvedTheme(actualTheme)
    applyTheme(initialTheme, attribute, enableColorScheme, actualTheme, themes)

    setMounted(true)
  }, [attribute, defaultTheme, enableColorScheme, enableSystem, storageKey, themes])

  React.useEffect(() => {
    if (!mounted) return

    const nextResolvedTheme =
      theme === 'system' && enableSystem
        ? getSystemTheme()
        : theme === 'dark'
        ? 'dark'
        : 'light'

    if (disableTransitionOnChange) {
      disableTransition(true)
    }

    setResolvedTheme(nextResolvedTheme)
    applyTheme(theme, attribute, enableColorScheme, nextResolvedTheme, themes)

    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // ignore write failures
    }
  }, [theme, mounted, enableColorScheme, enableSystem, attribute, storageKey, themes, disableTransitionOnChange, disableTransition])

  React.useEffect(() => {
    if (typeof window === 'undefined' || !enableSystem) return

    const mediaQuery = window.matchMedia(SYSTEM_THEME_MEDIA)
    const onChange = () => {
      if (theme !== 'system') return

      const nextResolvedTheme = getSystemTheme()
      setResolvedTheme(nextResolvedTheme)
      applyTheme(theme, attribute, enableColorScheme, nextResolvedTheme, themes)
    }

    mediaQuery.addEventListener?.('change', onChange)
    return () => {
      mediaQuery.removeEventListener?.('change', onChange)
    }
  }, [theme, enableSystem, attribute, enableColorScheme, themes])

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return
      const nextTheme =
        event.newValue === 'light' || event.newValue === 'dark' || event.newValue === 'system'
          ? event.newValue
          : defaultTheme
      setTheme(nextTheme)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [defaultTheme, storageKey])

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      themes: enableSystem ? [...DEFAULT_THEMES, 'system'] : DEFAULT_THEMES,
    }),
    [theme, resolvedTheme, enableSystem]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
