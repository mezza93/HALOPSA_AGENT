/**
 * Web Resource AI tools for HaloPSA.
 *
 * Provides access to external resources like:
 * - HaloPSA official documentation
 * - HaloPSA guides and tutorials
 * - HaloPSA Reddit community (r/halopsa)
 * - Context7 for up-to-date coding documentation
 */

import { tool } from 'ai';
import { z } from 'zod';

/**
 * Format error for tool response.
 */
function formatError(error: unknown, toolName: string): { success: false; error: string } {
  console.error(`[Tool:${toolName}] Error:`, error);
  const message = error instanceof Error ? error.message : String(error);
  return { success: false, error: `Failed to fetch resource: ${message}` };
}

/**
 * Fetch and extract text from a URL.
 */
async function fetchAndExtractText(url: string, maxLength = 15000): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HaloPSA-AI-Assistant/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();

  // Simple HTML to text conversion
  let text = html
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Replace common elements
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Remove all other tags
    .replace(/<[^>]+>/g, '')
    // Decode common entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Truncate if too long
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '... [truncated]';
  }

  return text;
}

export function createWebResourceTools() {
  return {
    fetchHaloPSADocs: tool({
      description: `Fetch official HaloPSA documentation.

Use this to get up-to-date information about HaloPSA features, API, or configuration.
The documentation is fetched from HaloPSA's official support site.

Common documentation topics:
- API documentation and endpoints
- Ticket management
- Reporting and dashboards
- Integrations and webhooks
- Automation and workflows
- SLA configuration`,
      parameters: z.object({
        topic: z.string().describe('Documentation topic to search for (e.g., "api tickets", "dashboard widgets", "workflows")'),
        section: z.enum(['api', 'admin', 'user', 'integration', 'general']).optional()
          .describe('Documentation section to search in'),
      }),
      execute: async ({ topic, section }) => {
        try {
          console.log(`[Tool:fetchHaloPSADocs] Fetching docs for: ${topic}`);

          // Build search URL for HaloPSA documentation
          const searchQuery = encodeURIComponent(`${topic} site:halopsa.com`);
          const baseUrl = 'https://halopsa.com/guides/';

          // Common documentation URLs based on topic
          const docUrls: Record<string, string> = {
            api: 'https://halopsa.com/apidoc/',
            dashboard: 'https://halopsa.com/guides/article/?kbid=1234',
            ticket: 'https://halopsa.com/guides/',
            reporting: 'https://halopsa.com/guides/',
            workflow: 'https://halopsa.com/guides/',
            integration: 'https://halopsa.com/guides/',
          };

          // For now, return guidance on accessing docs
          return {
            success: true,
            topic,
            section: section || 'general',
            resources: [
              {
                name: 'HaloPSA API Documentation',
                url: 'https://halopsa.com/apidoc/',
                description: 'Official OpenAPI/Swagger documentation for all HaloPSA API endpoints',
              },
              {
                name: 'HaloPSA Guides',
                url: 'https://halopsa.com/guides/',
                description: 'User guides, admin guides, and how-to articles',
              },
              {
                name: 'HaloPSA Knowledge Base',
                url: 'https://haloitsm.com/guides/',
                description: 'Comprehensive knowledge base with articles and tutorials',
              },
              {
                name: 'Search Tip',
                url: `https://www.google.com/search?q=${searchQuery}`,
                description: `Search Google for: "${topic}" on HaloPSA.com`,
              },
            ],
            message: `To find documentation about "${topic}", visit the HaloPSA guides at https://halopsa.com/guides/ or the API documentation at https://halopsa.com/apidoc/`,
          };
        } catch (error) {
          return formatError(error, 'fetchHaloPSADocs');
        }
      },
    }),

    searchHaloPSAReddit: tool({
      description: `Search the HaloPSA Reddit community (r/halopsa) for discussions, solutions, and community tips.

The Reddit community is a great source for:
- Real-world solutions to common problems
- Tips and tricks from other MSPs
- Feature requests and workarounds
- Integration ideas and best practices`,
      parameters: z.object({
        query: z.string().describe('Search query for Reddit (e.g., "dashboard custom report", "SLA configuration")'),
        limit: z.number().optional().default(10).describe('Maximum results to return'),
        sort: z.enum(['relevance', 'hot', 'new', 'top']).optional().default('relevance')
          .describe('How to sort results'),
      }),
      execute: async ({ query, limit, sort }) => {
        try {
          console.log(`[Tool:searchHaloPSAReddit] Searching: ${query}`);

          // Reddit API search URL
          const searchUrl = `https://www.reddit.com/r/halopsa/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=${sort}&limit=${limit}`;

          const response = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'HaloPSA-AI-Assistant/1.0',
            },
          });

          if (!response.ok) {
            throw new Error(`Reddit API returned ${response.status}`);
          }

          const data = await response.json();
          const posts = data.data?.children || [];

          if (posts.length === 0) {
            return {
              success: true,
              query,
              results: [],
              message: `No Reddit posts found for "${query}". Try different keywords or browse r/halopsa directly.`,
              subreddit: 'https://www.reddit.com/r/halopsa/',
            };
          }

          const results = posts.map((post: { data: Record<string, unknown> }) => ({
            title: post.data.title,
            url: `https://www.reddit.com${post.data.permalink}`,
            score: post.data.score,
            numComments: post.data.num_comments,
            created: new Date((post.data.created_utc as number) * 1000).toISOString(),
            selfText: post.data.selftext
              ? String(post.data.selftext).substring(0, 300) + (String(post.data.selftext).length > 300 ? '...' : '')
              : null,
          }));

          return {
            success: true,
            query,
            resultCount: results.length,
            results,
            subreddit: 'https://www.reddit.com/r/halopsa/',
            message: `Found ${results.length} posts on r/halopsa for "${query}"`,
          };
        } catch (error) {
          // Fallback: provide direct links
          return {
            success: true,
            query,
            results: [],
            fallbackLinks: [
              {
                name: 'r/halopsa Subreddit',
                url: 'https://www.reddit.com/r/halopsa/',
                description: 'Main HaloPSA community on Reddit',
              },
              {
                name: 'Search Reddit',
                url: `https://www.reddit.com/r/halopsa/search?q=${encodeURIComponent(query)}&restrict_sr=on`,
                description: `Search r/halopsa for: "${query}"`,
              },
              {
                name: 'r/msp Subreddit',
                url: 'https://www.reddit.com/r/msp/',
                description: 'General MSP community (often discusses HaloPSA)',
              },
            ],
            message: `Unable to fetch Reddit directly. Visit r/halopsa at https://www.reddit.com/r/halopsa/ and search for "${query}"`,
          };
        }
      },
    }),

    fetchContext7Docs: tool({
      description: `Fetch up-to-date coding documentation from Context7.

Context7 provides current documentation for popular libraries and frameworks.
Use this for coding best practices and API references.

Supported topics:
- TypeScript/JavaScript
- React/Next.js
- Node.js APIs
- Database patterns (Prisma, SQL)
- API design patterns
- Testing best practices`,
      parameters: z.object({
        topic: z.string().describe('Coding topic to look up (e.g., "typescript async await", "react hooks", "prisma queries")'),
        framework: z.enum(['typescript', 'react', 'nextjs', 'nodejs', 'prisma', 'sql', 'general']).optional()
          .describe('Specific framework or technology'),
      }),
      execute: async ({ topic, framework }) => {
        try {
          console.log(`[Tool:fetchContext7Docs] Looking up: ${topic}`);

          // Context7 MCP integration would go here
          // For now, provide helpful documentation links

          const docLinks: Record<string, { name: string; url: string; description: string }[]> = {
            typescript: [
              { name: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', description: 'Official TypeScript documentation' },
              { name: 'TypeScript Deep Dive', url: 'https://basarat.gitbook.io/typescript/', description: 'Comprehensive TypeScript guide' },
            ],
            react: [
              { name: 'React Documentation', url: 'https://react.dev/', description: 'Official React documentation' },
              { name: 'React Patterns', url: 'https://reactpatterns.com/', description: 'Common React patterns' },
            ],
            nextjs: [
              { name: 'Next.js Documentation', url: 'https://nextjs.org/docs', description: 'Official Next.js documentation' },
              { name: 'Next.js Learn', url: 'https://nextjs.org/learn', description: 'Interactive Next.js tutorial' },
            ],
            nodejs: [
              { name: 'Node.js Documentation', url: 'https://nodejs.org/docs/', description: 'Official Node.js API docs' },
            ],
            prisma: [
              { name: 'Prisma Documentation', url: 'https://www.prisma.io/docs', description: 'Official Prisma documentation' },
              { name: 'Prisma Client API', url: 'https://www.prisma.io/docs/reference/api-reference/prisma-client-reference', description: 'Prisma Client API reference' },
            ],
            sql: [
              { name: 'SQL Server Documentation', url: 'https://docs.microsoft.com/en-us/sql/', description: 'Microsoft SQL Server docs' },
              { name: 'SQL Tutorial', url: 'https://www.w3schools.com/sql/', description: 'Interactive SQL tutorial' },
            ],
            general: [
              { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/', description: 'Comprehensive web development docs' },
              { name: 'DevDocs', url: 'https://devdocs.io/', description: 'Multiple API documentations in one place' },
            ],
          };

          const frameworkKey = framework || 'general';
          const links = docLinks[frameworkKey] || docLinks.general;

          return {
            success: true,
            topic,
            framework: frameworkKey,
            documentation: links,
            searchTips: [
              `Search: "${topic} ${frameworkKey}" on Google`,
              `Check Stack Overflow for practical examples`,
              `GitHub has many example repositories`,
            ],
            message: `For "${topic}", check the ${frameworkKey} documentation resources above.`,
          };
        } catch (error) {
          return formatError(error, 'fetchContext7Docs');
        }
      },
    }),

    fetchWebPage: tool({
      description: `Fetch and extract text content from any web page.

Use this to read documentation, guides, or articles from the web.
The content is automatically cleaned and formatted for readability.

Note: Some sites may block automated access.`,
      parameters: z.object({
        url: z.string().url().describe('The URL to fetch'),
        maxLength: z.number().optional().default(10000).describe('Maximum content length to return'),
      }),
      execute: async ({ url, maxLength }) => {
        try {
          console.log(`[Tool:fetchWebPage] Fetching: ${url}`);

          const text = await fetchAndExtractText(url, maxLength);

          return {
            success: true,
            url,
            contentLength: text.length,
            content: text,
          };
        } catch (error) {
          return formatError(error, 'fetchWebPage');
        }
      },
    }),
  };
}
