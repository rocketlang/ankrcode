/**
 * Web Tools
 * WebFetch and WebSearch - Internet access tools
 */

import { Tool, ToolResult } from '../../types.js';

// Simple cache for web fetches (15 minute TTL)
const fetchCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * WebFetch Tool - Fetch and process web content
 */
export const webFetchTool: Tool = {
  name: 'WebFetch',
  description: `Fetch content from a URL and process it.
- Converts HTML to markdown
- Includes 15-minute cache
- Use prompt to specify what to extract
- HTTP URLs upgraded to HTTPS`,
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: 'The URL to fetch',
      },
      prompt: {
        type: 'string',
        description: 'What information to extract from the page',
      },
    },
    required: ['url', 'prompt'],
  },

  async handler(params): Promise<ToolResult> {
    const { url, prompt } = params as { url: string; prompt: string };

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      // Upgrade HTTP to HTTPS
      if (parsedUrl.protocol === 'http:') {
        parsedUrl.protocol = 'https:';
      }
    } catch {
      return { success: false, error: `Invalid URL: ${url}` };
    }

    const urlString = parsedUrl.toString();

    // Check cache
    const cached = fetchCache.get(urlString);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        success: true,
        output: `[Cached] Content from ${urlString}:\n\n${cached.content}\n\nPrompt: ${prompt}`,
        metadata: { cached: true },
      };
    }

    try {
      const response = await fetch(urlString, {
        headers: {
          'User-Agent': 'AnkrCode/1.0 (AI Coding Assistant)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Check for redirect to different host
      const finalUrl = new URL(response.url);
      if (finalUrl.host !== parsedUrl.host) {
        return {
          success: false,
          error: `Redirected to different host: ${response.url}. Make a new request with this URL.`,
          metadata: { redirectUrl: response.url },
        };
      }

      const html = await response.text();

      // Convert HTML to markdown (simplified - use turndown in production)
      const content = htmlToMarkdown(html);

      // Cache the result
      fetchCache.set(urlString, { content, timestamp: Date.now() });

      // Truncate if too long
      const truncated =
        content.length > 50000
          ? content.slice(0, 50000) + '\n\n[Content truncated...]'
          : content;

      return {
        success: true,
        output: `Content from ${urlString}:\n\n${truncated}\n\nExtraction prompt: ${prompt}`,
        metadata: { url: urlString, contentLength: content.length },
      };
    } catch (error) {
      return {
        success: false,
        error: `Fetch error: ${(error as Error).message}`,
      };
    }
  },
};

// Search result cache (5 minute TTL for search results)
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  score?: number;
}

interface SearchProvider {
  name: string;
  search: (query: string, options: SearchOptions) => Promise<SearchResult[]>;
  isAvailable: () => boolean;
}

interface SearchOptions {
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxResults?: number;
}

/**
 * Tavily Search Provider
 */
const tavilyProvider: SearchProvider = {
  name: 'Tavily',
  isAvailable: () => !!process.env.TAVILY_API_KEY,
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        include_domains: options.allowedDomains,
        exclude_domains: options.blockedDomains,
        search_depth: 'advanced',
        max_results: options.maxResults || 10,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data: any = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content || r.snippet,
      domain: new URL(r.url).hostname,
      score: r.score,
    }));
  },
};

/**
 * Brave Search Provider
 */
const braveProvider: SearchProvider = {
  name: 'Brave',
  isAvailable: () => !!process.env.BRAVE_API_KEY,
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      count: String(options.maxResults || 10),
    });

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': process.env.BRAVE_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data: any = await response.json();
    let results: SearchResult[] = (data.web?.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
      domain: new URL(r.url).hostname,
    }));

    // Apply domain filters
    if (options.allowedDomains?.length) {
      results = results.filter(r =>
        options.allowedDomains!.some(d => r.domain.includes(d))
      );
    }
    if (options.blockedDomains?.length) {
      results = results.filter(r =>
        !options.blockedDomains!.some(d => r.domain.includes(d))
      );
    }

    return results;
  },
};

/**
 * SearXNG Provider (self-hosted or public instances)
 */
