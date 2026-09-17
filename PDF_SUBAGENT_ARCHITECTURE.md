# PDF Sub-Agent Tool — Architecture & Design

> A single tool for the Relie deep coding agent that processes one or multiple PDF URLs, extracts text/images, generates per-page markdown summaries using an internal deep agent, uploads everything to Supabase, and saves data to user chat history.

---

## 1. System Overview

### What This Is

A **single tool** (`process_pdfs`) that the main Relie deep coding agent can call. It accepts one or multiple PDF URLs and:

1. Fetches each PDF one at a time
2. Splits each PDF into pages using `pdf` package
3. Classifies each page (pure text vs. has math/images/overlays)
4. Extracts text programmatically for pure-text pages
5. Converts non-pure-text pages to images and uploads to Supabase
6. Spawns an **internal deep agent** that generates a markdown summary file per PDF
7. Uploads the markdown file to Supabase
8. Saves PDF data to user chat history
9. Returns the markdown file URLs to the main agent

A **second tool** (`get_pdf_page_markdown`) lets the main agent retrieve specific page markdown files on-demand.

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MAIN DEEP AGENT (Relie AI)                                             │
│  User: "Build me a homepage from these PDFs"                            │
│  Calls: process_pdfs({ pdfUrls: ["url1", "url2"] })                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  TOOL: process_pdfs                                                     │
│                                                                         │
│  For each PDF URL:                                                      │
│    1. Fetch PDF binary                                                  │
│    2. Split into pages using `pdf` package                              │
│    3. For each page:                                                    │
│       - Classify: pure text vs. has math/images/overlays                │
│       - If pure text: extract text programmatically                     │
│       - If not: convert to image, upload to Supabase                    │
│    4. Spawn internal deep agent with:                                   │
│       - Text data (page number → text)                                  │
│       - Image URLs (page number → Supabase URL)                         │
│    5. Internal agent generates markdown file                            │
│    6. Upload markdown to Supabase                                       │
│    7. Save PDF data to user chat history                                │
│    8. Return markdown URL                                               │
│                                                                         │
│  Returns: { pdfs: [{ url, markdownUrl, totalPages }] }                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MAIN AGENT RECEIVES                                                    │
│  - PDF markdown URLs (one per PDF)                                      │
│  - Attached to user prompt                                              │
│  - Can call get_pdf_page_markdown to retrieve specific pages            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. File Structure

```
src/
├── features/deepAgent/
│   ├── agent.ts                          # Main Relie deep agent
│   ├── prompt.ts                         # Main agent system prompt
│   └── tools/
│       ├── index.ts                      # Tool registry
│       └── pdfTools/
│           ├── index.ts                  # PDF tools barrel
│           ├── processPdfsTool.ts        # Main PDF processing tool
│           └── getPdfPageMarkdownTool.ts # Retrieve specific page markdown
│
└── services/
    └── pdfProcessor/                     # PDF processing service
        ├── index.ts                      # Main orchestrator
        ├── fetcher.ts                    # Fetch PDF from URL
        ├── splitter.ts                   # Split PDF into pages
        ├── classifier.ts                 # Classify page type
        ├── textExtractor.ts              # Extract text from pure-text pages
        ├── imageRenderer.ts              # Convert non-text pages to images
        ├── uploader.ts                   # Upload to Supabase
        ├── markdownAgent.ts              # Internal deep agent for markdown generation
        └── chatHistorySaver.ts           # Save PDF data to user chat history
```

---

## 3. Database Design

### 3.1 Tables

**`pdf_documents`** — Stores PDF metadata
- `id` (UUID, primary key)
- `project_id` (UUID, foreign key to projects)
- `user_id` (UUID, foreign key to auth.users)
- `chat_id` (TEXT) — Links PDF to specific chat/thread
- `pdf_url` (TEXT) — Original PDF URL
- `doc_id` (TEXT, unique) — Internal document identifier
- `original_filename` (TEXT)
- `total_pages` (INTEGER)
- `markdown_url` (TEXT) — Supabase URL of markdown summary
- `status` (TEXT) — processing | ready | failed
- `error_message` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**`pdf_pages`** — Stores per-page data
- `id` (UUID, primary key)
- `pdf_document_id` (UUID, foreign key to pdf_documents)
- `page_number` (INTEGER)
- `page_type` (TEXT) — text | visual
- `text_content` (TEXT) — For pure-text pages
- `image_url` (TEXT) — For visual pages
- `created_at` (TIMESTAMPTZ)
- Unique constraint on (pdf_document_id, page_number)

