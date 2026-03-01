const STORAGE_KEY = 'llm-chat-history';
const THEME_KEY = 'llm-chat-theme';

export function loadMessages() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

export function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore storage errors
  }
}

export function clearMessages() {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}
