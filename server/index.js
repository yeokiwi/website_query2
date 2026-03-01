require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createMessage } = require('./services/llmService');
const { webSearch } = require('./services/webSearchService');
const { fetchUrl } = require('./services/fetchUrlService');

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const MAX_TOOL_CALLS = parseInt(process.env.MAX_TOOL_CALLS_PER_TURN || '10', 10);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// SSE helper
function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Execute a tool call
async function executeTool(name, input) {
  switch (name) {
    case 'web_search': {
      const results = await webSearch(input.query, input.num_results);
      return JSON.stringify(results, null, 2);
    }
    case 'fetch_url': {
      const content = await fetchUrl(input.url, input.extract_mode);
      return content;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// POST /api/chat — agentic tool-use loop with SSE streaming
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let conversationMessages = [...messages];
  let toolCallCount = 0;

  try {
    // Agentic loop: keep calling LLM until we get end_turn (no more tool use)
    while (true) {
      // Call LLM (non-streaming to handle tool use blocks properly)
      const response = await createMessage(conversationMessages);

      // Process content blocks
      let hasToolUse = false;
      const toolUseBlocks = [];
      let textContent = '';

      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += block.text;
          // Stream the text to the client
          sendSSE(res, 'text', { text: block.text });
        } else if (block.type === 'tool_use') {
          hasToolUse = true;
          toolUseBlocks.push(block);
        }
      }

      // If no tool use, we're done
      if (!hasToolUse) {
        sendSSE(res, 'done', { stop_reason: response.stop_reason });
        break;
      }

      // Check tool call limit
      toolCallCount += toolUseBlocks.length;
      if (toolCallCount > MAX_TOOL_CALLS) {
        sendSSE(res, 'text', {
          text: '\n\n[Tool call limit reached. Providing answer with information gathered so far.]',
        });
        sendSSE(res, 'done', { stop_reason: 'tool_limit' });
        break;
      }

      // Add assistant message with all content blocks to conversation
      conversationMessages.push({
        role: 'assistant',
        content: response.content,
      });

      // Execute each tool and collect results
      const toolResults = [];
      for (const toolBlock of toolUseBlocks) {
        // Notify client that tool is starting
        sendSSE(res, 'tool_start', {
          tool_use_id: toolBlock.id,
          name: toolBlock.name,
          input: toolBlock.input,
        });

        let result;
        let isError = false;
        try {
          result = await executeTool(toolBlock.name, toolBlock.input);
        } catch (err) {
          result = `Error: ${err.message}`;
          isError = true;
        }

        // Notify client that tool is done
        sendSSE(res, 'tool_end', {
          tool_use_id: toolBlock.id,
          name: toolBlock.name,
          result: result.slice(0, 500), // truncated preview for the client
          is_error: isError,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: result,
          is_error: isError,
        });
      }

      // Add tool results to conversation
      conversationMessages.push({
        role: 'user',
        content: toolResults,
      });
    }
  } catch (err) {
    console.error('Chat error:', err);
    sendSSE(res, 'error', {
      error: err.message || 'An unexpected error occurred',
    });
  } finally {
    res.end();
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
