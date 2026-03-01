const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const FETCH_MAX_CHARS = parseInt(process.env.FETCH_MAX_CHARS || '8000', 10);

const BLOCKED_PATTERNS = [
  /^localhost/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[::1\]/,
  /^\[fc/i,
  /^\[fd/i,
  /^\[fe80/i,
];

function isBlockedUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') {
      return true;
    }
    const hostname = parsed.hostname;
    return BLOCKED_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return true;
  }
}

async function fetchUrl(url, extractMode = 'text') {
  if (isBlockedUrl(url)) {
    throw new Error(`URL is blocked for security reasons: ${url}`);
  }

  const response = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LLMChatBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    responseType: 'text',
  });

  const html = response.data;
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, nav, header, footer, iframe, noscript, .sidebar, .nav, .menu, .ad, .advertisement, .cookie-banner, [role="navigation"], [role="banner"]').remove();

  // Try to find main content
  let contentEl = $('article, [role="main"], main, .post-content, .article-content, .entry-content, #content');
  if (contentEl.length === 0) {
    contentEl = $('body');
  }

  let content;
  if (extractMode === 'markdown') {
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    content = turndown.turndown(contentEl.html() || '');
  } else {
    content = contentEl.text().replace(/\s+/g, ' ').trim();
  }

  // Truncate to max chars
  if (content.length > FETCH_MAX_CHARS) {
    content = content.slice(0, FETCH_MAX_CHARS) + '\n\n[Content truncated at ' + FETCH_MAX_CHARS + ' characters]';
  }

  return content;
}

module.exports = { fetchUrl, isBlockedUrl };
