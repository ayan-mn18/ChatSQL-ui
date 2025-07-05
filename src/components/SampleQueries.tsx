
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-medium text-blue-900">Try these fun queries!</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {sampleQueries.map(({ emoji, query }) => (
          <button
            key={query}
            onClick={() => onQueryClick(query)}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-sm border border-blue-100 text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 transition-colors"
          >
            <span>{emoji}</span>
            <span>{query}</span>
          </button>
        ))}
      </div>
    </div>
  );
}