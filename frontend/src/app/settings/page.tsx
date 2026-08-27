"use client";

import { useState, useSyncExternalStore } from "react";
import CodeBlock from "@/components/CodeBlock";
import { CARD, FAINT, MUTED, SECTION_HEADING } from "@/lib/ui";

// Never notifies — the hostname doesn't change during a session, so this
// just gives useSyncExternalStore a safe way to read a browser-only value
// once, without the hydration mismatch a plain useState/useEffect would
// cause (server renders the placeholder, client immediately overwrites it
// mid-render, no cascading-render lint violation either).
function subscribeHost() {
  return () => {};
}
function getHostSnapshot() {
  return window.location.hostname;
}
function getServerHostSnapshot() {
  return "<host>";
}

type ClientKey = "claude-code" | "claude-desktop" | "cursor" | "chatgpt";

const CLIENT_TABS: { key: ClientKey; label: string }[] = [
  { key: "claude-code", label: "Claude Code" },
  { key: "claude-desktop", label: "Claude Desktop" },
  { key: "cursor", label: "Cursor" },
  { key: "chatgpt", label: "ChatGPT / Other" },
];

export default function SettingsPage() {
  // Placeholder on the server (no request context to guess a LAN/Tailscale
  // address from); the browser's own hostname once mounted client-side.
  const host = useSyncExternalStore(subscribeHost, getHostSnapshot, getServerHostSnapshot);
  const [activeClient, setActiveClient] = useState<ClientKey>("claude-code");

  const mcpUrl = `http://${host}:8001/mcp`;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* ---- Connect an MCP client -------------------------------------- */}
      <section className="space-y-3">
        <h2 className={SECTION_HEADING}>Connect an MCP client</h2>
        <div className={`space-y-4 p-4 ${CARD}`}>
          <p className={`text-sm ${MUTED}`}>
            The MCP server shares this app&apos;s database — connecting a
            client lets it read and manage the exact same tasks you see
            here. It speaks Streamable HTTP at{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
              {mcpUrl}
            </code>{" "}
            (default port 8001 — check <code>MCP_PORT</code> in your{" "}
            <code>.env</code> if you changed it), authenticated with an{" "}
            <code>Authorization: Bearer &lt;API_TOKEN&gt;</code> header. Find
            your <code>API_TOKEN</code> in the server&apos;s <code>.env</code>{" "}
            file — it&apos;s never shown in this UI.
          </p>

          <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-3 dark:border-neutral-800">
            {CLIENT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveClient(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  activeClient === tab.key
                    ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeClient === "claude-code" && (
            <div className="space-y-2">
              <p className={`text-sm ${MUTED}`}>Run this from a terminal:</p>
              <CodeBlock
                code={`claude mcp add --transport http personal-tasks ${mcpUrl} \\\n  --header "Authorization: Bearer <your API_TOKEN>"`}
              />
            </div>
          )}

          {activeClient === "claude-desktop" && (
            <div className="space-y-2">
              <p className={`text-sm ${MUTED}`}>
                Settings → Connectors (or edit{" "}
                <code>claude_desktop_config.json</code> directly, depending on
                your version):
              </p>
              <CodeBlock
                code={`{\n  "mcpServers": {\n    "personal-tasks": {\n      "url": "${mcpUrl}",\n      "headers": {\n        "Authorization": "Bearer <your API_TOKEN>"\n      }\n    }\n  }\n}`}
              />
              <p className={`text-xs ${FAINT}`}>
                If your version only supports locally-spawned (stdio) servers
                instead of remote HTTP ones, see the stdio example in{" "}
                <code>docs/MCP.md</code> in the repo.
              </p>
            </div>
          )}

          {activeClient === "cursor" && (
            <div className="space-y-2">
              <p className={`text-sm ${MUTED}`}>
                MCP settings panel, or edit <code>~/.cursor/mcp.json</code>{" "}
                directly:
              </p>
              <CodeBlock
                code={`{\n  "mcpServers": {\n    "personal-tasks": {\n      "url": "${mcpUrl}",\n      "headers": {\n        "Authorization": "Bearer <your API_TOKEN>"\n      }\n    }\n  }\n}`}
              />
            </div>
          )}

          {activeClient === "chatgpt" && (
            <div className="space-y-2">
              <p className={`text-sm ${MUTED}`}>
                Any client that supports remote MCP servers over Streamable
                HTTP with a custom header can connect with just the URL and
                header above. If a client only supports OAuth-style auth with
                no static bearer option, put a reverse proxy in front that
                injects the header, or use{" "}
                <code>mcp-remote</code> (a small local proxy some clients use
                to bridge stdio-only clients to a remote HTTP MCP server)
                configured with the header.
              </p>
              <p className={`text-sm ${MUTED}`}>
                For ChatGPT specifically, see{" "}
                <a
                  href="#openai-tunnel"
                  className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
                >
                  OpenAI Secure MCP Tunnel
                </a>{" "}
                below — it doesn&apos;t need any inbound port opened on your
                network.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ---- OpenAI Secure MCP Tunnel ------------------------------------ */}
      <section id="openai-tunnel" className="space-y-3 scroll-mt-6">
        <h2 className={SECTION_HEADING}>ChatGPT via OpenAI Secure MCP Tunnel</h2>
        <div className={`space-y-4 p-4 text-sm ${CARD}`}>
          <p className={MUTED}>
            OpenAI&apos;s{" "}
            <a
              href="https://developers.openai.com/api/docs/guides/secure-mcp-tunnels"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
            >
              Secure MCP Tunnel
            </a>{" "}
            runs a small client (
            <a
              href="https://github.com/openai/tunnel-client"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
            >
              openai/tunnel-client
            </a>
            ) on your own network that makes an{" "}
            <strong className="font-medium text-neutral-700 dark:text-neutral-300">
              outbound-only
            </strong>{" "}
            connection to OpenAI and relays requests to this MCP server — no
            inbound port is ever opened, and the tunnel carries only MCP
            traffic. An opt-in <code>openai-tunnel</code> service for this is
            already defined in <code>docker-compose.yml</code>.
          </p>

          <ol className="list-decimal space-y-3 pl-5">
            <li>
              Create a tunnel at{" "}
              <a
                href="https://platform.openai.com/settings/organization/tunnels"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
              >
                platform.openai.com → Settings → Tunnels
              </a>{" "}
              (needs the Tunnels <em>Read + Manage</em> permission). Associate
              it with your ChatGPT workspace and copy the resulting{" "}
              <code>tunnel_id</code>.
            </li>
            <li>
              Create a runtime API key at{" "}
              <a
                href="https://platform.openai.com/settings/organization/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
              >
                platform.openai.com → Settings → API keys
              </a>{" "}
              scoped with Tunnels <em>Read + Use</em>. Both of these are
              account actions in your own browser — this app never sees or
              stores them.
            </li>
            <li>
              Add both to <code>.env</code> on the server:
              <CodeBlock code={`OPENAI_TUNNEL_ID=tunnel_...\nOPENAI_TUNNEL_API_KEY=sk-...`} />
            </li>
            <li>
              Start the tunnel alongside the rest of the stack:
              <CodeBlock code={`docker compose --profile openai-tunnel up -d`} />
              This points <code>ghcr.io/openai/tunnel-client</code> at this
              app&apos;s own <code>mcp</code> service and injects your
              existing <code>API_TOKEN</code> as the bearer header
              automatically — nothing else to configure.
            </li>
            <li>
              Connect ChatGPT: with the tunnel running, go to{" "}
              <a
                href="https://chatgpt.com/#settings/Connectors"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
              >
                ChatGPT → Settings → Connectors
              </a>
              , add a connector, choose <strong>Tunnel</strong> as the
              connection type, and select your <code>tunnel_id</code>.
            </li>
          </ol>

          <p className={`text-xs ${FAINT}`}>
            To stop just the tunnel later:{" "}
            <code>docker compose stop openai-tunnel</code>. Full details in{" "}
            <code>docs/DEPLOYMENT.md</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
