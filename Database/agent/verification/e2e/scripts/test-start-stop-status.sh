#!/bin/bash
set -euo pipefail

source "$(dirname "$0")/lib.sh"

WORK="/tmp/agent-work-startstop"
AGENT_ID="22222222-2222-2222-2222-222222222222"

dump_daemon_log() {
  echo "---- databasus-verification.daemon.log ----"
  cat databasus-verification.daemon.log 2>/dev/null || echo "(no daemon log)"
}

rm -rf "$WORK"
mkdir -p "$WORK"
cd "$WORK"

reset_mock_version

cp "$ARTIFACTS/agent-v1" ./databasus-verification-agent
chmod +x ./databasus-verification-agent

LAUNCH_FLAGS=(
  --databasus-host "$MOCK"
  --agent-id "$AGENT_ID"
  --token test-token
  --max-cpu 4
  --max-ram-mb 2048
  --max-disk-gb 20
  --max-concurrent-jobs 2
  --allow-insecure-http
  --skip-update
)

# 1) status before start -> not running.
STATUS_OUT="$(./databasus-verification-agent status)"
echo "status (before): $STATUS_OUT"
if ! echo "$STATUS_OUT" | grep -q "Agent is not running"; then
  echo "FAIL: expected 'Agent is not running' before start"
  exit 1
fi

# 2) start detaches, returns promptly, prints the daemon PID.
START_OUT="$(./databasus-verification-agent start "${LAUNCH_FLAGS[@]}")"
echo "start: $START_OUT"
if ! echo "$START_OUT" | grep -q "Agent started in background (PID "; then
  echo "FAIL: start did not report a background PID"
  dump_daemon_log
  exit 1
fi

# 3) start created the single-instance lock file.
if [ ! -f databasus-verification.lock ]; then
  echo "FAIL: databasus-verification.lock not created"
  dump_daemon_log
  exit 1
fi

# 4) the detached daemon heartbeats.
RESUMED=0
for _ in $(seq 1 20); do
  COUNT="$(hb_count || echo 0)"
  if [ "${COUNT:-0}" -ge 1 ]; then
    RESUMED=1
    break
  fi
  sleep 1
done
if [ "$RESUMED" -ne 1 ]; then
  echo "FAIL: detached daemon did not heartbeat after start"
  dump_daemon_log
  exit 1
fi
echo "Daemon heartbeating"

# 5) status -> running with a live PID.
STATUS_OUT="$(./databasus-verification-agent status)"
echo "status (running): $STATUS_OUT"
if ! echo "$STATUS_OUT" | grep -q "Agent is running (PID "; then
  echo "FAIL: status did not report running"
  dump_daemon_log
  exit 1
fi
PID="$(echo "$STATUS_OUT" | sed -n 's/.*PID \([0-9]*\).*/\1/p')"
if ! kill -0 "$PID" 2>/dev/null; then
  echo "FAIL: reported PID $PID is not alive"
  exit 1
fi

# 6) a second agent in the same directory is rejected by the lock. `run` is the
# foreground command, so the lock error surfaces directly on its stderr.
set +e
SECOND_OUT="$(./databasus-verification-agent run "${LAUNCH_FLAGS[@]}" 2>&1)"
SECOND_RC=$?
set -e
echo "second run: $SECOND_OUT"
if [ "$SECOND_RC" -eq 0 ]; then
  echo "FAIL: a second agent started while one was already running"
  exit 1
fi
if ! echo "$SECOND_OUT" | grep -q "another instance is already running"; then
  echo "FAIL: second agent did not fail with the single-instance error"
  exit 1
fi
echo "Second instance rejected"

# 7) stop terminates the daemon within the stop timeout.
./databasus-verification-agent stop
GONE=0
for _ in $(seq 1 35); do
  if ! kill -0 "$PID" 2>/dev/null; then
    GONE=1
    break
  fi
  sleep 1
done
if [ "$GONE" -ne 1 ]; then
  echo "FAIL: agent (PID $PID) still alive after stop"
  exit 1
fi
echo "Agent stopped"

# 8) status after stop -> not running again.
STATUS_OUT="$(./databasus-verification-agent status)"
echo "status (after): $STATUS_OUT"
if ! echo "$STATUS_OUT" | grep -q "Agent is not running"; then
  echo "FAIL: expected 'Agent is not running' after stop"
  exit 1
fi

echo "Verification agent start/stop/status e2e passed"
