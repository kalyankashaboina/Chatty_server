<!--- PROJECT README: Chatty Server -->

# Chatty Server — Backend for Real-time Chat

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ci](https://img.shields.io/badge/ci-github_actions-blueviolet)](.github/workflows/ci.yml)

A maintainable, production-ready backend for a real-time chat application. Built with TypeScript, Express, Socket.IO, and MongoDB. This repository provides authentication, chat-room management, message persistence, and real-time messaging.

## Table of contents

- [Key features](#key-features)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [API examples](#api-examples-request--response)
- [Socket.IO events](#socketio-events)
- [Logging](#logging)
- [Development & contribution](#development--contribution)
- [Deploy & production notes](#deploy--production-notes)
- [License & maintainer](#license--maintainer)

## Key features

- JWT-based authentication with secure, HTTP-only cookies
- Real-time messaging with Socket.IO and presence tracking
- Chat room lifecycle and message persistence in MongoDB
- Structured logging with Winston and optional MongoDB transport

## Tech stack

- Node.js + TypeScript
- Express.js (REST API)
- Socket.IO
- MongoDB (Mongoose)
- JWT, bcrypt
- Winston for logging

## Project layout

- `src/` — TypeScript source files
  - `controllers/` — request handlers
  - `routes/` — Express routes
  - `models/` — Mongoose schemas
  - `middleware/` — auth and other middleware
  - `lib/`, `utils/` — DB, logger, socket wiring
- `logs/` — optional persisted logs

## Quick start

Install dependencies and run in development mode:

```powershell
npm install
npm run dev
```

Build and run in production:

```powershell
npm run build
npm start
```

Useful scripts (from `package.json`):

- `dev` — development server with `nodemon` + `ts-node`
- `build` — compile TypeScript to `dist/`
- `start` — run compiled server
- `format` / `format:check` — Prettier formatting
- `type-check` — TypeScript type check

## Environment variables

Create a `.env` file in the root (do not commit secrets):

```powershell
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## API examples (request / response)

Below are example request and response payloads for the most commonly used endpoints. These are illustrative — consult the controller code for exact validation rules.

### 1) Register

Request (POST `/api/auth/register`)

```json
{
  "name": "Alice Example",
  "email": "alice@example.com",
  "password": "StrongPassword123"
}
```

Response (201 Created)

```json
{
  "user": {
    "_id": "6512bd43d9caa6e02c990b0a",
    "name": "Alice Example",
    "email": "alice@example.com"
  },
  "message": "Registration successful"
}
```

The server also sets an HTTP-only cookie containing the JWT.

### 2) Login

Request (POST `/api/auth/login`)

```json
{
  "email": "alice@example.com",
  "password": "StrongPassword123"
}
```

Response (200 OK)

```json
{
  "user": {
    "_id": "6512bd43d9caa6e02c990b0a",
    "name": "Alice Example",
    "email": "alice@example.com"
  },
  "message": "Login successful"
}
```

### 3) Sidebar users

Request (GET `/api/auth/sidebar`) — requires auth cookie

Response (200 OK)

```json
{
  "users": [
    { "_id": "6512bd43...", "name": "Alice Example", "online": true },
    { "_id": "6512bd44...", "name": "Bob Example", "online": false }
  ]
}
```

### 4) Fetch messages for a room

Request (GET `/api/messages/:roomId`)

Response (200 OK)

```json
{
  "roomId": "650f7a9b2f4a3c0012345678",
  "messages": [
    {
      "_id": "660f8a9b2f4a3c0012345678",
      "sender": { "_id": "6512bd43...", "name": "Alice Example" },
      "text": "Hello everyone!",
      "createdAt": "2025-10-19T10:15:30.000Z"
    }
  ]
}
```

### 5) Send a message

Request (POST `/api/messages`)

```json
{
  "roomId": "650f7a9b2f4a3c0012345678",
  "text": "This is a new message"
}
```

Response (201 Created)

```json
{
  "message": {
    "_id": "6610a1b2c3d4e5f001234567",
    "roomId": "650f7a9b2f4a3c0012345678",
    "sender": { "_id": "6512bd43...", "name": "Alice Example" },
    "text": "This is a new message",
    "createdAt": "2025-10-19T10:20:00.000Z"
  }
}
```

## Socket.IO events

Socket event names and payload shapes live in `src/utils/socket.ts` or `src/socket.ts`. When emitting messages from clients use the same shape as the POST `/api/messages` payload. For production at scale, use a Socket.IO adapter with Redis.

## Logging

Winston is configured for structured logging. Optionally enable `winston-mongodb` to persist logs. See `src/utils/logger.ts` and `src/lib/mongoDb.ts` for configuration.

## Development & contribution

- See `CONTRIBUTING.md` for development setup, commit conventions, and PR checklist.
- Run local checks before creating a PR:

```powershell
npm run format:check
npm run type-check
npx eslint "src/**/*.{ts,js}" --max-warnings=0
```

## Deploy & production notes

- Use environment variables for secrets and set `NODE_ENV=production`.
- Use HTTPS and set `secure` cookie flags in production.
- Horizontally scale Socket.IO using an adapter (Redis) behind a load balancer.

## License & maintainer

MIT — see the `LICENSE` file.

Maintainer: Kalyan Kashaboina — kalyankashaboina07@gmail.com

---

If you'd like, I can create a Postman collection and add CI job to run tests once you add them.

## API examples (request / response)

Below are example request and response payloads for the most commonly used endpoints. These are illustrative — consult the controller code for exact field names and validation rules.

### 1) Register

Request (POST /api/auth/register)

```json
{
  "name": "Alice Example",
  "email": "alice@example.com",
  "password": "StrongPassword123"
}
```

Response (201 Created)

```json
{
  "user": {
    "_id": "6512bd43d9caa6e02c990b0a",
    "name": "Alice Example",
    "email": "alice@example.com"
  },
  "message": "Registration successful"
}
```

The server also sets an HTTP-only cookie containing the JWT (for authenticated requests).

### 2) Login

Request (POST /api/auth/login)

```json
{
  "email": "alice@example.com",
  "password": "StrongPassword123"
}
```

Response (200 OK)

```json
{
  "user": {
    "_id": "6512bd43d9caa6e02c990b0a",
    "name": "Alice Example",
    "email": "alice@example.com"
  },
  "message": "Login successful"
}
```

An HTTP-only cookie with the JWT will be set by the server.

### 3) Get sidebar users / metadata

Request (GET /api/auth/sidebar)

Headers: include the auth cookie returned by login/register.

Response (200 OK)

```json
{
  "users": [
    { "_id": "6512bd43...", "name": "Alice Example", "online": true },
    { "_id": "6512bd44...", "name": "Bob Example", "online": false }
  ]
}
```

### 4) Fetch messages for a room

Request (GET /api/messages/:roomId)

Example URL: `/api/messages/650f7a9b2f4a3c0012345678`

Response (200 OK)

```json
{
  "roomId": "650f7a9b2f4a3c0012345678",
  "messages": [
    {
      "_id": "660f8a9b2f4a3c0012345678",
      "sender": { "_id": "6512bd43...", "name": "Alice Example" },
      "text": "Hello everyone!",
      "createdAt": "2025-10-19T10:15:30.000Z"
    },
    {
      "_id": "660f8a9b2f4a3c0012345679",
      "sender": { "_id": "6512bd44...", "name": "Bob Example" },
      "text": "Hi Alice",
      "createdAt": "2025-10-19T10:16:00.000Z"
    }
  ]
}
```

### 5) Send a message

Request (POST /api/messages)

```json
{
  "roomId": "650f7a9b2f4a3c0012345678",
  "text": "This is a new message"
}
```

Response (201 Created)

```json
{
  "message": {
    "_id": "6610a1b2c3d4e5f001234567",
    "roomId": "650f7a9b2f4a3c0012345678",
    "sender": { "_id": "6512bd43...", "name": "Alice Example" },
    "text": "This is a new message",
    "createdAt": "2025-10-19T10:20:00.000Z"
  }
}
```

Socket note: messages sent via Socket.IO will typically use a similar payload and the server will broadcast the new message to the room.

---

If you want, I can also export a Postman collection (JSON) with these examples and add it to the repo (e.g., `postman/Chatty.postman_collection.json`).
