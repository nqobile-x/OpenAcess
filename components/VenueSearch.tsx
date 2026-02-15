import React, { useState } from 'react';
import { UserProfile, Venue } from '../types';
import { searchVenues } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface Props {
  profile: UserProfile;
}

export default function VenueSearch({ profile }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{text: string, places: any[]} | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      // Mock location for "Joburg/Gauteng" bias if geo not available
      const gautengLoc = { lat: -26.2041, lng: 28.0473 };
      
      const response = await searchVenues(query, gautengLoc);
      setResults(response);
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="sticky top-0 z-10 bg-white p-4 shadow-sm border-b border-slate-100">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places (e.g., 'Wheelchair friendly cafes in Rosebank')"
            className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
          <span className="material-symbols-outlined absolute left-3 top-3.5 text-slate-400">search</span>
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bg-blue-600 text-white p-1.5 rounded-lg disabled:opacity-50"
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">arrow_forward</span>}
          </button>
        </form>
        
        {/* Quick Filters based on profile */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
             {profile.mobility.wheelchair && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">Wheelchair Accessible</span>}
             {profile.sensory.lowNoise && <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium whitespace-nowrap">Low Noise</span>}
             {profile.other.accessibleRestroom && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">Restroom</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
            </div>
        )}

        {!results && !loading && (
            <div className="text-center mt-10 opacity-60">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">map_search</span>
                <p className="text-slate-500">Search for accessible venues in Gauteng.</p>
                <p className="text-sm text-slate-400 mt-2">Powered by Gemini Maps Grounding</p>
            </div>
        )}

        {results && (
            <div className="space-y-6">
                {/* AI Summary */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 prose prose-sm max-w-none text-slate-700">
                    <ReactMarkdown>{results.text}</ReactMarkdown>
                </div>

                {/* Map Cards */}
                <div className="grid gap-4">
                    {results.places.map((place, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-slate-800">{place.title}</h3>
                                {place.source?.reviewSnippets?.[0] && (
                                    <div className="mt-2 text-sm text-slate-600 italic bg-slate-50 p-2 rounded">
                                        "{place.source.reviewSnippets[0].reviewText}"
                                    </div>
                                )}
                            </div>
                            <div className="mt-auto border-t border-slate-50 p-3 flex justify-between items-center bg-slate-50/50">
                                <span className="text-xs text-slate-500 font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">Verified</span>
                                <a 
                                    href={place.uri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
                                >
                                    Open in Maps
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
