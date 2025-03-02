
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import HighlightCard from '@/components/HighlightCard';
import { Toaster } from '@/components/ui/sonner';
import { searchHighlightsWithFallback } from '@/services/fallbackService';
import { MatchHighlight } from '@/types';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<MatchHighlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchHighlights = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Searching highlights for:', searchQuery);
      const results = await searchHighlightsWithFallback(searchQuery);
      console.log('Search results:', results.length);
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching highlights:', error);
      setError('Failed to search highlights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      searchHighlights(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
    searchHighlights(query);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      <Toaster position="top-center" />
      
      <main className="pt-20 pb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Search Highlights</h1>
          
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search for teams, matches, or competitions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-highlight-800 border-highlight-700 text-white pl-10 h-12"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-highlight-500 hover:bg-highlight-600 text-white h-12"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} className="mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>
          
          {error ? (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <p className="text-red-100">{error}</p>
              </div>
            </div>
          ) : null}
          
          {searchResults.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold mb-4">
                Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{initialQuery}"
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((highlight) => (
                  <HighlightCard key={highlight.id} highlight={highlight} />
                ))}
              </div>
            </>
          ) : initialQuery && !loading ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400 mb-2">No highlights found for "{initialQuery}"</p>
              <p className="text-sm text-gray-500">Try searching for different teams or competitions</p>
            </div>
          ) : !initialQuery && !loading ? (
            <div className="text-center py-16">
              <p className="text-gray-400">Enter a search term to find football highlights</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
