#!/usr/bin/env bash
# Session-start hook: keeps code-review-graph up to date
# Runs silently on success, warns on missing/corrupt graph

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(pwd)")"
GRAPH_DIR="${REPO_ROOT}/.code-review-graph"
GRAPH_DB="${GRAPH_DIR}/graph.db"
CRG_CLI="/root/.cache/uv/archive-v0/-gSBb1nTsdSZGbMYd1r21/bin/code-review-graph"

# Check if CLI exists
if [ ! -f "$CRG_CLI" ]; then
  echo "[graph-hook] WARNING: code-review-graph CLI not found at ${CRG_CLI}" >&2
  echo "[graph-hook] Graph tools will not work. Install with: pip install code-review-graph" >&2
  exit 0
fi

# If graph.db missing or empty — warn and suggest full rebuild
if [ ! -f "$GRAPH_DB" ] || [ ! -s "$GRAPH_DB" ]; then
  echo "[graph-hook] WARNING: Graph database missing or empty at ${GRAPH_DB}" >&2
  echo "[graph-hook] Run full rebuild: rm -rf ${GRAPH_DIR} && ${CRG_CLI} build --repo ${REPO_ROOT}" >&2
  exit 0
fi

# Check if graph has data (more than just schema — file size > 10KB means it has real data)
GRAPH_SIZE=$(stat -c%s "$GRAPH_DB" 2>/dev/null || stat -f%z "$GRAPH_DB" 2>/dev/null || echo "0")
if [ "$GRAPH_SIZE" -lt 10240 ]; then
  echo "[graph-hook] WARNING: Graph database looks empty (${GRAPH_SIZE} bytes)" >&2
  echo "[graph-hook] Run full rebuild: rm -rf ${GRAPH_DIR} && ${CRG_CLI} build --repo ${REPO_ROOT}" >&2
  exit 0
fi

# Run incremental update silently — only show output on error
UPDATE_OUTPUT=$("$CRG_CLI" update --repo "$REPO_ROOT" 2>&1) || {
  echo "[graph-hook] ERROR: Graph update failed:" >&2
  echo "$UPDATE_OUTPUT" >&2
  echo "[graph-hook] Try full rebuild: rm -rf ${GRAPH_DIR} && ${CRG_CLI} build --repo ${REPO_ROOT}" >&2
  exit 0
}

# Silent success — no output clutter
exit 0
