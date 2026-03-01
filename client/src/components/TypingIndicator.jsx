export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="typing-dot w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="typing-dot w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="typing-dot w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
