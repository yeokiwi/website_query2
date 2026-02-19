import { useState } from 'react';

const TOOL_ICONS = {
  web_search: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  fetch_url: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
};

const STATUS_STYLES = {
  running: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30',
  done: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  failed: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
};

const STATUS_LABELS = {
  running: 'searching...',
  done: 'done',
  failed: 'failed',
};

export default function ToolActivityCard({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const { name, input, status, result } = toolCall;

  const queryDisplay = name === 'web_search'
    ? input.query
    : input.url;

  return (
    <div className="my-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
      >
        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
          {TOOL_ICONS[name]}
        </span>
        <span className="font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
          {name === 'web_search' ? 'Web Search' : 'Fetch URL'}
        </span>
        <span className="text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
          {queryDisplay}
        </span>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && result && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
          <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400 max-h-48 overflow-y-auto">
            {result}
          </pre>
          {name === 'fetch_url' && input.url && (
            <a
              href={input.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-blue-500 hover:text-blue-600 underline"
            >
              Open in new tab
            </a>
          )}
        </div>
      )}
    </div>
  );
}
