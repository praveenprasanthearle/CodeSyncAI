# CodeSync AI — REST & Realtime API Specification

## 1. REST API Endpoints (`/api/v1`)

### 1.1 Authentication & Profile
- `POST /api/v1/auth/register` — Register a new account.
- `POST /api/v1/auth/login` — Sign in and receive access token + refresh cookie.
- `POST /api/v1/auth/refresh` — Issue a new access token via valid refresh cookie.
- `POST /api/v1/auth/logout` — Revoke active session.
- `GET  /api/v1/auth/me` — Retrieve current authenticated user profile.

### 1.2 Projects & Collaboration
- `GET    /api/v1/projects` — List all projects accessible to the user.
- `POST   /api/v1/projects` — Create a new project.
- `GET    /api/v1/projects/:id` — Retrieve project metadata and members.
- `PUT    /api/v1/projects/:id` — Update project settings (Owner only).
- `DELETE /api/v1/projects/:id` — Delete project (Owner only).
- `POST   /api/v1/projects/:id/members` — Invite collaborator.
- `DELETE /api/v1/projects/:id/members/:userId` — Remove collaborator.

### 1.3 Virtual File System
- `GET    /api/v1/projects/:id/files` — Retrieve recursive project file tree.
- `POST   /api/v1/projects/:id/files` — Create new file or folder.
- `PUT    /api/v1/files/:id` — Update content, rename, or move node.
- `DELETE /api/v1/files/:id` — Delete file or directory recursively.

### 1.4 Sandboxed Execution
- `POST   /api/v1/execution/run` — Run code in isolated Docker/process sandbox.

### 1.5 AI Pair Programmer
- `POST   /api/v1/ai/prompt` — Send context & prompt to Google Gemini 2.0.

---

## 2. Standard Response Envelope

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-08-16T14:30:00.000Z"
}
```

Error format:
```json
{
  "success": false,
  "message": "Project not found or access denied",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  },
  "timestamp": "2026-08-16T14:30:00.000Z"
}
```
