<p align="center">
  <img src="https://cdn.prod.website-files.com/68e09cef90d613c94c3671c0/697e805a9246c7e090054706_logo_horizontal_grey.png" alt="Yeti" width="200" />
</p>

---

# demo-graphql

[![Yeti](https://img.shields.io/badge/Yeti-Application-blue)](https://yetirocks.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> **[Yeti](https://yetirocks.com)** — The Performance Platform for Agent-Driven Development.
> Schema-driven APIs, real-time streaming, and vector search. From prompt to production.

Interactive GraphQL explorer with editable queries, mutations, and live SSE subscriptions on a book catalog schema.

## Features

- Queries with nested relationships (Book -> Author -> Publisher)
- Mutations (create, update, delete)
- Live SSE subscriptions
- Apollo-compatible introspection

## Installation

```bash
cd ~/yeti/applications
git clone https://github.com/yetirocks/demo-graphql.git
cd demo-graphql/source
npm install
npm run build
```

## Project Structure

```
demo-graphql/
├── config.yaml              # App configuration
├── schemas/
│   └── graph.graphql        # Author, Publisher, Book, Review, Category
├── data/
│   ├── authors.json         # Seed author data
│   ├── books.json           # Seed book catalog
│   ├── publishers.json      # Seed publisher data
│   ├── reviews.json         # Seed review data
│   └── categories.json      # Seed category data
└── source/                  # React/Vite frontend
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── src/
```

## Configuration

```yaml
name: "GraphQL Demo"
app_id: "demo-graphql"
version: "1.0.0"
description: "Interactive GraphQL explorer with editable queries, mutations, and live SSE subscriptions"
enabled: true
rest: true
graphql: true
ws: true
sse: true

schemas:
  - schemas/graph.graphql

dataLoader: data/*.json

static_files:
  path: web
  route: /
  index: index.html
  notFound:
    file: index.html
    statusCode: 200
  build:
    sourceDir: source
    command: npm run build
```

## Schema

**graph.graphql** -- Book catalog with relationships:
```graphql
type Author @table(database: "demo-graphql") @export(rest: true, graphql: true) {
    id: ID! @primaryKey
    name: String!
    email: String @indexed
    bio: String
    country: String
    books: [Book] @relationship(to: "authorId")
}

type Publisher @table(database: "demo-graphql") @export(rest: true, graphql: true) {
    id: ID! @primaryKey
    name: String!
    founded: Int
    headquarters: String
    books: [Book] @relationship(to: "publisherId")
}

type Book @table(database: "demo-graphql") @export(rest: true, graphql: true) {
    id: ID! @primaryKey
    title: String!
    isbn: String! @indexed
    publishedYear: Int
    genre: String @indexed
    price: Float
    authorId: ID! @indexed
    publisherId: ID @indexed
    author: Author @relationship(from: "authorId")
    publisher: Publisher @relationship(from: "publisherId")
    reviews: [Review] @relationship(to: "bookId")
}

type Review @table(database: "demo-graphql") @export(rest: true, graphql: true) {
    id: ID! @primaryKey
    bookId: ID! @indexed
    rating: Int!
    title: String
    content: String
    reviewer: String
    createdAt: String
    book: Book @relationship(from: "bookId")
}

type Category @table(database: "demo-graphql") @export(rest: true, graphql: true) {
    id: ID! @primaryKey
    name: String! @indexed
    description: String
    parentId: ID @indexed
}
```

## Development

```bash
cd source

# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Build for production
npm run build
```

---

Built with [Yeti](https://yetirocks.com) | The Performance Platform for Agent-Driven Development
