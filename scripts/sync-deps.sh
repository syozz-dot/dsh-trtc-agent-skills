#!/usr/bin/env bash
# dsh-trtc-agent-skills — sync skills content from Tencent-RTC/agent-skills.
#
# Runs from the `prepack` hook on `npm publish` (and manually for local dev).
#
# Resolution order for the ref:
#   1. $TAG environment variable (explicit pin — a tag or branch name)
#   2. latest release tag from GitHub API (when releases exist)
#   3. fallback to "main" branch HEAD
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$REPO_ROOT/assets/trtc"
FALLBACK_REF="main"

REF="${TAG:-}"
if [[ -z "$REF" ]]; then
  REF="$(curl -fsSL --max-time 15 https://api.github.com/repos/Tencent-RTC/agent-skills/releases/latest \
    | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' 2>/dev/null || true)"
fi
REF="${REF:-$FALLBACK_REF}"

# Skip download if assets already populated (e.g. local dev after first sync)
if [[ -z "${FORCE_SYNC:-}" && -d "$DEST/skills/trtc/SKILL.md" ]]; then
  echo "dsh-trtc-agent-skills: assets/trtc already present, skipping sync (set FORCE_SYNC=1 to override)"
  exit 0
fi

echo "dsh-trtc-agent-skills: syncing content from Tencent-RTC/agent-skills@${REF}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# For tags: /refs/tags/<tag>.tar.gz; for branches: /refs/heads/<branch>.tar.gz
# GitHub also supports /<ref>.tar.gz as a shorthand that works for both.
curl -fsSL "https://github.com/Tencent-RTC/agent-skills/archive/${REF}.tar.gz" \
  | tar xz -C "$TMP"

# Find the extracted directory (naming varies: agent-skills-main, agent-skills-0.1.10, etc.)
EXTRACTED=$(find "$TMP" -maxdepth 1 -type d -name 'agent-skills*' | head -1)
if [[ -z "$EXTRACTED" || ! -d "$EXTRACTED" ]]; then
  echo "error: cannot find extracted agent-skills directory in archive" >&2
  ls "$TMP" >&2
  exit 1
fi

# Verify source directories exist
for dir in skills knowledge-base hooks; do
  if [[ ! -d "$EXTRACTED/$dir" ]]; then
    echo "error: $dir/ not found in Tencent-RTC/agent-skills@${REF}" >&2
    exit 1
  fi
done

mkdir -p "$DEST"

# Sync each content directory — --delete ensures removed files disappear here too.
rsync -a --delete "$EXTRACTED/skills/" "$DEST/skills/"
rsync -a --delete "$EXTRACTED/knowledge-base/" "$DEST/knowledge-base/"
rsync -a --delete "$EXTRACTED/hooks/" "$DEST/hooks/"

SKILL_COUNT=$(find "$DEST/skills" -maxdepth 2 -name 'SKILL.md' | wc -l | tr -d ' ')
FILE_COUNT=$(find "$DEST" -type f | wc -l | tr -d ' ')
echo "dsh-trtc-agent-skills: synced ${FILE_COUNT} files (${SKILL_COUNT} skills) from ${REF}"
