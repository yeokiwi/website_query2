import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function MessageList({ messages, isLoading }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Website Change Monitor
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Enter a URL above and click <span className="font-medium text-blue-500 dark:text-blue-400">Request</span> to check what's new or changed in the last 30 days.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            You can also type a freeform question in the chat box below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} />
      ))}
      {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
        <TypingIndicator />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
