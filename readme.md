# web-compass

MCP server for AI agents — web search and content extraction via Yandex and Google, optimized for RU/CIS and global results.

## Why

Most AI search tools are built around English-language web. This project adds first-class support for Russian and CIS search via Yandex alongside global Google search, making it useful for agents that need to work with RU/CIS content.

## Tools

Each tool is available via MCP (primary) and REST API (secondary).

### `search_yandex`
Search the web via Yandex. Optimized for Russian and CIS results.
- `query` — search query
- `topK` — number of results (1–10)
- `region` — `russia` (default) or `cis`

### `search_google`
Search the web globally via Google.
- `query` — search query
- `topK` — number of results (1–10)

### `extract`
Fetch pages by URL and extract the main readable content.
- `urls` — list of URLs (1–10)

### `search_and_extract_yandex`
Search via Yandex and extract content from results in one pipeline.
- `query` — search query
- `topK` — number of results (1–10)
- `region` — `russia` (default) or `cis`

### `search_and_extract_google`
Search via Google and extract content from results in one pipeline.
- `query` — search query
- `topK` — number of results (1–10)

Each tool also has a corresponding REST endpoint:
`POST /search-yandex`, `POST /search-google`, `POST /extract`, `POST /search-and-extract-yandex`, `POST /search-and-extract-google`

## Connecting to an MCP client

Add the server to your MCP client config. Example for Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "web-compass": {
      "url": "http://localhost:3000/mcp",
      "transportType": "streamable-http"
    }
  }
}
```

For other clients (Cursor, Windsurf, etc.) — point to `http://your-host:3000/mcp` with `streamable-http` transport.

## Under the hood

Search is powered by [SerpAPI](https://serpapi.com) which provides access to Yandex and Google search results without scraping. Content extraction uses [Mozilla Readability](https://github.com/mozilla/readability) — the same engine behind Firefox Reader Mode.

A SerpAPI key is required. Get one at [serpapi.com](https://serpapi.com).

Add it to your `.env`:
```
SERPAPI_KEY=your_key_here
```

See `.env.example` for the full list of required environment variables.

## Running

Development:
```bash
npm run start:dev
```

Production:
```bash
npm run build && npm run start:prod
```