**`chat_messages`** — Stores chat history including PDF attachments
- `id` (UUID, primary key)
- `chat_id` (TEXT)
- `user_id` (UUID, foreign key to auth.users)
- `role` (TEXT) — user | assistant | system | attachment
- `content` (TEXT) — JSON for attachments
- `created_at` (TIMESTAMPTZ)

### 3.2 Row Level Security (RLS)

- Users can only view/insert/update/delete their own PDF documents
- Users can only view PDF pages belonging to their own PDF documents
- Users can only view/insert their own chat messages

### 3.3 Storage Buckets

**`pdfs`** (public read, authenticated write)
- Path pattern: `{user_id}/{project_id}/{doc_id}/...`
- Files: `page-001.png`, `page-002.png`, `markdown.md`

**`assets`** (public read, authenticated write) — already exists

---

## 4. PDF Processing Service Design

### 4.1 `fetcher.ts`

**Purpose:** Fetch a PDF from a URL and return as binary buffer.

**Input:** PDF URL (string)
**Output:** PDF buffer (Buffer)
**Error handling:** Throw error if fetch fails

### 4.2 `splitter.ts`

**Purpose:** Split a PDF into individual page buffers.

**Input:** PDF buffer
**Output:** Array of `{ pageNumber, pdfBuffer }`
**Library:** `pdf-lib` (PDFDocument.copyPages)

### 4.3 `classifier.ts`

**Purpose:** Classify each page as "text" or "visual".

**Input:** PDF buffer, page number
**Output:** `{ pageNumber, type, hasMath, hasImages, hasTextOverlay, textLength }`

**Classification Logic:**
- **Pure text:** textLength > 50, no images, no paths, no math
- **Visual:** has images, math, text overlays, or complex graphics

**Detection Methods:**
- Text operators: `Tj`, `TJ`, `Tm`, `Td`, `T*`, `BT`, `ET`
- Image operators: `Do`, `BI`, `EI`, `ID`
- Path operators: `m`, `l`, `c`, `v`, `y`, `h`, `re`, `S`, `s`, `f`, `F`, `B`, `B*`
- Math symbols: `∫∑∏√∂∇±×÷≠≈∞πθαβγδ`

### 4.4 `textExtractor.ts`

**Purpose:** Extract text from pure-text pages programmatically.

**Input:** PDF buffer, page number
**Output:** Text string
**Library:** `pdf-parse`

**Note:** Only called for pages classified as "text". Text is saved as a string variable with page number.

### 4.5 `imageRenderer.ts`

**Purpose:** Convert non-pure-text pages to PNG images.

**Input:** PDF buffer, page number
**Output:** `{ pageNumber, pngBuffer, width, height }`
**Library:** `pdfjs-dist`
**DPI:** 200 (scale = 200/72)

### 4.6 `uploader.ts`

**Purpose:** Upload files to Supabase Storage.

**Input:** userId, projectId, docId, filename, buffer, contentType
**Output:** `{ url, path }`
**Bucket:** `pdfs`
**Path pattern:** `{userId}/{projectId}/{docId}/{filename}`

### 4.7 `markdownAgent.ts`

**Purpose:** Internal deep agent that generates markdown summary file.

**Input:** PDF URL, array of `{ pageNumber, type, text?, imageUrl? }`
**Output:** Markdown string

**System Prompt:**
```
You are a PDF document analyzer. Your job is to create a comprehensive markdown summary file for a PDF document.

You will receive:
1. Text content extracted from pure-text pages (with page numbers)
2. Image URLs for visual pages (with page numbers)

Your task:
1. Review all the text content and image URLs
2. For each page, create a section in the markdown file with:
   - Page number as heading
   - Text content (if available)
   - Image link (if available)
3. At the end, create a SHORT summary (10-15 lines) describing what each page contains

Output format:

# PDF Document Summary

## Page 1
[Text content if available]
![Page 1](image-url-if-available)

## Page 2
[Text content if available]
![Page 2](image-url-if-available)

...

## Overall Summary
[10-15 lines describing what each page contains with image links]
```

