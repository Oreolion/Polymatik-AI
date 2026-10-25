#!/usr/bin/env bash

# Execute this launcher; sourcing it would change the calling shell's PATH.
if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
  printf 'Run this with bash scripts/node24.sh; do not source it.\n' >&2
  return 1
fi

set -euo pipefail

project_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
node_version=$(tr -d '\r\n' < "$project_root/.node-version")

if [[ "${1:-}" == '--help' ]]; then
  printf 'Usage: bash scripts/node24.sh [--node-version 24.x.y] [command [args...]]\n'
  printf 'No command opens a dedicated shell. Exit it to return to your original terminal.\n'
  exit 0
fi

if [[ "${1:-}" == '--node-version' ]]; then
  node_version=${2:-}
  if [[ $# -lt 2 ]]; then
    printf 'Specify a Node version in the form 24.x.y.\n' >&2
    exit 2
  fi
  shift 2
fi

if [[ ! "$node_version" =~ ^24\.[0-9]+\.[0-9]+$ ]]; then
  printf 'Specify a Node version in the form 24.x.y.\n' >&2
  exit 2
fi

if [[ -z "${NVM_HOME:-}" ]]; then
  printf 'NVM_HOME is unset. Set it to your existing NVM installation directory.\n' >&2
  exit 1
fi

nvm_directory=$NVM_HOME
if command -v cygpath >/dev/null 2>&1; then
  nvm_directory=$(cygpath -u -- "$nvm_directory")
fi
node_directory="$nvm_directory/v$node_version"
node_binary="$node_directory/node.exe"
if [[ ! -x "$node_binary" ]]; then
  node_binary="$node_directory/node"
fi

if [[ ! -x "$node_binary" ]]; then
  printf 'Node %s is not installed in NVM_HOME.\n' "$node_version" >&2
  printf 'Install it alongside existing versions with: nvm install %s\n' "$node_version" >&2
  printf 'The launcher does not install runtimes or change the shared NVM selection.\n' >&2
  exit 1
fi

actual_version=$("$node_binary" --version)
if [[ "$actual_version" != "v$node_version" ]]; then
  printf 'Selected executable reports %s, which does not match v%s.\n' "$actual_version" "$node_version" >&2
  exit 1
fi

export PATH="$node_directory:$PATH"
hash -r
cd -- "$project_root"

if [[ $# -eq 0 ]]; then
  printf 'Polymatik: Node %s in this shell. Type exit to return to your original terminal.\n' "$actual_version"
  exec "$BASH" --noprofile --norc -i
fi

exec "$@"
