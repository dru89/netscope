# HAR Format

HAR (HTTP Archive) is a JSON-based format for recording HTTP transactions. Netscope supports the **HAR 1.2 specification**.

## Specification

The full spec is defined at: http://www.softwareishard.com/blog/har-12-spec/

## Structure Overview

A HAR file is a JSON object with a single top-level `log` property:

```json
{
  "log": {
    "version": "1.2",
    "creator": { "name": "...", "version": "..." },
    "browser": { "name": "...", "version": "..." },
    "pages": [...],
    "entries": [...]
  }
}
```

### Key Objects

**`log.entries[]`** -- The core data. Each entry represents one HTTP request/response pair:

| Field             | Type              | Description                                  |
| ----------------- | ----------------- | -------------------------------------------- |
| `startedDateTime` | string (ISO 8601) | When the request started                     |
| `time`            | number            | Total elapsed time in milliseconds           |
| `request`         | object            | Request details (method, URL, headers, body) |
| `response`        | object            | Response details (status, headers, content)  |
| `timings`         | object            | Timing breakdown for the request             |
| `cache`           | object            | Cache usage info                             |
| `serverIPAddress` | string            | IP address of the server                     |
| `connection`      | string            | Connection ID (for keep-alive tracking)      |

**`entry.request`** -- Request details:

| Field         | Type   | Description                                     |
| ------------- | ------ | ----------------------------------------------- |
| `method`      | string | HTTP method (GET, POST, etc.)                   |
| `url`         | string | Full request URL                                |
| `httpVersion` | string | HTTP version (e.g., "HTTP/1.1", "h2")           |
| `headers`     | array  | Request headers as `{name, value}` pairs        |
| `queryString` | array  | Query parameters as `{name, value}` pairs       |
| `postData`    | object | Request body (if present)                       |
| `headersSize` | number | Size of headers in bytes (-1 if unknown)        |
| `bodySize`    | number | Size of request body in bytes (-1 if unknown)   |
| `cookies`     | array  | Request cookies as `{name, value, ...}` objects |

**`entry.response`** -- Response details:

| Field              | Type   | Description                                  |
| ------------------ | ------ | -------------------------------------------- |
| `status`           | number | HTTP status code (200, 404, etc.)            |
| `statusText`       | string | Status text ("OK", "Not Found", etc.)        |
| `headers`          | array  | Response headers as `{name, value}` pairs    |
| `content`          | object | Response body content                        |
| `content.size`     | number | Uncompressed body size in bytes              |
| `content.mimeType` | string | MIME type of the response                    |
| `content.text`     | string | Response body text (may be base64 encoded)   |
| `content.encoding` | string | Encoding (e.g., "base64")                    |
| `redirectURL`      | string | Redirect target URL (if 3xx)                 |
| `headersSize`      | number | Size of response headers in bytes            |
| `bodySize`         | number | Compressed/transfer body size in bytes       |
| `cookies`          | array  | Response cookies (Set-Cookie headers parsed) |

**`entry.timings`** -- Timing breakdown in milliseconds:

| Field     | Description                            | Color in Waterfall |
| --------- | -------------------------------------- | ------------------ |
| `blocked` | Time spent in queue/blocked            | Grey               |
| `dns`     | DNS resolution time                    | Teal               |
| `connect` | TCP connection time (includes TLS)     | Orange             |
| `ssl`     | TLS handshake time (subset of connect) | Purple             |
| `send`    | Time to send the request               | Light blue         |
| `wait`    | Waiting for response (TTFB)            | Green              |
| `receive` | Time to download the response          | Blue               |

Values of `-1` indicate the phase did not apply to this request (e.g., `dns` is `-1` for requests reusing an existing connection).

## How Netscope Parses HAR Files

Parsing happens in `src/utils/har.ts` in the `parseHar()` function:

1. The raw JSON string is parsed with `JSON.parse()`
2. Validation checks that `log` and `log.entries` exist
3. Each entry is enriched with computed fields:
   - `_index` -- A stable numeric index for selection tracking
   - `_url` -- A parsed `URL` object for extracting hostname, pathname, etc.

## Content Type Detection

The app classifies each entry into a content type category based on the response MIME type and URL:

| Category     | Matched MIME types / URL patterns                         |
| ------------ | --------------------------------------------------------- |
| `document`   | `text/html`                                               |
| `stylesheet` | `text/css`                                                |
| `script`     | `application/javascript`, `application/ecmascript`        |
| `image`      | `image/*`, `svg`, `.png`, `.jpg`, `.gif`, `.webp`, `.ico` |
| `font`       | `font/*`, `woff`, `ttf`, `otf`                            |
| `xhr`        | `application/json`, `application/xml`                     |
| `media`      | `video/*`, `audio/*`                                      |
| `manifest`   | `manifest`                                                |
| `other`      | Anything not matching the above                           |

This classification drives the type badges in the request list, the content type filter buttons in the toolbar, and the breakdown in the summary bar.

## Size Calculations

Two size metrics are computed for each entry:

- **Transfer size** -- `response.headersSize + response.bodySize` (the compressed/on-the-wire size)
- **Resource size** -- `response.content.size` (the uncompressed size)

Negative values (meaning "unknown") are clamped to 0.

## Generating HAR Files

HAR files can be exported from:

- **Chrome DevTools** -- Network tab > right-click > "Save all as HAR with content"
- **Firefox DevTools** -- Network tab > gear icon > "Save All As HAR"
- **Safari DevTools** -- Network tab > Export button
- **Charles Proxy** -- File > Export Session > HTTP Archive (.har)
- **Fiddler** -- File > Export > HTTPArchive
- **`curl`** -- Using `--write-out` with timing variables (partial HAR)
