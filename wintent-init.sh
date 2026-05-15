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
# Network tool note: NocoBase runtime image has wget (not curl). This was
# discovered in the 2026-05-12~13 docker validation session; init script
# uses wget to avoid curl: command not found at runtime.

set -e

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
WINTENT_LOG_PREFIX="[wintent-init]"

if [ "${WINTENT_INIT_DISABLE}" = "1" ]; then
  echo "${WINTENT_LOG_PREFIX} WINTENT_INIT_DISABLE=1, skipping auto-enable"
  exec /app/docker-entrypoint.sh "$@"
fi

(
  # Wait for NocoBase to accept HTTP requests (max ~5 minutes)
  attempts=0
  max_attempts=150
  until wget -q -O - "${NOCOBASE_HEALTH_URL}" > /dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "${attempts}" -ge "${max_attempts}" ]; then
      echo "${WINTENT_LOG_PREFIX} NocoBase did not respond at ${NOCOBASE_HEALTH_URL} after ${max_attempts} attempts; aborting auto-enable" >&2
      exit 0
    fi
    sleep 2
  done

  echo "${WINTENT_LOG_PREFIX} NocoBase up, checking ${#WINTENT_PLUGINS[@]} wintent plugins"

  cd "${NOCOBASE_HOME}" || {
    echo "${WINTENT_LOG_PREFIX} ${NOCOBASE_HOME} not found; aborting" >&2
    exit 0
  }

  newly_enabled=0
  for plugin in "${WINTENT_PLUGINS[@]}"; do
    # `pm enable` is idempotent: returns 0 whether plugin was already enabled
    # or newly enabled. We capture stdout to detect the "enabled" outcome and
    # increment newly_enabled counter only when state actually changes.
    output=$(yarn nocobase pm enable "${plugin}" 2>&1 || true)
    if echo "${output}" | grep -qiE "enabled|installed"; then
      if echo "${output}" | grep -qv "already"; then
        newly_enabled=$((newly_enabled + 1))
        echo "${WINTENT_LOG_PREFIX} newly enabled: ${plugin}"
      fi
    fi
  done

  if [ "${newly_enabled}" -gt 0 ]; then
    echo "${WINTENT_LOG_PREFIX} ${newly_enabled} plugin(s) newly enabled — restarting container so plugins load (see I5-H3)"
    sleep 2
    kill -TERM 1
  else
    echo "${WINTENT_LOG_PREFIX} all plugins already enabled, no restart needed"
  fi
) &

# Foreground: exec original NocoBase entrypoint, preserving PID 1 semantics
exec /app/docker-entrypoint.sh "$@"
