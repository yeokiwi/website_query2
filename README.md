# LLM Chat Interface with Web Browsing

A clean, responsive single-page chat application that connects to the Anthropic Claude API with autonomous web browsing capabilities. The LLM can search the web and fetch URL content to answer queries with up-to-date information.

## Features

- Conversational chat UI with streaming responses
- Agentic tool-use loop: the LLM can autonomously search the web and fetch pages
- Inline tool activity cards showing search queries, URLs fetched, and results
- Markdown rendering with syntax highlighting
- Dark/light mode toggle
- Conversation persistence via localStorage
- Mobile-responsive layout
- Security: URL blocklist, HTTPS-only fetching, rate-limited tool calls

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **LLM:** Anthropic Claude API (tool use / function calling)
- **Web Search:** SerpAPI or Brave Search API
- **URL Fetching:** Axios + Cheerio + Turndown

## Project Structure

```
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles + Tailwind
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                  # Express backend
│   ├── services/
│   │   ├── llmService.js    # Anthropic Claude API integration
│   │   ├── webSearchService.js  # Web search (SerpAPI / Brave)
│   │   └── fetchUrlService.js   # URL content extraction
│   ├── index.js             # Express server + SSE endpoint
│   └── package.json
├── .env.example             # Environment variable template
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- An Anthropic API key
- A web search API key (Brave Search or SerpAPI)

### 1. Clone and install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment variables

```bash
# From the server directory
cp .env.example .env
```

Edit `server/.env` and fill in your API keys:

```
ANTHROPIC_API_KEY=sk-ant-...
BRAVE_SEARCH_API_KEY=BSA...
```

### 3. Run in development mode

Start both the backend and frontend:

```bash
# Terminal 1: Start the backend
cd server
npm run dev

# Terminal 2: Start the frontend
cd client
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:3001`.

### 4. Build for production

```bash
cd client
npm run build
```

Then serve everything from the backend:

```bash
cd server
npm start
```

The server serves the built frontend from `client/dist/` and handles API requests.

## Configuration

All configurable values live in `server/.env`:

| Variable | Description | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key | (required) |
| `MODEL_NAME` | Claude model to use | `claude-sonnet-4-20250514` |
| `MAX_TOKENS` | Max tokens per response | `4096` |
| `TEMPERATURE` | LLM temperature | `0.7` |
| `SYSTEM_PROMPT` | System prompt for the LLM | (see .env.example) |
| `SEARCH_PROVIDER` | `brave` or `serpapi` | `brave` |
| `BRAVE_SEARCH_API_KEY` | Brave Search API key | - |
| `SERPAPI_API_KEY` | SerpAPI key | - |
| `MAX_TOOL_CALLS_PER_TURN` | Max tool calls per conversation turn | `10` |
| `FETCH_MAX_CHARS` | Max characters when fetching a URL | `8000` |
| `PORT` | Backend server port | `3001` |

## Swapping LLM Providers

The LLM integration is contained in `server/services/llmService.js`. To switch to a different provider:

1. Replace the `@anthropic-ai/sdk` import with your provider's SDK
2. Update `createMessage()` to use the new provider's API format
3. Ensure tool definitions follow your provider's function calling schema
4. Update `.env` with the new API key variable

## Swapping Search APIs

Search is handled in `server/services/webSearchService.js`. Set `SEARCH_PROVIDER` in `.env` to `brave` or `serpapi`, and provide the corresponding API key. To add a new search provider, add a new function in the service file and update the switch statement.
