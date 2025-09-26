import { useEffect } from 'react'

interface KeyboardShortcutsOptions {
  onSearchFocus?: () => void
  onEscape?: () => void
  categories?: Array<{ id: string; name: string; key?: string }>
  onCategorySelect?: (categoryId: string) => void
}

export function useKeyboardShortcuts({
  onSearchFocus,
  onEscape,
  categories = [],
  onCategorySelect
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in input fields
      const target = event.target as HTMLElement
      const isInputElement = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.isContentEditable

      // Handle Escape key - always works
      if (event.key === 'Escape') {
        onEscape?.()
        return
      }

      // Skip other shortcuts if typing in input
      if (isInputElement) return

      // Prevent default for handled shortcuts
      switch (event.key) {
        case '/':
          event.preventDefault()
          onSearchFocus?.()
          break

        // Number keys for categories (1-9)
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const index = parseInt(event.key) - 1
          if (index < categories.length) {
            event.preventDefault()
            onCategorySelect?.(categories[index].id)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onSearchFocus, onEscape, categories, onCategorySelect])
}