**Model:** Vision LLM (e.g., google/gemini-2.5-flash)

### 4.8 `chatHistorySaver.ts`

**Purpose:** Save PDF data to user chat history.

**Input:** userId, projectId, chatId, pdfUrl, docId, markdownUrl, totalPages, originalFilename
**Output:** void

**Saves to:**
1. `pdf_documents` table with `chat_id` linking to specific chat
2. `chat_messages` table as attachment message

### 4.9 `index.ts` (Main Orchestrator)

**Purpose:** Orchestrate the entire PDF processing pipeline.

**Input:** `{ pdfUrl, userId, projectId, chatId, originalFilename? }`
**Output:** `{ docId, pdfUrl, markdownUrl, totalPages }`

**Pipeline Steps:**
1. Fetch PDF
2. Split into pages
3. Classify each page
4. Extract text from text pages
5. Convert visual pages to images and upload
6. Build page data (text + image URLs)
7. Spawn internal deep agent to generate markdown
8. Upload markdown to Supabase
9. Save per-page data to database
10. Save PDF data to user chat history
11. Return markdown URL

**Multi-PDF Handling:** Process PDFs sequentially (one at a time), continue on error.

---

## 5. Main Tool Design

### 5.1 `processPdfsTool`

**Purpose:** Main entry point for the main Relie deep agent to process PDFs.

**Input Schema:**
```json
{
  "pdfUrls": ["string"],      // Array of PDF URLs
  "projectId": "string",      // Project ID
  "chatId": "string"          // Chat/thread ID for chat history
}
```

**Output Schema:**
```json
{
  "success": true,
  "pdfs": [
    {
      "pdfUrl": "string",
      "docId": "string",
      "markdownUrl": "string",
      "totalPages": "number"
    }
  ]
}
```

**Authentication:**
- Verify user is authenticated
- Verify user owns the project

**Behavior:**
- Calls `processPdfs` service with all PDF URLs
- Returns markdown URLs to main agent

### 5.2 `getPdfPageMarkdownTool`

**Purpose:** Retrieve markdown content for a specific page from a PDF's markdown file.

**Input Schema:**
```json
{
  "markdownUrl": "string",    // Supabase URL of markdown file
  "pageNumber": "number"      // 1-based page number
}
```

**Output:** Markdown string for the specific page

**Behavior:**
- Fetches markdown file from Supabase
- Extracts the section for the requested page number
- Returns the page section

### 5.3 `index.ts` (Barrel Export)

**Purpose:** Export both PDF tools as a single object.

**Exports:**
- `process_pdfs` tool
- `get_pdf_page_markdown` tool

---

## 6. Main Agent Integration Design

### 6.1 Tool Registry Update

Add PDF tools to the main agent's tool registry:

```
tools = {
  // ... existing tools ...
  process_pdfs,
  get_pdf_page_markdown,
}
```

### 6.2 System Prompt Update

Add PDF processing section to the main agent's system prompt:

```
## PDF Processing

When the user provides PDF URLs, you have access to 2 tools:

1. **process_pdfs** — Processes one or multiple PDF URLs.
   - Use FIRST when the user provides PDF URLs.
   - Returns markdown file URLs (one per PDF).
   - Each markdown file contains per-page summaries with text and image links.
   - PDF data is saved to user chat history.

2. **get_pdf_page_markdown** — Retrieves the markdown content for a specific page.
   - Use AFTER process_pdfs when you need detailed information about a specific page.
   - Returns the markdown section for that page.

**Workflow:**
1. Call process_pdfs with the PDF URLs, projectId, and chatId
2. Review the markdown URLs returned
3. If you need details about a specific page, call get_pdf_page_markdown
4. If you need to see the actual page image, fetch the image URL from the markdown
5. Use the information to complete the user's task

**Important:**
- The markdown files contain per-page summaries with text and image links
- You can fetch image URLs directly to view the actual page
- You can call get_pdf_page_markdown to get detailed markdown for a specific page
- Decide whether you need the markdown summary or the actual page image based on the task
```

