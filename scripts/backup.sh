#!/usr/bin/env bash
# Dump the Postgres database to backups/todo-app-<timestamp>.sql.gz and
# prune old backups, keeping the most recent $RETAIN_DAYS (default 14).
#
# Usage:
#   ./scripts/backup.sh
#   RETAIN_DAYS=30 ./scripts/backup.sh
#
# Intended to be run from the repo root, and works well from cron:
#   0 3 * * * cd /path/to/todo-app && ./scripts/backup.sh >> backups/backup.log 2>&1

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

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
RETAIN_DAYS="${RETAIN_DAYS:-14}"

BACKUP_DIR="$REPO_ROOT/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/todo-app-${TIMESTAMP}.sql.gz"

echo "Dumping database '$POSTGRES_DB' from the 'db' service..."
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUT_FILE"

echo "Wrote $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"

echo "Pruning backups older than $RETAIN_DAYS day(s)..."
find "$BACKUP_DIR" -name 'todo-app-*.sql.gz' -mtime "+$RETAIN_DAYS" -print -delete

echo "Done."
