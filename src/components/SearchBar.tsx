import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = "搜索工具...",
  className
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [localQuery, onSearchChange])

  // Sync with external changes
  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  const handleClear = () => {
    setLocalQuery('')
    onSearchChange('')
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {localQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}