---

## 7. Dependencies

**Required packages:**
- `pdf-lib` — PDF manipulation (splitting, copying pages)
- `pdfjs-dist` — PDF rendering to images
- `pdf-parse` — Text extraction from PDFs
- `@supabase/supabase-js` — Supabase client (already installed)

**Environment variables:**
- `OPENROUTER_API_KEY` — For vision LLM (already configured)
- `SUPABASE_SERVICE_ROLE_KEY` — For server-side storage uploads

---

## 8. Complete Workflow Design

### 8.1 User Interaction Flow

```
User: "Build me a homepage from these PDFs: 
       https://example.com/design1.pdf, 
       https://example.com/design2.pdf"
```

### 8.2 Main Agent Decision Flow

```
1. Main agent receives user prompt with PDF URLs
2. Main agent decides to call process_pdfs
3. Main agent calls:
   process_pdfs({
     pdfUrls: ["url1", "url2"],
     projectId: "proj_123",
     chatId: "chat_456"
   })
```

### 8.3 process_pdfs Internal Flow

```
For each PDF URL:
  1. Fetch PDF binary
  2. Split into pages
  3. Classify each page (text vs visual)
  4. For text pages: extract text programmatically
  5. For visual pages: convert to image, upload to Supabase
  6. Build page data array (text + image URLs)
  7. Spawn internal deep agent with page data
  8. Internal agent generates markdown summary
  9. Upload markdown to Supabase
  10. Save per-page data to pdf_pages table
  11. Save PDF metadata to pdf_documents table
  12. Save PDF attachment to chat_messages table
  13. Return markdown URL
```

### 8.4 Main Agent Post-Processing Flow

```
1. Main agent receives markdown URLs
2. Main agent reviews markdown content
3. Main agent decides:
   - Option A: Call get_pdf_page_markdown for specific page details
   - Option B: Fetch image URL directly to view actual page
   - Option C: Use markdown summary for general understanding
4. Main agent uses information to complete user's task
```

### 8.5 Chat History Persistence

```
When process_pdfs is called:
  - PDF metadata saved to pdf_documents with chat_id
  - PDF attachment saved to chat_messages
  - User can later retrieve all PDFs from a specific chat
  - Main agent can retrieve PDF context from chat history
```

---

## 9. Chat History Integration Design

### 9.1 How PDF Data is Saved

When `process_pdfs` is called, the PDF data is saved in two places:

1. **`pdf_documents` table** — Stores PDF metadata with `chat_id` linking it to the specific chat/thread
2. **`chat_messages` table** — Stores an attachment message in the chat history

### 9.2 Benefits of Chat History Integration

- Users can see which PDFs were uploaded in which chat
- The main agent can retrieve PDF context from chat history
- Proper user isolation via RLS policies
- Conversation continuity across sessions

### 9.3 Retrieving PDFs from Chat History

**Query all PDFs for a specific chat:**
- Filter `pdf_documents` by `chat_id` and `user_id`

**Query all chat messages including PDF attachments:**
- Filter `chat_messages` by `chat_id` and `user_id`
- Order by `created_at` ascending

---

## 10. Design Decisions

### 10.1 Why a Single Tool?

- Simpler API for the main agent
- Atomic operation (all PDFs processed together)
- Easier to track in chat history

### 10.2 Why an Internal Deep Agent?

- Vision LLM can review both text and images together
- Generates coherent markdown summary
- Handles complex page layouts intelligently

### 10.3 Why Save to Chat History?

- Conversation continuity
- User can reference PDFs later
- Main agent can retrieve context from history

### 10.4 Why Two Tools (process_pdfs + get_pdf_page_markdown)?

- `process_pdfs` — Heavy operation, called once
- `get_pdf_page_markdown` — Light operation, called on-demand
- Main agent decides when to fetch specific pages

### 10.5 Why Sequential PDF Processing?

- Avoids memory overload
- Easier error handling
- Predictable resource usage

---

**This document is complete. Another AI coding agent can read this and implement the entire system based on the architecture and design described above.**
