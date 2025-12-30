
import { Sparkles } from 'lucide-react';

interface SampleQueriesProps {
  onQueryClick: (query: string) => void;
}
const sampleQueries = [
  {
    emoji: '📈',
    query: "Compare total points by all constructors across the last 5 seasons",
  },
  { emoji: '📊', query: "What are the total points earned by each constructor in 2021?" },
  {
    emoji: '🛞',
    query: "Rank drivers by number of podium finishes in the last two seasons",
  },
];




export default function SampleQueries({ onQueryClick }: SampleQueriesProps) {
  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg p-4 mb-4 border border-blue-500/10">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-medium text-blue-200">Try these fun queries!</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {sampleQueries.map(({ emoji, query }) => (
          <button
            key={query}
            onClick={() => onQueryClick(query)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1e293b] rounded-full shadow-sm border border-blue-500/20 text-sm text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors"
          >
            <span>{emoji}</span>
            <span>{query}</span>
          </button>
        ))}
      </div>
    </div>
  );
}