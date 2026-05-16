#!/bin/bash
# wintent-init.sh — NocoBase wrapper for first-boot wintent plugin auto-enable.
#
# Lifecycle on container start:
#   1. (background) wait for NocoBase API to come up (poll /api/app:getLang)
#   2. (background) for each WINTENT_PLUGINS entry not yet enabled, run
#      `yarn nocobase pm enable @wintent/<plugin>`
#   3. (background) if ANY plugin was newly enabled, send SIGTERM to PID 1
#      so docker auto-restarts the container with plugins fully loaded
#      (see I5-H3: pm enable does not trigger Plugin.load() in current
#      NocoBase version; restart forces fresh boot with plugins registered).
#   4. (foreground) exec original NocoBase entrypoint — auto-enable runs in
#      background subshell so we never block PID 1 startup.
#
# Escape hatch: WINTENT_INIT_DISABLE=1 skips all auto-enable behavior.
#
# Network tool note: NocoBase runtime image has NEITHER curl NOR wget — only
# node + yarn (verified 2026-05-16 in container with `which`). We use node's
# built-in fetch (Node 18+) for the health probe. The 2026-05-12~13 retrospective
# noted curl missing; this 2nd round adds the discovery that wget is also missing.
#
# Do NOT use `set -e` — the background subshell uses a polling loop where
# transient failures (e.g. NocoBase not yet listening) are expected.

WINTENT_PLUGINS=(
  "@wintent/plugin-clothing-store"
  "@wintent/plugin-inward-mvi"
  "@wintent/plugin-content-marketing"
  "@wintent/plugin-client-service"
  "@wintent/plugin-scheduling"
  "@wintent/plugin-delivery"
  "@wintent/plugin-config"
)

NOCOBASE_HEALTH_URL="http://127.0.0.1:13000/api/app:getLang"
NOCOBASE_HOME="/app/nocobase"
SENTINEL="/app/nocobase/storage/.wintent-init-done"
WINTENT_LOG_PREFIX="[wintent-init]"
PARENT_PID=$$

if [ "${WINTENT_INIT_DISABLE}" = "1" ]; then
  echo "${WINTENT_LOG_PREFIX} WINTENT_INIT_DISABLE=1, skipping auto-enable"
  exec /app/docker-entrypoint.sh "$@"
fi

# Sentinel lives on the nocobase_storage volume, which persists across
# container restarts but is wiped by `docker compose down -v`. So:
#   - First boot on fresh pgdata: sentinel missing → run pm enable for all
#     wintent plugins, write sentinel, then SIGTERM ourselves so docker
#     restarts the container so plugins are truly loaded (`pm enable` alone
#     does not call Plugin.load() in current NocoBase version — discovered
#     in 2026-05-12~13 retrospective).
#   - All subsequent boots: sentinel present → exec docker-entrypoint
#     directly, no wrapper overhead, no restart.
if [ -f "${SENTINEL}" ]; then
  echo "${WINTENT_LOG_PREFIX} sentinel found at ${SENTINEL}, skipping first-boot enable"
  exec /app/docker-entrypoint.sh "$@"
fi

# First-boot path: stay alive as PID 1 (do NOT exec) so we can:
#   1. install a SIGTERM trap (PID 1 in Linux ignores uncaught signals by
#      default — without an explicit trap, `kill -TERM 1` from the enable
#      subshell would have no effect and the container would never restart)
#   2. forward signals to docker-entrypoint.sh child so NocoBase shuts down
#      gracefully
#   3. exit with a non-zero status when the enable subshell triggers TERM,
#      so docker's `restart: unless-stopped` policy fires the restart that
#      actually loads the newly-enabled plugins.
trap 'echo "${WINTENT_LOG_PREFIX} TERM received, forwarding to child PID ${CHILD_PID}"; kill -TERM "${CHILD_PID}" 2>/dev/null' TERM INT

/app/docker-entrypoint.sh "$@" &
CHILD_PID=$!

(
  # Wait for NocoBase to accept HTTP requests (max ~5 minutes).
  # Uses node fetch — NocoBase runtime image has neither curl nor wget.
  attempts=0
  max_attempts=150
  health_check_js='fetch(process.argv[1]).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1));'
  until node -e "${health_check_js}" "${NOCOBASE_HEALTH_URL}" > /dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "${attempts}" -ge "${max_attempts}" ]; then
      echo "${WINTENT_LOG_PREFIX} NocoBase did not respond at ${NOCOBASE_HEALTH_URL} after ${max_attempts} attempts; aborting auto-enable" >&2
      exit 0
    fi
    sleep 2
  done

  echo "${WINTENT_LOG_PREFIX} NocoBase up, enabling ${#WINTENT_PLUGINS[@]} wintent plugins (first-boot path)"

  cd "${NOCOBASE_HOME}" || {
    echo "${WINTENT_LOG_PREFIX} ${NOCOBASE_HOME} not found; aborting" >&2
    exit 0
  }

  for plugin in "${WINTENT_PLUGINS[@]}"; do
    # `pm enable` is idempotent. Output format is volatile across NocoBase
    # versions, so do not rely on it — sentinel file gates restart decision.
    yarn nocobase pm enable "${plugin}" > /dev/null 2>&1 \
      && echo "${WINTENT_LOG_PREFIX} enabled: ${plugin}" \
      || echo "${WINTENT_LOG_PREFIX} ENABLE FAILED: ${plugin}" >&2
  done

  touch "${SENTINEL}"
  echo "${WINTENT_LOG_PREFIX} first-boot enables complete, signaling parent for restart so plugins load (see I5-H3)"
  sleep 2
  kill -TERM "${PARENT_PID}"
) &

wait "${CHILD_PID}"
EXIT_CODE=$?
echo "${WINTENT_LOG_PREFIX} docker-entrypoint child exited with code ${EXIT_CODE}"
exit "${EXIT_CODE}"
