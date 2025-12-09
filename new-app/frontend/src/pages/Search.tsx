import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Code, FileText, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { SearchResult } from '../types';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, []);

  useEffect(() => {
    Prism.highlightAll();
  }, [results]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Backend returns { query, count, results } wrapper
      interface BackendSearchResult {
        id: string;
        type: string;
        name: string;
        description?: string;
        relevance: number;
        matches: Array<{ field: string; snippet: string }>;
      }
      interface SearchResponse {
        query: string;
        count: number;
        results: BackendSearchResult[];
      }

      const response = await api.get<SearchResponse>('/entities/search', { q: query });

      // Map backend response to frontend SearchResult format
      const mappedResults: SearchResult[] = response.results.map((result) => ({
        entityId: result.id,
        entityName: result.name,
        entityType: result.type,
        matchedCode: result.matches?.[0]?.snippet || result.description || '',
        context: result.description,
        lineNumber: undefined,
      }));

      setResults(mappedResults);
      setSearchParams({ q: query });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dataset':
        return Database;
      case 'dashboard':
        return FileText;
      default:
        return Code;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dataset':
        return 'primary';
      case 'dashboard':
        return 'info';
      case 'monitor':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">OPAL Code Search</h1>
        <p className="text-gray-600 mt-2">Search through dataset pipelines and queries</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search OPAL code, dataset names, queries..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <SearchIcon className="w-4 h-4" />
                Search
              </button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading */}
      {loading && <LoadingSpinner size="lg" className="h-48" />}

      {/* Results */}
      {!loading && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
          </div>

          {results.map((result, index) => {
            const Icon = getEntityIcon(result.entityType);
            return (
              <motion.div
                key={`${result.entityId}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{result.entityName}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getEntityColor(result.entityType) as any}>
                              {result.entityType}
                            </Badge>
                            {result.lineNumber && (
                              <span className="text-xs text-gray-500">
                                Line {result.lineNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="rounded-lg overflow-x-auto">
                      <code className="language-sql text-sm">{result.matchedCode}</code>
                    </pre>
                    {result.context && (
                      <p className="text-sm text-gray-600 mt-3 border-l-2 border-gray-300 pl-3">
                        {result.context}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* No Results */}
      {!loading && query && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No results found for "{query}"</p>
          <p className="text-sm text-gray-400 mt-2">Try different search terms</p>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !query && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Start by entering a search query</p>
          <p className="text-sm text-gray-400 mt-2">
            Search for OPAL code, dataset names, or specific queries
          </p>
        </motion.div>
      )}
    </div>
  );
}
