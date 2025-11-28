'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SearchResult } from '@/types';

interface SearchBoxProps {
  onSelect: (lng: number, lat: number, name: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBox({ onSelect, placeholder = "도시, 장소 검색...", className = "" }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocation = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('Mapbox token is not configured');
      return;
    }

    setIsLoading(true);
    try {
      // 검색어 인코딩 및 한글 지원
      const encodedQuery = encodeURIComponent(searchQuery);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
        `access_token=${token}&` +
        `limit=5&` +
        `language=ko&` +  // 한글 결과 우선
        `types=place,locality,neighborhood,address,poi`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        setResults(
          data.features.map((f: { id: string; place_name: string; center: [number, number] }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          }))
        );
        setIsOpen(true);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Debounce - 300ms 후 검색
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchLocation(value);
    }, 300);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.place_name.split(',')[0]); // 첫 번째 부분만 표시
    setIsOpen(false);
    setResults([]);
    onSelect(result.center[0], result.center[1], result.place_name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {/* 검색 아이콘 */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pl-10 pr-10 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg 
                     text-white placeholder-gray-500 focus:outline-none focus:border-[#4264fb]
                     transition-colors text-sm"
        />

        {/* 로딩/클리어 버튼 */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-[#4264fb] border-t-transparent rounded-full animate-spin" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-[#1a1a24] border border-[#3a3a4a] rounded-lg overflow-hidden shadow-xl z-50 max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 text-left text-sm transition-colors 
                         border-b border-[#3a3a4a] last:border-0
                         ${index === selectedIndex
                           ? 'bg-[#4264fb]/20 text-white'
                           : 'text-gray-300 hover:bg-[#2a2a3a]'
                         }`}
            >
              <span className="flex items-start gap-3">
                <svg
                  className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="flex-1">
                  <span className="block text-white">{result.place_name.split(',')[0]}</span>
                  {result.place_name.includes(',') && (
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {result.place_name.split(',').slice(1).join(',').trim()}
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-[#1a1a24] border border-[#3a3a4a] rounded-lg overflow-hidden shadow-xl z-50">
          <div className="px-4 py-6 text-center">
            <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">검색 결과가 없습니다</p>
            <p className="text-xs text-gray-600 mt-1">다른 검색어를 시도해보세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
