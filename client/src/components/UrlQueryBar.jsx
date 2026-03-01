import { useState, useRef, useEffect } from 'react';

const PROMPT_TEMPLATE = (url) =>
  `I need you to examine ${url} and focus specifically on:
- What's new or changed in the last 30 days?
- Any announcements, blog posts, or news from the past month
- Updates to products, services, or features
- Changes to pricing, terms of service, or policies
Please distinguish between what you can confirm as recent vs. what appears to be recent based on dates or context.`;

export default function UrlQueryBar({ onSend, disabled }) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  function handleSubmit(e) {
    e?.preventDefault();
    if (!url.trim() || disabled) return;

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const message = PROMPT_TEMPLATE(normalizedUrl);
    onSend(message);
    setUrl('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6"
    >
      <div className="max-w-4xl mx-auto">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Website Monitor — Enter a URL to check for recent changes
        </label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={disabled ? 'Waiting for response...' : 'https://example.com'}
              disabled={disabled}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={disabled || !url.trim()}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Request
          </button>
        </div>
      </div>
    </form>
  );
}
