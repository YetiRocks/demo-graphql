<p align="center">
  <img src="https://cdn.prod.website-files.com/68e09cef90d613c94c3671c0/697e805a9246c7e090054706_logo_horizontal_grey.png" alt="Yeti" width="200" />
</p>

---

# demo-graphql

[![Yeti](https://img.shields.io/badge/Yeti-Demo-blue)](https://yetirocks.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> **[Yeti](https://yetirocks.com)** - The Performance Platform for Agent-Driven Development.
> Schema-driven APIs, real-time streaming, and vector search. From prompt to production.

**A fully interactive GraphQL explorer for a book catalog.** Editable queries, mutations, live SSE subscriptions, syntax-highlighted editors, and real-time result merging — all generated from a single schema file.

demo-graphql demonstrates yeti's built-in GraphQL engine on a rich relational domain: Authors write Books, Publishers publish them, Readers leave Reviews, and Categories organize everything. The React frontend provides a two-panel IDE with syntax highlighting, one-click execution, and live subscription toggling. The backend is zero custom code — every query, mutation, subscription, and REST endpoint is auto-generated from `graph.graphql`.

---

## Why demo-graphql

GraphQL tooling typically requires a separate server (Apollo, Hasura, Postgraphile), a database, resolver boilerplate, and subscription infrastructure. Getting a working GraphQL explorer with mutations and live subscriptions usually means assembling four or five services.

demo-graphql collapses all of that into one yeti application:

- **Zero resolvers** — yeti auto-generates queries, mutations, and subscriptions from `@export(graphql: true)` schema directives. No resolver code to write or maintain.
- **Nested relationships** — `@relationship` directives produce joins automatically. Query `Author -> books -> reviews` in a single GraphQL request.
- **Live subscriptions via SSE** — subscribe to any table and receive real-time updates as server-sent events. The frontend merges changes into displayed results automatically.
- **Syntax-highlighted editor** — editable query and mutation panels with highlight.js GraphQL grammar, transparent textarea overlay, and synchronized scrolling.
- **Dual REST + GraphQL** — every table is accessible via both GraphQL (`POST /demo-graphql/graphql`) and REST (`GET /demo-graphql/Book?limit=10`). Same schema, two protocols, zero duplication.
- **Seed data included** — 5 authors, 5 publishers, 10 books, 8 reviews, and 6 categories loaded on startup via `dataLoader`. Explore immediately, no setup.
- **Single schema file** — the entire data model, API surface, access rules, and transport configuration live in one 57-line GraphQL file.

---

## Quick Start

### 1. Install

```bash
cd ~/yeti/applications
git clone https://github.com/yetirocks/demo-graphql.git
```

Restart yeti. The frontend builds automatically on first load (`npm run build` via Vite) and is cached for subsequent starts.

### 2. Open the Explorer

Navigate to [https://localhost:9996/demo-graphql/](https://localhost:9996/demo-graphql/) in your browser. The two-panel IDE loads with a default query pre-filled.

### 3. Run a Query (curl)

```bash
curl -s -X POST https://localhost:9996/demo-graphql/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Author(id: \"author-1\") { id name bio books { id title publishedYear } } }"}' | jq
```

Response:
```json
{
  "data": {
    "Author": {
      "id": "author-1",
      "name": "Jane Austen",
      "bio": "English novelist known primarily for her six major novels...",
      "books": [
        {
          "id": "book-1",
          "title": "Pride and Prejudice",
          "publishedYear": 1813
        },
        {
          "id": "book-2",
          "title": "Sense and Sensibility",
          "publishedYear": 1811
        }
      ]
    }
  }
}
```

### 4. Run a Mutation (curl)

```bash
curl -s -X POST https://localhost:9996/demo-graphql/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { updateAuthor(id: \"author-1\", data: { bio: \"English novelist and one of the most widely read writers in English literature.\" }) { id name bio } }"}' | jq
```

Response:
```json
{
  "data": {
    "updateAuthor": {
      "id": "author-1",
      "name": "Jane Austen",
      "bio": "English novelist and one of the most widely read writers in English literature."
    }
  }
}
```

### 5. Query with Nested Relationships

```bash
curl -s -X POST https://localhost:9996/demo-graphql/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Book(id: \"book-1\") { title isbn price author { name country } publisher { name headquarters } reviews { rating title reviewer } } }"}' | jq
```

Response:
```json
{
  "data": {
    "Book": {
      "title": "Pride and Prejudice",
      "isbn": "978-0141439518",
      "price": 12.99,
      "author": {
        "name": "Jane Austen",
        "country": "England"
      },
      "publisher": {
        "name": "Penguin Random House",
        "headquarters": "New York, USA"
      },
      "reviews": [
        {
          "rating": 5,
          "title": "A timeless classic",
          "reviewer": "BookLover42"
        },
        {
          "rating": 4,
          "title": "Delightful read",
          "reviewer": "JaneAustenFan"
        }
      ]
    }
  }
}
```

### 6. List All Books via REST

```bash
curl -s "https://localhost:9996/demo-graphql/Book?limit=5" | jq
```

Response:
```json
[
  {
    "id": "book-1",
    "title": "Pride and Prejudice",
    "isbn": "978-0141439518",
    "publishedYear": 1813,
    "genre": "Romance",
    "price": 12.99,
    "authorId": "author-1",
    "publisherId": "pub-1"
  },
  {
    "id": "book-2",
    "title": "Sense and Sensibility",
    "isbn": "978-0141439662",
    "publishedYear": 1811,
    "genre": "Romance",
    "price": 11.99,
    "authorId": "author-1",
    "publisherId": "pub-1"
  }
]
```

### 7. Subscribe to Live Updates (SSE)

```bash
# In one terminal — subscribe to Author changes
curl -N "https://localhost:9996/demo-graphql/Author?stream=sse"

# In another terminal — trigger an update
curl -s -X POST https://localhost:9996/demo-graphql/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { updateAuthor(id: \"author-2\", data: { bio: \"Updated bio for Asimov\" }) { id name } }"}'
```

The SSE stream emits the updated Author record in real-time.

---

## Architecture

```
Browser (React + Vite)
    |
    +-- POST /demo-graphql/graphql -----> Yeti GraphQL Engine
    +-- GET  /demo-graphql/{Table} -----> Yeti REST Engine
    +-- SSE  Accept: text/event-stream -> Yeti SSE Transport
          |
          v
    +------------------------------------------------+
    |                 demo-graphql                    |
    |                                                |
    |   graph.graphql (schema)                       |
    |   +---------+  +-----------+  +----------+     |
    |   | Author  |  | Publisher |  |   Book   |     |
    |   +---------+  +-----------+  +----------+     |
    |        |              |         |    |          |
    |        +-- books -----+-- books-+    |          |
    |        |                        |    |          |
    |   +----------+           +----------+          |
    |   |  Review  |           | Category |          |
    |   +----------+           +----------+          |
    |                                                |
    |   @export(rest, graphql, public: [read])        |
    |   @relationship (auto-joins)                   |
    |   @indexed (secondary indexes)                 |
    +------------------------------------------------+
          |
          v
    Yeti (embedded RocksDB, GraphQL engine, SSE broker)
```

**Query path:** Browser sends GraphQL POST -> yeti parses query against schema -> resolves fields + relationships from RocksDB -> returns JSON response.

**Mutation path:** Browser sends GraphQL mutation -> yeti validates input against schema -> writes to RocksDB -> broadcasts change via SSE -> returns mutated record.

**Subscription path:** Browser sends subscription with `Accept: text/event-stream` -> yeti opens SSE stream on the target table -> any mutation on that table pushes events to all subscribers -> frontend merges updates into displayed results.

---

## Features

### Interactive Query Editor

The frontend provides a split-panel IDE for GraphQL operations:

- **Syntax highlighting** — custom highlight.js grammar for GraphQL keywords, types, variables, directives, and punctuation
- **Editable textarea overlay** — transparent textarea layered over a highlighted `<pre>` block with synchronized scrolling
- **One-click execution** — play button sends the query/mutation to `POST /demo-graphql/graphql`
- **Status badges** — real-time feedback: "Ready", "Error", "Success", "Live: message"
- **JSON result rendering** — response data displayed with color-coded syntax highlighting

### GraphQL Queries

Auto-generated from `@export(graphql: true)` directives. Every table gets:

| Operation | Example |
|-----------|---------|
| Single record | `{ Author(id: "author-1") { name bio } }` |
| All records | `{ Authors { id name country } }` |
| Nested to-many | `{ Author(id: "author-1") { books { title } } }` |
| Nested to-one | `{ Book(id: "book-1") { author { name } publisher { name } } }` |
| Deep nesting | `{ Author(id: "author-1") { books { reviews { rating reviewer } } } }` |

### GraphQL Mutations

Auto-generated create, update, and delete mutations for every table:

| Operation | Example |
|-----------|---------|
| Create | `mutation { createBook(data: { id: "book-11", title: "Emma", isbn: "978-0141439587", authorId: "author-1" }) { id title } }` |
| Update | `mutation { updateAuthor(id: "author-1", data: { bio: "Updated bio" }) { id name bio } }` |
| Delete | `mutation { deleteReview(id: "review-1") { id } }` |

### Live SSE Subscriptions

The subscribe button in the UI:

1. Executes the current query to populate initial results
2. Extracts the target table from the query text
3. Opens an SSE stream via `POST /demo-graphql/graphql` with `Accept: text/event-stream`
4. Merges incoming events into the displayed result set (by matching record `id`)
5. Flashes a "Live: message" badge on each update

Mutate a record in the bottom panel and watch the query results update in real-time in the top panel.

### REST API (Auto-Generated)

Every `@export(rest: true)` table also gets full REST endpoints:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/demo-graphql/Author` | GET, POST | List/create authors |
| `/demo-graphql/Author/{id}` | GET, PUT, DELETE | Read/update/delete an author |
| `/demo-graphql/Publisher` | GET, POST | List/create publishers |
| `/demo-graphql/Publisher/{id}` | GET, PUT, DELETE | Read/update/delete a publisher |
| `/demo-graphql/Book` | GET, POST | List/create books |
| `/demo-graphql/Book/{id}` | GET, PUT, DELETE | Read/update/delete a book |
| `/demo-graphql/Review` | GET, POST | List/create reviews |
| `/demo-graphql/Review/{id}` | GET, PUT, DELETE | Read/update/delete a review |
| `/demo-graphql/Category` | GET, POST | List/create categories |
| `/demo-graphql/Category/{id}` | GET, PUT, DELETE | Read/update/delete a category |

### Public Read Access

All tables declare `public: [read]` in their `@export` directive. Read operations (queries, GET requests, SSE subscriptions) work without authentication. Write operations (mutations, POST/PUT/DELETE) require authentication in production.

---

## Data Model

### Author

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | ID! | Primary key | Unique author identifier (e.g., "author-1") |
| `name` | String! | -- | Author's full name |
| `email` | String | Yes | Contact email |
| `bio` | String | -- | Biographical description |
| `country` | String | -- | Country of origin |
| `books` | [Book] | Relationship | Books written by this author (via `authorId`) |

**Seed data:** 5 authors — Jane Austen, Isaac Asimov, Agatha Christie, Gabriel Garcia Marquez, Haruki Murakami.

### Publisher

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | ID! | Primary key | Unique publisher identifier (e.g., "pub-1") |
| `name` | String! | -- | Publisher name |
| `founded` | Int | -- | Year founded |
| `headquarters` | String | -- | Location of headquarters |
| `books` | [Book] | Relationship | Books published (via `publisherId`) |

**Seed data:** 5 publishers — Penguin Random House, HarperCollins, Simon & Schuster, Vintage Books, Knopf.

### Book

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | ID! | Primary key | Unique book identifier (e.g., "book-1") |
| `title` | String! | -- | Book title |
| `isbn` | String! | Yes | ISBN-13 number |
| `publishedYear` | Int | -- | Year of publication |
| `genre` | String | Yes | Genre classification |
| `price` | Float | -- | Cover price (USD) |
| `authorId` | ID! | Yes | Foreign key to Author |
| `publisherId` | ID | Yes | Foreign key to Publisher |
| `author` | Author | Relationship | The author (via `authorId`) |
| `publisher` | Publisher | Relationship | The publisher (via `publisherId`) |
| `reviews` | [Review] | Relationship | Reader reviews (via `bookId`) |

**Seed data:** 10 books across 5 genres — Romance, Science Fiction, Mystery, Magical Realism, Literary Fiction. Prices range from $11.99 to $16.99.

### Review

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | ID! | Primary key | Unique review identifier (e.g., "review-1") |
| `bookId` | ID! | Yes | Foreign key to Book |
| `rating` | Int! | -- | Rating (1-5 stars) |
| `title` | String | -- | Review headline |
| `content` | String | -- | Review body text |
| `reviewer` | String | -- | Reviewer handle |
| `createdAt` | String | -- | ISO 8601 timestamp |
| `book` | Book | Relationship | The reviewed book (via `bookId`) |

**Seed data:** 8 reviews across 6 books. Ratings range from 4 to 5 stars.

### Category

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | ID! | Primary key | Unique category identifier (e.g., "cat-1") |
| `name` | String! | Yes | Category name |
| `description` | String | -- | Category description |
| `parentId` | ID | Yes | Parent category for hierarchy |

**Seed data:** 6 categories — Fiction (root), with Science Fiction, Mystery, Romance, Literary Fiction, and Magical Realism as children.

### Relationship Diagram

```
Category (self-referencing via parentId)
    Fiction
    +-- Science Fiction
    +-- Mystery
    +-- Romance
    +-- Literary Fiction
    +-- Magical Realism

Author --< Book >-- Publisher
              |
           Review
```

---

## Configuration

### config.yaml

```yaml
name: "GraphQL Demo"
app_id: "demo-graphql"
version: "1.0.0"
description: "Interactive GraphQL explorer with editable queries, mutations, and live SSE subscriptions"
schemas:
  path: schemas/graph.graphql

dataLoader: data/*.json

static:
  path: web
  route: /
  spa: true
  build:
    source: source
    command: npm run build
```

| Key | Value | Purpose |
|-----|-------|---------|
| `schemas` | `schemas/graph.graphql` | Single schema defining all 5 tables with relationships |
| `dataLoader` | `data/*.json` | Loads seed data from 5 JSON files on startup |
| `static_files.path` | `web` | Serves built React app from `web/` directory |
| `static_files.spa` | `true` | SPA mode: serves `index.html` for all unmatched routes |
| `static_files.build` | `source` -> `npm run build` | Auto-builds frontend from `source/` on first load |

### Schema Directives

| Directive | Purpose |
|-----------|---------|
| `@table(database: "demo-graphql")` | Creates a RocksDB-backed table in the `demo-graphql` database |
| `@export(rest: true, graphql: true, public: [read])` | Generates REST endpoints, GraphQL operations, and allows unauthenticated reads |
| `@primaryKey` | Marks the `id` field as the primary key |
| `@indexed` | Creates a secondary index for filtered queries |
| `@relationship(from: "fieldId")` | To-one join: resolves a parent record from a foreign key |
| `@relationship(to: "fieldId")` | To-many join: resolves child records that reference this record |

---

## Project Structure

```
demo-graphql/
+-- config.yaml              # App configuration
+-- schemas/
|   +-- graph.graphql        # Author, Publisher, Book, Review, Category
+-- data/
|   +-- authors.json         # 5 seed authors
|   +-- books.json           # 10 seed books
|   +-- publishers.json      # 5 seed publishers
|   +-- reviews.json         # 8 seed reviews
|   +-- categories.json      # 6 seed categories (hierarchical)
+-- source/                  # React/Vite frontend
    +-- index.html
    +-- package.json
    +-- vite.config.ts
    +-- tsconfig.json
    +-- src/
        +-- main.tsx          # App entry point
        +-- App.tsx           # Layout with nav + GraphQL page
        +-- theme.ts          # Theme configuration
        +-- utils.ts          # JSON syntax highlighting utility
        +-- index.css         # Global styles
        +-- yeti.css          # Yeti design system styles
        +-- pages/
        |   +-- GraphqlPage.tsx   # Query/mutation/subscription IDE
        +-- components/
            +-- Footer.tsx    # Footer component
```

---

## Development

```bash
cd ~/yeti/applications/demo-graphql/source

# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Build for production (outputs to ../web/)
npm run build
```

The Vite dev server proxies API requests to the running yeti instance. Edit queries and components with hot module replacement.

---

## Comparison

| | demo-graphql | Traditional GraphQL Setup |
|---|---|---|
| **Schema to API** | One `.graphql` file, zero resolvers | Schema + resolvers + type definitions |
| **Relationships** | `@relationship` directive, auto-resolved | Manual resolver functions for each join |
| **Subscriptions** | `@export(graphql: true)` enables SSE automatically | WebSocket server, PubSub library, subscription resolvers |
| **REST fallback** | `@export(rest: true)` adds REST alongside GraphQL | Separate REST layer or none |
| **Database** | Embedded RocksDB, zero config | PostgreSQL/MongoDB setup, migrations, connection pooling |
| **Seed data** | `dataLoader: data/*.json` loads on startup | Migration scripts, seed commands, fixture files |
| **Frontend** | SPA auto-built from `source/` directory | Separate build pipeline, deploy step |
| **Auth** | `public: [read]` in schema directive | Auth middleware, context injection, per-resolver checks |
| **Infrastructure** | Single yeti binary | GraphQL server + database + subscription transport |

---

Built with [Yeti](https://yetirocks.com) | The Performance Platform for Agent-Driven Development
