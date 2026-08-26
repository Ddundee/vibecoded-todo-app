# Raspberry Pi / Linux home server deployment

This assumes a Raspberry Pi 4 or 5 running a 64-bit OS (Raspberry Pi OS
64-bit, or Ubuntu Server for ARM64) — 64-bit is required for the Postgres
and Node/Python images used here. Everything in this guide applies
equally to any other Linux box (an old laptop, a NUC, a VPS you own,
etc.) — just skip the Pi-specific parts.

## 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
# log out and back in for the group change to take effect
```

Verify:

```bash
docker --version
docker compose version
```

Docker's install script enables and starts the `docker` systemd service by
default, so it comes back up automatically after a reboot. Confirm with:

```bash
sudo systemctl is-enabled docker   # should print "enabled"
```

If it doesn't, enable it explicitly: `sudo systemctl enable docker`.

## 2. Get the code onto the Pi

```bash
git clone <your-fork-url> todo-app
cd todo-app
```

(Or `scp`/`rsync` the repo over if you don't want the Pi to have its own
git remote access.)

## 3. Configure environment

```bash
cp .env.example .env
nano .env   # or vim/whatever you have
```

At minimum, change these from their placeholder values:

- `POSTGRES_PASSWORD` — random string
- `API_TOKEN` — random string (`openssl rand -hex 32`); this is what MCP
  clients and any scripts will authenticate with
- `SESSION_SECRET` — a **different** random string (`openssl rand -hex 32`)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — your web UI login (only used to
  seed the account on first boot)
- `APP_TIMEZONE` — your local IANA timezone (e.g. `America/New_York`), so
  "today" and due dates line up with your actual day

Leave `BIND_HOST=0.0.0.0` unless you specifically want to restrict which
network interface the ports are published on (see
[`TAILSCALE.md`](TAILSCALE.md) for why you might set it to your Tailscale
IP instead).

## 4. Start the stack

Images are published to Docker Hub (`ddundee/todo-app-backend`,
`ddundee/todo-app-frontend`) by CI on every push to `main`, prebuilt for
both `amd64` and `arm64` — pulling them is much faster than building on a
Pi:

```bash
docker compose pull
docker compose up -d
```

If you've made local changes (or are running a fork without CI wired up),
build from source instead:

```bash
docker compose up -d --build
```

First build takes a few minutes on a Pi (compiling nothing — these are
all pre-built wheels/binaries for arm64, but downloading + `npm ci` +
`next build` still takes some time on Pi-class CPUs). Watch progress:

```bash
docker compose logs -f
```

Check everything is healthy:

```bash
docker compose ps
```

All four services (`db`, `backend`, `mcp`, `frontend`) should show
`healthy` within about 30 seconds of the containers starting.

## 5. Verify

From another machine on the same LAN:

```bash
curl http://<pi-ip>:8000/health
```

Then open `http://<pi-ip>:3000` in a browser and log in.

## Surviving a reboot

Every service in `docker-compose.yml` has `restart: unless-stopped`. Combined
with the Docker daemon itself starting on boot (step 1), a `sudo reboot`
brings the whole stack back automatically — no manual `docker compose up`
needed after a power cycle. Verify by rebooting once and checking
`docker compose ps` afterward.

## Updating

```bash
cd todo-app
git pull
docker compose pull   # grab the latest prebuilt images from Docker Hub
docker compose up -d
```

(Use `docker compose up -d --build` instead of `pull` if you're running a
fork without the Docker Hub CI wired up, or have local changes.)

This only restarts services whose image actually changed. Your data is
untouched (it lives in the `postgres_data` Docker volume, independent of
the app containers). Take a backup first for anything bigger than a
routine pull — see the root `README.md`.

## Docker Hub images and multi-arch builds

`.github/workflows/docker-publish.yml` builds and pushes both images —
`ddundee/todo-app-backend` and `ddundee/todo-app-frontend` — for
`linux/amd64` and `linux/arm64` on every push to `main`, tagged `latest`
and with the short commit SHA. That's what step 4 above pulls from.

If you fork this repo and want your own images, set two repository
secrets (Settings → Secrets and variables → Actions):

- `DOCKERHUB_USERNAME` — your Docker Hub username
- `DOCKERHUB_TOKEN` — a Docker Hub access token (hub.docker.com → Account
  Settings → Security → New Access Token; Read & Write is enough)

and update the `${DOCKERHUB_NAMESPACE:-ddundee}` default in
`docker-compose.yml` to your own namespace (or set `DOCKERHUB_NAMESPACE`
in `.env` to override it without editing the file).

To build and push manually instead of relying on CI (e.g. from an amd64
dev machine, targeting the Pi's arm64 without building natively on it):

```bash
docker login
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ddundee/todo-app-backend:latest --push ./backend
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ddundee/todo-app-frontend:latest --push ./frontend
```

Building natively on the Pi (`docker compose up -d --build` run directly
on the Pi) also works and avoids all of this — Docker automatically pulls
the correct arm64 base images since it matches the host architecture.
