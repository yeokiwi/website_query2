## Coding Prompt: LLM Chat Interface with Browsing Capabilities

### Project Overview
Build a clean, responsive single-page web application that allows users to send chat messages to an LLM API, display the streamed or returned responses in a conversational UI, and enable the LLM to autonomously browse the web using `web_search` and `fetch_url` tools to answer queries with up-to-date information.

---

### Tech Stack
- **Frontend:** React (with Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **LLM Integration:** Anthropic Claude API (tool use / function calling support required)
- **Web Search:** SerpAPI, Brave Search API, or DuckDuckGo scraper
- **URL Fetching:** Axios + Cheerio (for HTML parsing) or Playwright (for JS-rendered pages)
- **Communication:** REST API with streaming via Server-Sent Events (SSE)

---

### Functional Requirements

**Chat Interface**
- Display a scrollable conversation thread showing alternating user and assistant messages
- Each message shows a role label ("You" / "Assistant"), timestamp, and message content
- Auto-scroll to the latest message on new entries
- Show a typing indicator while awaiting a response

**Tool Activity Feed**
- When the LLM invokes a tool, display a collapsible "activity card" inline in the chat thread showing:
  - Tool name (`web_search` or `fetch_url`)
  - The query or URL used
  - A truncated preview of the returned result
  - Status indicator: `searching...` → `done` or `failed`
- This gives the user visibility into what the LLM is doing behind the scenes

**Input Area**
- Fixed-to-bottom textarea, submits on Enter (Shift+Enter for newline)
- Disable input while a request or tool call is in progress
- Clear input after submission

**Session Management**
- Maintain full conversation history including tool call/result turns in state
- Pass the complete history on each API call to preserve context across multi-turn browsing
- "Clear Chat" button resets the thread and history

**Streaming Support**
- Stream assistant text token-by-token via SSE
- Pause the stream gracefully when a tool call is detected, execute the tool server-side, then resume the stream with the tool result injected

---

### Backend Requirements

**`POST /api/chat` Endpoint**
- Accepts:
  ```json
  {
    "messages": [ { "role": "user", "content": "..." }, ... ]
  }
  ```
- Implements an **agentic tool-use loop:**
  1. Send messages + tool definitions to the LLM
  2. If the LLM returns a `tool_use` block, execute the appropriate tool
  3. Append the `tool_result` to the message history
  4. Re-send the updated history back to the LLM
  5. Repeat until the LLM returns a final `end_turn` text response
- Stream intermediate status updates and final text to the frontend via SSE

**Tool Definitions (passed to LLM on every request)**

```json
[
  {
    "name": "web_search",
    "description": "Search the web for current information using a query string. Use this when the user asks about recent events, news, prices, or anything that may have changed.",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "The search query string"
        },
        "num_results": {
          "type": "integer",
          "description": "Number of results to return (default: 5, max: 10)"
        }
      },
      "required": ["query"]
    }
  },
  {
    "name": "fetch_url",
    "description": "Fetch and extract the readable text content of a webpage by URL. Use this to read the full content of a specific page, article, or document.",
    "input_schema": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "description": "The full URL of the page to fetch (must include https://)"
        },
        "extract_mode": {
          "type": "string",
          "enum": ["text", "markdown"],
          "description": "How to extract content: 'text' for plain text, 'markdown' for structured markdown"
        }
      },
      "required": ["url"]
    }
  }
]
```

**Tool Execution Handlers**

`web_search(query, num_results)`:
- Call SerpAPI / Brave Search API with the query
- Return an array of `{ title, url, snippet }` objects
- Cap content at a configurable token limit to avoid oversized context

`fetch_url(url, extract_mode)`:
- Use Axios to fetch the raw HTML
- Use Cheerio to strip navigation, ads, and boilerplate — extract main article content only
- Convert to plain text or Turndown-rendered Markdown depending on `extract_mode`
- Truncate to a configurable max character limit (e.g. 8,000 chars) before returning to the LLM

**Security & Safety**
- Maintain a URL blocklist to prevent the LLM from fetching internal/private addresses (`localhost`, `192.168.x.x`, `169.254.x.x`, etc.)
- Rate limit tool calls per request — cap at a configurable max (e.g. 10 tool calls per conversation turn) to prevent infinite loops
- Validate all URLs before fetching (must be `https://`)
- Store all API keys in `.env`, never exposed to the frontend

**Error Handling**
- If a tool call fails (search API down, URL unreachable, timeout), return a structured error result to the LLM so it can acknowledge the failure and try an alternative approach
- Surface meaningful HTTP errors to the frontend with user-friendly messages

---

### Non-Functional Requirements
- Mobile-responsive layout (320px and wider)
- All configurable values in `.env`: API keys, model name, system prompt, max tokens, temperature, tool call limit, fetch character limit
- Clean service layer separation: `llmService.js`, `webSearchService.js`, `fetchUrlService.js`
- Request timeout handling for both LLM calls and URL fetches

---

### System Prompt (configurable in `.env`)
```
You are a helpful assistant with the ability to browse the web. 
When a user asks about current events, recent data, or specific URLs, 
use the web_search or fetch_url tools to retrieve up-to-date information 
before answering. Always cite your sources by including the URL in your response.
```

---

### Stretch Goals
- Markdown rendering with syntax highlighting for assistant responses
- Display a source citation list at the bottom of each browsed response (extracted URLs)
- Allow users to click a fetched URL in the activity card to open it in a new tab
- Persist conversation history to `localStorage`
- Dark/light mode toggle
- Admin panel to configure system prompt and tool limits at runtime

---

### Deliverables
1. Full source code with folder structure: `/client`, `/server`, `/server/services`
2. `.env.example` with all required variables documented
3. `README.md` covering setup, running locally, swapping LLM providers, and configuring search API keys

---

The key addition over a basic chat interface is the **agentic tool-use loop** on the backend — the server must handle multi-step LLM ↔ tool ↔ LLM cycles transparently, streaming progress back to the user so they can see the browsing activity as it happens.

---

### Automated URL Query Feature (Website Change Monitor)

**Overview**
In addition to the freeform chat input, the application includes a dedicated **URL Query Bar** that lets users quickly check any website for recent changes. The user enters a URL and clicks a **Request** button; the application automatically constructs and sends a pre-formatted prompt to the LLM.

**UI Component: `UrlQueryBar`**
- Placed prominently below the header, above the chat message area
- Contains a single-line URL input field with a link icon and placeholder text (`https://example.com`)
- A **Request** button with a search icon sits to the right of the input
- If the user omits the protocol, the component auto-prepends `https://`
- Both the input and button are disabled while a request is in progress
- Submitting clears the URL input

**Automated Prompt Template**
When the user clicks Request, the following message is automatically sent to the LLM (with `[URL]` replaced by the user's input):

```
I need you to examine [URL] and focus specifically on:
- What's new or changed in the last 30 days?
- Any announcements, blog posts, or news from the past month
- Updates to products, services, or features
- Changes to pricing, terms of service, or policies
Please distinguish between what you can confirm as recent vs. what appears to be recent based on dates or context.
```

**Behavior**
- The automated prompt appears in the chat thread as a regular user message so the user can see exactly what was sent
- The LLM processes the request using its existing `web_search` and `fetch_url` tools to browse and analyze the target website
- Tool activity cards appear inline as the LLM fetches and analyzes the site
- The freeform chat input at the bottom of the page remains fully functional for follow-up questions or unrelated queries

**Empty State**
- When no messages exist, the main area displays a "Website Change Monitor" welcome message directing the user to enter a URL above and click Request
- A secondary note mentions that freeform chat is also available below

---

### Batch Website Monitoring (website.md)

**Overview**
The application supports batch monitoring of multiple websites. A `website.md` file in the project root contains a list of URLs to monitor. The user can trigger a batch run from the UI, which processes each URL through the Automated URL Query Feature and writes each result to an individual markdown file.

**`website.md` Format**
- Located at the project root (`/website.md`)
- Contains one URL per line
- Lines starting with `#` are treated as comments and ignored
- Empty lines are ignored
- Example:
  ```
  # Websites to monitor
  https://example.com
  https://openai.com/blog
  https://developer.chrome.com
  ```

**Backend: `POST /api/batch-monitor` Endpoint**
- Reads and parses `website.md` from the project root
- For each URL, sends the automated prompt template (the same one used by the single URL Query feature) to the LLM via the existing agentic tool-use loop
- Each URL is processed with a fresh conversation context (no cross-contamination between sites)
- Streams progress events to the frontend via SSE:
  - `batch_start`: `{ total: <number of URLs> }`
  - `batch_item_start`: `{ index, url }`
  - `batch_item_text`: `{ index, url, text }` (incremental LLM response text)
  - `batch_item_tool_start` / `batch_item_tool_end`: tool activity for the current URL
  - `batch_item_done`: `{ index, url, filename }` (markdown file written)
  - `batch_item_error`: `{ index, url, error }`
  - `batch_done`: `{ total, succeeded, failed }`

**Backend: `GET /api/batch-monitor/websites` Endpoint**
- Returns the parsed list of URLs from `website.md`
- Response: `{ urls: ["https://example.com", ...] }`

**Backend: `GET /api/reports` Endpoint**
- Returns a list of generated report files with metadata
- Response: `{ reports: [{ filename, url, timestamp, size }, ...] }`

**Backend: `GET /api/reports/:filename` Endpoint**
- Returns the content of a specific report markdown file

**Output Files**
- Each URL's LLM response is saved as an individual markdown file in a `/reports` directory
- Filename format: `{domain}-{YYYY-MM-DD}.md` (e.g., `example.com-2026-03-01.md`)
- If a file with the same name already exists, append a numeric suffix (e.g., `example.com-2026-03-01-2.md`)
- Each output file includes a YAML front-matter header:
  ```markdown
  ---
  url: https://example.com
  date: 2026-03-01T12:00:00Z
  status: success
  ---

  # Website Change Report: example.com

  [LLM response content here]
  ```

**UI: Batch Monitor Panel**
- A "Batch Monitor" button in the header triggers the batch run
- When clicked, a panel or modal shows:
  - The list of URLs loaded from `website.md`
  - A "Run All" button to start processing
  - Per-URL status: `pending` → `monitoring...` → `done` / `failed`
  - A progress bar or counter (e.g., "3 / 7 completed")
  - Once a URL is done, a link to view/download its report
- While a batch run is in progress, the single URL Query Bar and chat input are disabled
- The batch run can be cancelled mid-way, preserving reports already written

**UI: Reports List**
- A "Reports" button in the header opens a panel listing all previously generated report files
- Each entry shows: domain, date, file size
- Clicking an entry opens the report content rendered as markdown in the chat area or a modal

**Error Handling**
- If `website.md` does not exist or is empty, show a user-friendly message with instructions on how to create it
- If an individual URL fails during batch processing, log the error, write a report file with `status: error` in the front-matter, and continue to the next URL
- The batch summary at the end reports total, succeeded, and failed counts
