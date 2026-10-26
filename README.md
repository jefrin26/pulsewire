# pulsewire

Machine heartbeat sender for **Uptime Kuma** push monitors, reporting web-style status codes (`200`, `404`, `000`, ...).

## Modes

### 1. Heartbeat loop (default)

```bash
node index.js            # uses KUMA_PUSH_URL from .env
npm start
```

Sends a heartbeat to Uptime Kuma every `HEARTBEAT_SEC` seconds (default `30`, first beat immediately). Each beat runs the self-check (loopback socket test + active network interface check):

- healthy → pushes `status=up`, `msg=<hostname> is up`, `ping=<check ms>`
- unhealthy → pushes `status=down`, `msg=<detail>` (Kuma alerts immediately)
- process or machine dies → beats stop → Kuma alerts after its heartbeat window

Log output per beat:

```
HTTP/1.1 200 OK
X-Check-Detail: LH44 is up
X-Push: ok
```

If Kuma's push endpoint is unreachable: `X-Push: failed ...`, the loop keeps running.

### 2. One-shot self-check

```bash
node index.js --check
npm run check
```

Prints the status line to stdout and exits: `0` for 2xx/3xx, `1` otherwise.

### 3. Service probe

```bash
node index.js --probe 8080
```

Makes a GET request to `HOST:<port>/` (default host `localhost`) and passes through the service's real status code:

```
HTTP/1.1 404 Not Found
X-Check-Detail: localhost:8080/
```

If the target is down: `HTTP/1.1 000 No Response` (exit `1`). Timeout → `408`, reset → `502`, other errors → `503`.

## Environment variables

Copy `.env.example` to `.env` — pulsewire auto-loads it from the working directory (existing environment variables take precedence):

```bash
node index.js
```

| Variable | Default | Description |
|---|---|---|
| `KUMA_PUSH_URL` | — | Uptime Kuma push URL (required for default mode) |
| `HEARTBEAT_SEC` | `30` | Seconds between heartbeats |
| `HOST` | `localhost` | Target host (probe mode) |
| `TIMEOUT_MS` | `3000` | Timeout for push/probe requests |

## Uptime Kuma setup

1. Uptime Kuma → **New Monitor** → type **Push**
2. Set **Heartbeat Interval** to match `HEARTBEAT_SEC` (e.g. `30` seconds)
3. Save → copy the generated **Push URL**
4. Strip anything after `?` (pulsewire adds `status`, `msg`, `ping` itself)
5. Put it in `.env` as `KUMA_PUSH_URL=...` and run:
   ```bash
   node index.js
   ```

While heartbeats arrive, Kuma stays green. If the app or machine stops, Kuma sends the alert.

## Requirements

- Node.js >= 18 (no dependencies)
