import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import ToolActivityCard from './ToolActivityCard';
import { formatTime } from '../utils/formatTime';

export default function MessageBubble({ message }) {
  const { role, content, timestamp, toolCalls, error } = message;
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'order-1' : 'order-1'}`}>
        {/* Role label + timestamp */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs font-semibold ${isUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatTime(timestamp)}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : error
                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-md'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md'
          } shadow-sm`}
        >
          {/* Tool activity cards (for assistant messages) */}
          {toolCalls && toolCalls.length > 0 && (
            <div className="mb-2">
              {toolCalls.map((tc) => (
                <ToolActivityCard key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

          {/* Message content */}
          {content && (
            isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
