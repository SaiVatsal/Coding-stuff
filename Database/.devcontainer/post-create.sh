#!/usr/bin/env bash
set -euo pipefail

# The docker-in-docker feature pins iptables to the legacy backend, which needs the
# ip_tables/iptable_nat kernel modules. Hosts running an nft-only firewall stack never
# load them, so dockerd dies initializing the bridge driver. Re-point iptables at the
# nft backend and restart the daemon the entrypoint already gave up on.
if ! docker info >/dev/null 2>&1; then
  sudo update-alternatives --set iptables /usr/sbin/iptables-nft
  sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-nft
  sudo pkill dockerd || true
  sudo pkill containerd || true
  sudo /usr/local/share/docker-init.sh
fi

sudo chown -R vscode:vscode \
  /workspaces/databasus \
  /home/vscode/go \
  /home/vscode/.cache \
  /home/vscode/.local/share/pnpm

cd /workspaces/databasus

cd backend
go mod download
cd ..

cd frontend
pnpm install --frozen-lockfile
cd ..

pre-commit install --install-hooks
