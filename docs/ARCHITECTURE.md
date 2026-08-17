# CodeSync AI — Architecture & Engineering Specification

## 1. System Overview

**CodeSync AI** is a distributed, real-time cloud development platform that provides a collaborative IDE experience. It coordinates multiple asynchronous subsystems:
1. **CRDT (Conflict-free Replicated Data Type) Synchronizer**: Uses Yjs binary state vectors to ensure deterministic, zero-conflict real-time document editing.
2. **Awareness Engine**: Distributes live cursor positions, user selections, and online presence.
3. **Communication Layer**: Provides real-time text chat (Socket.IO) and audio communication (WebRTC P2P mesh).
4. **Isolated Code Sandbox**: Executes arbitrary user code in ephemeral, resource-constrained Docker containers.
5. **AI Pair Programmer**: Bridges the active editor state with Google Gemini 2.0 to offer context-aware refactoring, test generation, and diff reviews.

---

## 2. Component Topology

```
+-----------------------------------------------------------------------+
|                           Browser Client                              |
|  +---------------------+  +--------------------+  +----------------+  |
|  | Monaco Editor Core  |  | Yjs State Manager  |  | WebRTC Voice   |  |
|  +----------+----------+  +---------+----------+  +--------+-------+  |
|             |                       |                      |          |
+-------------|-----------------------|----------------------|----------+
              | (y-monaco)            | (Uint8Array update)  | (P2P Audio)
              v                       v                      v
+----------------------------------------------------+   +--------------+
|         Express + Socket.IO Server (:5000)         |   | Peer Browser |
|  +--------------------+  +----------------------+  |   +--------------+
|  | REST API Router    |  | Socket.IO Gateway    |  |
|  | (Auth, Files, AI)  |  | (Presence, Yjs, Chat)|  |
|  +---------+----------+  +----------+-----------+  |
+------------|------------------------|--------------+
             |                        |
     +-------v--------+       +-------v--------+
     | MongoDB Atlas  |       | Docker Sandbox |
     | (Persisted DB) |       | (Code Runner)  |
     +----------------+       +----------------+
```

---

## 3. Real-Time Synchronization Protocol (Yjs + Socket.IO)

- When a client opens a file, it requests the current Yjs document state vector from the server via `yjs:sync_step_1`.
- The server responds with `yjs:sync_step_2` containing the binary delta since the client's state vector.
- While editing, all atomic character insertions, deletions, and cursor movements are compressed into `Uint8Array` binary packets and broadcast via the room `project:{projectId}`.
- Every 3 seconds of user inactivity, the server synthesizes the current `Y.Text` plain text and persists it to MongoDB, guaranteeing durability without high database write load.

---

## 4. WebRTC Voice Room Protocol

- Peer discovery and session description exchange (SDP offer/answer) and ICE candidate exchange occur over Socket.IO.
- Direct media streams (Opus 48kHz audio) flow peer-to-peer over UDP with DTLS-SRTP encryption.
- STUN servers (`stun:stun.l.google.com:19302`) resolve public IP/port mappings across NATs.

---

## 5. Security & Isolation Matrix

| Subsystem | Security Enforcement | Threat Mitigated |
| :--- | :--- | :--- |
| **Authentication** | Dual-token (short-lived access JWT + HttpOnly refresh cookie) + bcrypt (12 rounds) | Token theft, XSS session hijack, brute force |
| **API Endpoints** | Express rate limiter (100 req/15 min) + Helmet HTTP security headers | DDoS, clickjacking, MIME sniffing |
| **Project Access** | Middleware verifying `(userId, projectId)` tuple on every mutation | Horizontal privilege escalation, IDOR |
| **Code Execution** | Isolated Docker with `--network none`, `--memory 256m`, `--cpus 1.0`, `--read-only` | Fork bombs, host breakout, data exfiltration |
| **AI Suggestions** | Interactive side-by-side diff review modal before applying edits | Accidental code destruction |
