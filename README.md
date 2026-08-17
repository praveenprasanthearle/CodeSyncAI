# CodeSync AI ⚡

> **A modern, high-performance, real-time collaborative cloud development platform.**  
> Unifying the power of **VS Code**, **Google Docs**, **Replit**, **Discord**, and **AI Coding Assistants** into a single seamless developer workspace.

---

## 🌟 Core Highlights

- ⚡ **VS Code-Grade Web IDE**: Powered by Monaco Editor with multi-language syntax highlighting, tabs, auto-indentation, and shortcuts.
- 👥 **Real-Time CRDT Collaboration**: Sub-millisecond conflict-free synchronized editing using **Yjs** and WebSocket transports.
- 🎯 **Live Presence & Cursors**: Visual live cursor positions, text selection tracking, and named avatar flags.
- 💬 **Integrated Project Chat**: Real-time project communication with code snippet highlighting and message persistence.
- 🎙️ **Low-Latency Voice Rooms**: Direct peer-to-peer WebRTC audio communication with mute/unmute and live speaking indicators.
- 🔒 **Sandboxed Code Execution**: Containerized Docker execution with CPU/memory caps, network isolation, and terminal streaming.
- 🤖 **Context-Aware AI Assistant**: Integrated pair programming assistant (Gemini/OpenAI) with code explanation, refactoring, test generation, and interactive diff review.
- 📜 **Version History & Rollbacks**: Snapshot audit trails and visual side-by-side diff viewers.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection URI
- **Docker**: (Optional for containerized code execution; fallback process runner included)

### 1. Clone & Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install
npm install --workspace=backend
npm install --workspace=frontend
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory and configure your settings:
```bash
cp backend/.env.example backend/.env
```

### 3. Run Development Servers Concurrently
```bash
# Starts both Backend API/Socket (:5000) and Frontend Vite Dev Server (:5173)
npm run dev
```

---

## 📁 Repository Structure

```
codesync-ai/
├── backend/             # Express.js + TypeScript + Socket.IO + Mongoose
├── frontend/            # React 18 + Vite + TypeScript + Tailwind CSS
├── docs/                # Architectural guides, API specs, and task tracking
├── docker/              # Container runner environments & compose orchestration
└── package.json         # Monorepo workspace configuration
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Monaco Editor, Zustand, Socket.IO Client, Yjs, WebRTC, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, TypeScript, Mongoose, Socket.IO, Yjs, Zod, JWT, Bcrypt, Helmet, Dockerode.
- **Database**: MongoDB.
- **AI Engine**: Google Gen AI SDK (`@google/genai` / Gemini 2.0/1.5 Pro).
