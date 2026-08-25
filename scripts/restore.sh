#!/usr/bin/env bash
# Restore the Postgres database from a backup produced by backup.sh.
# This REPLACES all current data in the database.
#
# Usage:
#   ./scripts/restore.sh backups/todo-app-20260101-030000.sql.gz

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ $# -ne 1 ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "error: file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "error: .env not found in $REPO_ROOT (copy .env.example first)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

POSTGRES_USER="${POSTGRES_USER:-todo_app}"
POSTGRES_DB="${POSTGRES_DB:-todo_app}"

echo "This will REPLACE all data in database '$POSTGRES_DB' with the contents of:"
echo "  $BACKUP_FILE"
read -r -p "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

echo "Stopping backend and MCP services so nothing writes during restore..."
docker compose stop backend mcp

echo "Dropping and recreating the public schema..."
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restarting backend and MCP services..."
docker compose start backend mcp

echo "Done."