const searxngProvider: SearchProvider = {
  name: 'SearXNG',
  isAvailable: () => !!process.env.SEARXNG_URL,
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const baseUrl = process.env.SEARXNG_URL || 'https://searx.be';
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      pageno: '1',
    });

    const response = await fetch(`${baseUrl}/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AnkrCode/2.0 (AI Coding Assistant)',
      },
    });

    if (!response.ok) {
      throw new Error(`SearXNG error: ${response.status}`);
    }

    const data: any = await response.json();
    let results: SearchResult[] = (data.results || [])
      .slice(0, options.maxResults || 10)
      .map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        domain: r.parsed_url?.[1] || new URL(r.url).hostname,
      }));

    // Apply domain filters
    if (options.allowedDomains?.length) {
      results = results.filter(r =>
        options.allowedDomains!.some(d => r.domain.includes(d))
      );
    }
    if (options.blockedDomains?.length) {
      results = results.filter(r =>
        !options.blockedDomains!.some(d => r.domain.includes(d))
      );
    }

    return results;
  },
};

// Provider priority order
const searchProviders: SearchProvider[] = [
  tavilyProvider,
  braveProvider,
  searxngProvider,
];

/**
 * Get cache key for search
 */
function getSearchCacheKey(query: string, options: SearchOptions): string {
  return JSON.stringify({ query: query.toLowerCase(), ...options });
}

/**
 * WebSearch Tool - Search the web
 */
export const webSearchTool: Tool = {
  name: 'WebSearch',
  description: `Search the web for information.
- Use for current events and recent data
- MUST include Sources section with URLs in response
- Supports domain filtering (allowed/blocked)
- Auto-selects best available search provider:
  - Tavily (TAVILY_API_KEY) - Best quality
  - Brave Search (BRAVE_API_KEY) - Privacy-focused
  - SearXNG (SEARXNG_URL) - Self-hosted option`,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        minLength: 2,
        description: 'Search query',
      },
      allowed_domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Only include results from these domains',
      },
      blocked_domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Exclude results from these domains',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results (default: 10)',
      },
    },
    required: ['query'],
  },

  async handler(params): Promise<ToolResult> {
    const { query, allowed_domains, blocked_domains, max_results = 10 } = params as {
      query: string;
      allowed_domains?: string[];
      blocked_domains?: string[];
      max_results?: number;
    };

    const options: SearchOptions = {
      allowedDomains: allowed_domains,
      blockedDomains: blocked_domains,
      maxResults: max_results,
    };

    // Check cache
    const cacheKey = getSearchCacheKey(query, options);
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
      return formatSearchResults(cached.results, query, 'cache', true);
    }

    // Find available provider
    const provider = searchProviders.find(p => p.isAvailable());

    if (!provider) {
      return {
        success: false,
        error: `No search provider configured. Set one of:
- TAVILY_API_KEY (recommended, get from tavily.com)
- BRAVE_API_KEY (get from brave.com/search/api)
- SEARXNG_URL (self-hosted instance URL)`,
        metadata: {
          query,
          availableProviders: searchProviders
            .filter(p => p.isAvailable())
            .map(p => p.name),
        },
      };
    }

    try {
      const results = await provider.search(query, options);

      // Cache results
      searchCache.set(cacheKey, { results, timestamp: Date.now() });

      return formatSearchResults(results, query, provider.name, false);
    } catch (error) {
      // Try next provider on failure
      for (const fallbackProvider of searchProviders) {
        if (fallbackProvider === provider || !fallbackProvider.isAvailable()) {
          continue;
        }
        try {
          const results = await fallbackProvider.search(query, options);
          searchCache.set(cacheKey, { results, timestamp: Date.now() });
          return formatSearchResults(
            results,
            query,
            `${fallbackProvider.name} (fallback)`,
            false
          );
        } catch {
          continue;
        }
      }

      return {
        success: false,
        error: `Search failed: ${(error as Error).message}`,
        metadata: { query, provider: provider.name },
      };
    }
  },
};

/**
 * Format search results for output
 */
function formatSearchResults(
  results: SearchResult[],
  query: string,
  provider: string,
  fromCache: boolean
): ToolResult {
  if (results.length === 0) {
    return {
      success: true,
      output: `No results found for: "${query}"`,
      metadata: { query, provider, resultCount: 0 },
    };
  }

  const formattedResults = results
    .map(
      (r, i) =>
        `### ${i + 1}. ${r.title}\n` +
        `**URL:** ${r.url}\n` +
        `**Domain:** ${r.domain}\n` +
        `${r.snippet}\n`
    )
    .join('\n');

  const sources = results
    .map(r => `- [${r.title}](${r.url})`)
    .join('\n');

  const output = `## Search Results for: "${query}"
${fromCache ? '_[Cached results]_\n' : ''}
Provider: ${provider}
Results: ${results.length}

${formattedResults}

---
## Sources
${sources}`;

  return {
    success: true,
    output,
    metadata: {
      query,
      provider,
      resultCount: results.length,
      cached: fromCache,
      domains: [...new Set(results.map(r => r.domain))],
    },
  };
}

// Simplified HTML to Markdown converter
// In production, use Turndown library
function htmlToMarkdown(html: string): string {
  let text = html;

  // Remove scripts and styles
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Convert headers
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

  // Convert paragraphs
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Convert lists
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Convert bold/italic
  text = text.replace(/<(b|strong)[^>]*>(.*?)<\/\1>/gi, '**$2**');
  text = text.replace(/<(i|em)[^>]*>(.*?)<\/\1>/gi, '*$2*');

  // Convert code
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  text = text.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n');

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  text = text.trim();

  return text;
}
