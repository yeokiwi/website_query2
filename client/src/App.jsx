import { useState, useEffect } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { useChat } from './hooks/useChat';
import { loadTheme, saveTheme } from './utils/storage';

export default function App() {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [darkMode, setDarkMode] = useState(() => loadTheme() === 'dark');

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveTheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  function toggleDarkMode() {
    setDarkMode((prev) => !prev);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header
        onClearChat={clearChat}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
