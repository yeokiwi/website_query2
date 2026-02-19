import { useState, useCallback, useRef } from 'react';
import { loadMessages, saveMessages, clearMessages as clearStoredMessages } from '../utils/storage';

export function useChat() {
  const [messages, setMessages] = useState(() => loadMessages());
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      saveMessages(next);
      return next;
    });
  }, []);

  const updateLastAssistantMessage = useCallback((updater) => {
    setMessages((prev) => {
      const next = [...prev];
      const lastIdx = next.length - 1;
      if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
        next[lastIdx] = updater(next[lastIdx]);
      }
      saveMessages(next);
      return next;
    });
  }, []);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;

    const userMsg = {
      role: 'user',
      content: userText.trim(),
      timestamp: Date.now(),
    };

    // Build API messages from history (only role + content for API)
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message to UI
    setMessages((prev) => {
      const next = [...prev, userMsg];
      saveMessages(next);
      return next;
    });

    // Create placeholder assistant message
    const assistantMsg = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      toolCalls: [],
    };

    setMessages((prev) => {
      const next = [...prev, assistantMsg];
      saveMessages(next);
      return next;
    });

    setIsLoading(true);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            handleSSEEvent(eventType, data);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        updateLastAssistantMessage((msg) => ({
          ...msg,
          content: msg.content || `Error: ${err.message}`,
          error: true,
        }));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, updateLastAssistantMessage]);

  function handleSSEEvent(event, data) {
    switch (event) {
      case 'text':
        updateLastAssistantMessage((msg) => ({
          ...msg,
          content: msg.content + data.text,
        }));
        break;
      case 'tool_start':
        updateLastAssistantMessage((msg) => ({
          ...msg,
          toolCalls: [
            ...msg.toolCalls,
            {
              id: data.tool_use_id,
              name: data.name,
              input: data.input,
              status: 'running',
              result: null,
            },
          ],
        }));
        break;
      case 'tool_end':
        updateLastAssistantMessage((msg) => ({
          ...msg,
          toolCalls: msg.toolCalls.map((tc) =>
            tc.id === data.tool_use_id
              ? {
                  ...tc,
                  status: data.is_error ? 'failed' : 'done',
                  result: data.result,
                }
              : tc
          ),
        }));
        break;
      case 'error':
        updateLastAssistantMessage((msg) => ({
          ...msg,
          content: msg.content || `Error: ${data.error}`,
          error: true,
        }));
        break;
      case 'done':
        // Stream complete
        break;
    }
  }

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    clearStoredMessages();
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
