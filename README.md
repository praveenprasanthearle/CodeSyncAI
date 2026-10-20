# CodeSync AI

A collaborative browser IDE with Monaco, Yjs document synchronization, project chat, WebRTC voice signaling, snapshots, code execution, and a general-purpose AI assistant.

Built with React, TypeScript, Vite, Node.js, Express, Socket.IO and MongoDB.

## Start locally

Use Node.js 22 or newer and npm. From the repository root:

```bash
npm ci
npm run setup
npm run dev
```

Open `http://localhost:5173`. Register an account, create a project, and open a source file.

`setup` creates unique development authentication secrets without overwriting existing environment files. The backend tries `DATABASE_URL`, then uses an embedded disposable MongoDB in development if no database is available. **Embedded database contents are lost on restart.** Configure a persistent MongoDB for a public demo. Production startup fails if the configured database is unavailable.

Native code execution needs the corresponding toolchain installed on the server: GCC/G++ for C/C++, Python, Go, Rust or Java. JavaScript uses Node.js; TypeScript is transpiled before execution. Selecting a language extension enables the UI integration; it does not install a compiler on the server. Missing runtimes produce an error instead of simulated output.

## AI assistant

The assistant supports general text questions, learning, writing, planning, programming, and follow-up conversation. General chat is the default. Enable **Include active file and selection** when a question needs your code; the Explain, Refactor, Fix bugs and Tests buttons explicitly use the open file. A source file does not replace the user's question.

Connect a provider through **AI Settings → Gemini or OpenAI → Verify and save key**, or configure a server key in `backend/.env`:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your_provider_key
GEMINI_MODEL=gemini-3.8-flash
```

For OpenAI:

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=your_provider_key
OPENAI_MODEL=gpt-6-luna
```

With `AI_PROVIDER=auto`, a configured Gemini key takes precedence over OpenAI. Models are configurable; check the provider's availability for your account. For Docker Compose, set these values in the root `.env` instead. Keep provider keys out of `VITE_*` variables and source control.

The implementation includes:

- Bounded conversation history: up to 20 messages and 60,000 history characters; welcome messages and failed requests are excluded.
- Separate conversation state per user and workspace during the browser session.
- Markdown, tables, fenced code, mathematics, multiline prompts, retry and request cancellation.
- Explain, refactor, fix and test-generation actions with validated structured responses.
- Authentication, per-user request limits, provider timeouts, and explicit missing-key, invalid-key, quota and model errors.

Bring-your-own keys are kept in tab-scoped session storage and passed to the backend for provider requests. They are not stored in the backend database. Use a deployment you trust. Server keys stay on the backend. A key is marked connected only after a successful provider request.

There is no canned-answer fallback. General AI chat requires a working provider key. Answer quality depends on the selected provider/model. The current assistant has text and editor context; it has no browsing or code-execution tools of its own.

To verify a configured server key with actual general conversation and follow-up recall:

```bash
npm run check:ai
```

This live check covers greetings, an email, follow-up recall, JavaScript generation and switching back from coding to an ordinary question. It prints sample answers for human review. Provider quota and billing apply to live requests.

### If every question returns a random program

That behavior comes from the legacy `codesync-neural-core` template fallback, not from a successful Gemini/OpenAI response. Installing a key does not update a running backend. Stop **both** development servers, pull the latest code, run `npm ci` and `npm run setup`, and restart with `npm run dev`. If you run compiled backend output, rebuild it first with `npm run build:backend`.

The current frontend checks the backend's AI contract before sending a provider key. An older server produces an update/restart error rather than showing template code as an answer. The backend never substitutes local templates when a provider fails. Check the actual provider/model shown in AI Settings after verifying your key.

## Collaboration and permissions

`y-monaco` binds Monaco directly to `Y.Text`. Local edits become incremental CRDT operations; remote updates are applied with a remote origin so they are not echoed back. Yjs owns the editor content after synchronization; React does not replace it with a competing controlled value. Editor assets and workers are bundled with the app, without a Monaco CDN dependency.

The server checks project/file access on socket events as well as HTTP routes. Viewers can read; document changes require an editor or owner. Removing a collaborator evicts their active rooms. Voice offers, answers and ICE candidates can only be relayed between peers in the same authorized voice room.

Document initialization is shared across simultaneous first joins. Writes are debounced and serialized per file. Explicit saves flush the shared document. Snapshots flush pending changes before capture and preserve existing file IDs on restore so connected editors receive the restoration. Clones include actual files and directory relationships.

Access tokens are sent as Bearer tokens. Refresh tokens use HttpOnly cookies. Parallel expired requests share one refresh operation, and socket handshakes use the current token. Browser logout clears workspace state and saved provider keys.

## Code execution

