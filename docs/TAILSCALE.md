# Accessing the app remotely via Tailscale

[Tailscale](https://tailscale.com/) creates a private mesh VPN (a
"tailnet") between your devices, using WireGuard, without needing router
port forwarding or a public IP. Install it once on the host running
Docker, and every device you've also installed Tailscale on (phone,
laptop, etc.) can reach the app's ports at the host's Tailscale
address — the same way they'd reach it on your home LAN.

## Why this works with no extra configuration

`docker-compose.yml` publishes the backend, MCP, and frontend ports on
`${BIND_HOST}` (`0.0.0.0` by default) — i.e. *every* network interface on
the host, including whatever virtual interface Tailscale creates
(`tailscale0`). So once Tailscale is running on the host, the exact same
`http://<pi-ip>:3000` URL that works on your LAN also works over the
tailnet at `http://<tailscale-ip>:3000` — nothing in the app or compose
file needs to change.

## Setup

1. Install Tailscale **on the host** (not inside a container):

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

   Follow the printed URL to authenticate the device to your tailnet.

2. Find the host's Tailscale IP or MagicDNS name:

   ```bash
   tailscale ip -4
   # or, if MagicDNS is enabled in your tailnet admin console:
   tailscale status   # shows hostnames like "my-pi"
   ```

3. From any other device on your tailnet (phone with the Tailscale app,
   laptop, etc.), open:

   ```
   http://<tailscale-ip-or-magicdns-name>:3000
   ```

That's it — no port forwarding, no public DNS, no TLS cert to manage
(Tailscale itself encrypts the tunnel).

## Optional: restrict access to the tailnet only

By default (`BIND_HOST=0.0.0.0`), anyone on your LAN can also reach the
app, in addition to your tailnet. If you want the app reachable **only**
over Tailscale — not the raw LAN — set `BIND_HOST` in `.env` to the host's
Tailscale IP specifically:

```bash
# .env
BIND_HOST=100.x.y.z   # from `tailscale ip -4`
```

Then:

```bash
docker compose up -d
```

Docker will now only publish the ports on that interface, so LAN devices
(that aren't also on your tailnet) can no longer reach port 3000/8000/8001
at all — only traffic arriving via the Tailscale interface can.

> Tailscale assigns a stable IP per device, but if you ever re-authorize
> the machine you may want to double check `tailscale ip -4` hasn't
> changed before relying on this for a headless server.

## Using MCP clients over Tailscale

The MCP server is just another port (`8001`) published the same way — an
MCP client running on your laptop can point at
`http://<tailscale-ip>:8001/mcp` with the same `Authorization: Bearer
<API_TOKEN>` header as a local connection. See [`MCP.md`](MCP.md).

## Mobile access

Install the Tailscale app on your phone, sign into the same tailnet, and
open `http://<tailscale-ip>:3000` in the mobile browser. The web UI is
responsive and works fine on a phone screen; there's no separate mobile
app.
