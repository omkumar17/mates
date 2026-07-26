# metly — Dating App previously mates

> A full-stack dating application with real-time chat, built using Next.js, Express, Socket.IO, and MongoDB.

---

## Architecture Overview

```
mates/
│
├── mates_frontend/       ← Next.js UI (Vercel)
├── mates_backend/        ← Express REST API (Vercel)
└── socket-server/        ← Socket.IO Server (Render)
```

### Three-Tier Separation

| Tier | Directory | Tech | Port | Hosting |
|------|-----------|------|------|---------|
| Frontend | `mates_frontend/` | Next.js 16 | 3000 | Vercel |
| REST API | `mates_backend/` | Express 5 | 5000 | Vercel |
| WebSocket | `socket-server/` | Socket.IO 4 | 5001 | Render |

This separation ensures:
- **No port conflicts** between REST and Socket traffic
- **Independent scaling** — REST and WebSocket can be deployed separately
- **Clean codebase** — each service has a single responsibility
- **Better performance** — no HTTP long-polling interference with REST endpoints

---

## Project Structure

```
mates/
│
├── mates_frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── chat/[matchId]/   # Real-time chat UI
│   │   │   ├── discover/         # Swipe/discover page
│   │   │   ├── login/            # Login page
│   │   │   ├── matches/          # Matches list
│   │   │   ├── profile/          # Profile editing
│   │   │   └── register/         # Registration page
│   │   ├── api/                  # API client (axios)
│   │   ├── components/           # Shared components
│   │   ├── context/              # Auth context
│   │   └── socket/               # Socket.IO client
│   └── package.json
│
├── mates_backend/                # Express REST API
│   ├── config/                   # DB connection
│   ├── middleware/                # Auth middleware
│   ├── models/                   # Mongoose models
│   ├── routes/                   # API route handlers
│   ├── services/                 # Business logic
│   └── server.js                 # Entry point
│
├── socket-server/                # Socket.IO Server
│   ├── config/                   # DB connection (shared)
│   ├── models/                   # User, Match, Message models
│   ├── socket/
│   │   ├── auth.js               # JWT socket auth
│   │   └── chat.js               # Chat event handlers
│   ├── server.js                 # Entry point
│   └── package.json
│
└── README.md
```

---

## API vs Socket — What goes where

| Action | Service | Endpoint/Event |
|--------|---------|----------------|
| Register / Login | REST | `POST /api/auth/register`, `POST /api/auth/login` |
| Fetch users to discover | REST | `GET /api/user/discover` |
| Like / Dislike a user | REST | `POST /api/likes`, `POST /api/dislikes` |
| Get matches list | REST | `GET /api/matches` |
| Get match history | REST | `GET /api/messages/:matchId` |
| **Send chat message** | **Socket** | `emit("sendMessage")` |
| **Receive chat message** | **Socket** | `on("receiveMessage")` |
| **Typing indicator** | **Socket** | `emit("typing")` / `emit("stopTyping")` |
| **Mark as seen** | **Socket** | `emit("markSeen")` |
| **Join chat room** | **Socket** | `emit("joinRoom")` |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
# Install frontend dependencies
cd mates_frontend && npm install

# Install backend dependencies
cd ../mates_backend && npm install

# Install socket server dependencies
cd ../socket-server && npm install
```

### 2. Configure Environment

> ⚠️ **Security Warning:** Never commit real secrets to version control. The `.env` files are listed in `.gitignore` and should remain local. The values below are **examples only** — replace them with your own secure values.

**`mates_backend/.env`**
```env
MONGO_URI="your mongo uri"
JWT_SECRET="your-secure-secret-here"
PORT=5000
```

**`socket-server/.env`**
```env
MONGO_URI="your mongo uri"
JWT_SECRET="your-secure-secret-here"
PORT=5001
```

**`mates_frontend/.env`**
```env
NEXT_PUBLIC_API_URL="your api url"
NEXT_PUBLIC_SOCKET_URL="your socket url"
```

> **Important:** The `JWT_SECRET` must be identical across `mates_backend` and `socket-server` so the socket server can verify tokens issued by the backend. Use a strong, randomly generated string in production.

### 3. Run Locally

```bash
# Terminal 1 — REST API
cd mates_backend && npm start

# Terminal 2 — Socket Server
cd socket-server && npm start

# Terminal 3 — Frontend
cd mates_frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### Vercel (Frontend + Backend)

- **Frontend:** Deploy `mates_frontend/` as a Next.js app
- **Backend:** Deploy `mates_backend/` as a Node.js serverless function

Environment variables must be set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` → your Vercel backend URL
- `NEXT_PUBLIC_SOCKET_URL` → your Render socket server URL

### Render (Socket Server)

- Deploy `socket-server/` as a Web Service
- Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`
- Ensure CORS origin points to your Vercel frontend URL

---

## Chat Flow

```
User opens Chat
        │
        ▼
connectSocket()            ← Frontend calls io(SOCKET_URL, { auth: { token } })
        │
        ▼
socket-server/auth.js      ← JWT verified, user attached to socket
        │
        ▼
socket.emit("joinRoom")    ← User joins match-specific room
        │
        ▼
        ┌──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
  emit("typing")                          emit("sendMessage")
  emit("stopTyping")                      on("receiveMessage")
  emit("markSeen")                        on("seenUpdate")
```

---

## Key Design Decisions

### Why separate socket server?

The previous architecture bundled Socket.IO and Express on the same HTTP server. This caused:
- Socket.IO's HTTP long-polling interfering with REST routes
- "Bad connection" errors due to traffic competition
- Complex, bloated server.js (200+ lines)

The new architecture completely eliminates these issues by running two independent servers.

### Why not copy all models?

Only `User`, `Match`, and `Message` models are copied to the socket server because those are the only ones needed for chat operations. Models like `Like`, `Notification`, and `Interaction` are REST-only and remain solely in `mates_backend`.

### Why no routes/controllers in socket-server?

The socket server does not serve REST APIs. It only handles WebSocket events. If it needed REST endpoints in the future, they should be added to the existing `mates_backend` rather than duplicating route logic.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | Frontend framework |
| Express 5 | REST API server |
| Socket.IO 4 | Real-time WebSocket communication |
| MongoDB + Mongoose | Database |
| JSON Web Token | Authentication |
| Tailwind CSS | Styling |
| Axios | HTTP client |
| Lucide React | Icons |
| React Hot Toast | Notifications |

---

## License

ISC

