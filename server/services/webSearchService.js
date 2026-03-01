const axios = require('axios');

const SEARCH_PROVIDER = process.env.SEARCH_PROVIDER || 'brave';

async function webSearch(query, numResults = 5) {
  numResults = Math.min(Math.max(numResults, 1), 10);

  if (SEARCH_PROVIDER === 'serpapi') {
    return searchWithSerpApi(query, numResults);
  } else if (SEARCH_PROVIDER === 'brave') {
    return searchWithBrave(query, numResults);
  } else {
    throw new Error(`Unknown search provider: ${SEARCH_PROVIDER}`);
  }
}

async function searchWithSerpApi(query, numResults) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error('SERPAPI_API_KEY is not configured');

  const response = await axios.get('https://serpapi.com/search', {
    params: {
      q: query,
      api_key: apiKey,
      num: numResults,
      engine: 'google',
    },
    timeout: 10000,
  });

  const results = (response.data.organic_results || []).slice(0, numResults);
  return results.map((r) => ({
    title: r.title || '',
    url: r.link || '',
    snippet: r.snippet || '',
  }));
}

async function searchWithBrave(query, numResults) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) throw new Error('BRAVE_SEARCH_API_KEY is not configured');

  const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    params: {
      q: query,
      count: numResults,
    },
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
    timeout: 10000,
  });

  const results = (response.data.web?.results || []).slice(0, numResults);
  return results.map((r) => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.description || '',
  }));
}

module.exports = { webSearch };
