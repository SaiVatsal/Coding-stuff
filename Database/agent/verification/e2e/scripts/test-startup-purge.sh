#!/bin/bash
# Startup purge: at boot the agent removes every container labeled with its
# agent_id — the single-agent invariant means no other process owns containers
# with the same agent_id, so blanket removal is safe. Pre-seed a stray, start
# the agent, assert it's gone.
set -euo pipefail

source "$(dirname "$0")/lib.sh"

WORK="/tmp/agent-work-purge"
AGENT_ID="66666666-6666-6666-6666-666666666666"
STRAY_NAME="databasus-verif-purge-stray"
STRAY_LABEL="databasus.verification.agent_id=${AGENT_ID}"

rm -rf "$WORK"
mkdir -p "$WORK"
cd "$WORK"

reset_mock_state
reset_mock_version

docker rm -f "$STRAY_NAME" >/dev/null 2>&1 || true
docker run -d --name "$STRAY_NAME" --label "$STRAY_LABEL" alpine sleep 600 >/dev/null

if ! docker ps -a --filter "label=$STRAY_LABEL" --format '{{.Names}}' | grep -q "$STRAY_NAME"; then
  echo "FAIL: pre-seed stray container not present"
  exit 1
fi
echo "Pre-seeded stray container $STRAY_NAME with label $STRAY_LABEL"

cp "$ARTIFACTS/agent-v1" ./databasus-verification-agent
chmod +x ./databasus-verification-agent

start_agent "$AGENT_ID"

GONE=0
for _ in $(seq 1 30); do
  if [ -z "$(docker ps -a --filter "label=$STRAY_LABEL" --format '{{.Names}}')" ]; then
    GONE=1
    break
  fi
  sleep 1
done

if [ "$GONE" -ne 1 ]; then
  echo "FAIL: stray container still present after agent start; PurgeContainers did not run"
  docker ps -a --filter "label=$STRAY_LABEL"
  echo "---- agent.out (last 30) ----"
  tail -30 agent.out
  stop_agent
  exit 1
fi
echo "Stray container purged by agent startup"

stop_agent

if ! leak_check "$AGENT_ID"; then
  exit 1
fi

echo "Verification agent startup-purge e2e passed"
