import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, debounce } from '@/utils';
import { Button } from '@/components/ui/Button';

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Mock search results for demonstration
interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'team' | 'user';
  title: string;
  subtitle?: string;
  href: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'task',
    title: 'Fix login bug',
    subtitle: 'In Development Project',
    href: '/tasks/1',
  },
  {
    id: '2',
    type: 'project',
    title: 'Website Redesign',
    subtitle: '12 tasks • 5 members',
    href: '/projects/2',
  },
  {
    id: '3',
    type: 'team',
    title: 'Frontend Team',
    subtitle: '8 members',
    href: '/teams/3',
  },
];

export interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  className,
  placeholder = "Search tasks, projects, teams..." 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      
      // Escape to close
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const filteredResults = mockSearchResults.filter(result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filteredResults);
      setLoading(false);
    }, 300);
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    debouncedSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.href);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '📋';
      case 'project':
        return '📁';
      case 'team':
        return '👥';
      case 'user':
        return '👤';
      default:
        return '🔍';
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'Task';
      case 'project':
        return 'Project';
      case 'team':
        return 'Team';
      case 'user':
        return 'User';
      default:
        return '';
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full h-9 pl-9 pr-9 rounded-md border border-input bg-background text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-colors"
          )}
        />
        
        {/* Clear button */}
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            aria-label="Clear search"
          >
            <XIcon className="h-3 w-3" />
          </Button>
        )}

        {/* Keyboard shortcut hint */}
        {!query && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}
      </div>

      {/* Search results dropdown */}
      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 animate-slide-down">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1 max-h-64 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <span className="text-lg">{getResultIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {getResultTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <SearchIcon className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                No results found for "{query}"
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;