All execution requests require authentication and are rate limited. Execution slots, elapsed time and captured output are bounded. TypeScript is transpiled; compilation/runtime errors are returned as errors.

| Mode | Intended use |
| --- | --- |
| `local` | Trusted development code only. A child process and temporary directory are not a security sandbox. This mode is refused in production. |
| `docker` | An isolated container per run, with no host mounts or network, a non-root user, read-only root filesystem, dropped capabilities, and CPU/memory/PID limits. |
| `disabled` | Code execution is unavailable with a clear error. |

Production defaults to Docker mode and fails closed if the runner is unavailable. Build the runner image on the Docker host used by the backend:

```bash
docker build -t codesync-runner:1 runner
```

Set `EXECUTION_MODE=docker` and configure Docker CLI access, including `DOCKER_HOST`/TLS configuration if using a separate runner host. The backend image includes the CLI but does not include a Docker daemon or mount the host's Docker socket. The runner source and stdin are sent over the container's stdin, allowing a separate Docker host without shared filesystem paths.

## Checks

```bash
npm test
npm run build
npm audit --omit=dev
npx playwright install chromium
npm run test:e2e
```

Unit/integration tests cover authentication, project/file permissions, provider contracts, document persistence, snapshots, native execution and frontend state. AI provider contract tests use controlled HTTP responses; they do not establish live answer quality.

The browser smoke test starts its own servers and disposable database. It verifies registration, project creation, Monaco editing, native C execution, concurrent edits from two accounts, team chat, snapshot capture/restore, refresh-cookie recovery and AI configuration/error UX. A test-only provider fixture also verifies general chat, writing, follow-up recall, coding, topic changes, opt-in editor context and stale-backend detection through the real browser and backend. It deliberately disables live provider keys; fixture responses do not establish live answer quality. It writes screenshots and a result summary under `test-results/demo-smoke`.

GitHub Actions is configured to run tests, builds and browser checks. See [the demo audit and interview notes](docs/demo-audit.md) for measured results and remaining operational requirements.

## Environment settings

See `backend/.env.example` and `frontend/.env.example` for examples.

| Backend variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Persistent MongoDB connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` | Unique authentication/cookie secrets |
| `CLIENT_URL` | Allowed frontend origin in production |
| `COOKIE_SECURE` | Defaults to true in production; use false only for an explicit local HTTP demo |
| `AI_PROVIDER` | `auto`, `gemini` or `openai` |
| `GEMINI_API_KEY`, `OPENAI_API_KEY` | Server-side provider credentials |
| `GEMINI_MODEL`, `OPENAI_MODEL` | Provider model identifiers |
| `AI_TIMEOUT_MS` | Provider timeout, default 45 seconds |
| `EXECUTION_MODE` | `local`, `docker` or `disabled` |
| `SANDBOX_IMAGE` | Runner image, default `codesync-runner:1` |
| `SANDBOX_TIMEOUT_MS`, `SANDBOX_MAX_MEMORY_MB` | Execution limits |
| `DOCKER_HOST` | Optional separate Docker endpoint |

The frontend uses same-origin `/api/v1` and Socket.IO through Vite/Nginx. Explicit `VITE_API_URL` and `VITE_SOCKET_URL` overrides support separate deployments. In development, `BACKEND_URL` or `VITE_BACKEND_PORT` controls the proxy destination.

## LAN and public demos

Run `npm run dev` on the host and open `http://HOST_LAN_IP:5173` on another device on the same network. The frontend proxy forwards both API and socket traffic, so clients do not need direct access to backend port 5000.

Microphone access requires a secure browser context: localhost or HTTPS. Public voice connectivity also depends on network/NAT traversal; real audio across external networks needs separate verification.

Before public hosting, configure HTTPS, a persistent database, unique secrets, the correct `CLIENT_URL`, a working AI key, and an isolated runner if execution is enabled. `npm run setup` creates a root `.env` for a local Docker demo; update its localhost origin and `COOKIE_SECURE` setting for public HTTPS hosting.

```bash
docker compose up --build
```

Only the frontend is published by Compose. MongoDB and the API remain on the internal service network. The root npm lockfile is the canonical dependency lockfile for both workspaces.

## Screenshots

| View | Preview |
| --- | --- |
| Landing | ![Landing](docs/screenshots/landing.png) |
| Dashboard | ![Dashboard](docs/screenshots/dashboard.png) |
| Workspace | ![Workspace](docs/screenshots/workspace.png) |
| Collaboration | ![Collaboration](docs/screenshots/collaboration.png) |
| AI assistant | ![AI assistant](docs/screenshots/ai-assistant.png) |
| Execution | ![Execution](docs/screenshots/execution.png) |

## Author

**E. Praveen Prasanth** — [praveenprasanthearle](https://github.com/praveenprasanthearle)

License: MIT.
