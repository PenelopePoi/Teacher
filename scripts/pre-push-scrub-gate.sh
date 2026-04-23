#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2024-2026 David and contributors.
#
# Pre-push scrub gate.
#
# Git hook that refuses to push to the public `reconsumeralization` remote
# if any CellAI-derived file in the push range lacks a matching entry in
# the latest scrub manifest (docs/scrub-manifests/latest.json).
#
# Install:
#   ln -s ../../scripts/pre-push-scrub-gate.sh .git/hooks/pre-push
#   chmod +x .git/hooks/pre-push
#
# Bypass: there is NO bypass flag in v1. If you need to push content that
# legitimately cannot be manifest-tracked, land a v2 of this hook that
# supports an explicit allowlist, reviewed in the PR that introduces it.
#
# Contract: git invokes this hook with `$1` = remote name, `$2` = remote
# URL, and pushes a newline-separated list of ref updates on stdin in the
# form: `<local-ref> <local-sha> <remote-ref> <remote-sha>`.

set -euo pipefail

REMOTE_NAME="${1:-}"
REMOTE_URL="${2:-}"

# Only gate pushes to the public repo. Contributors may push freely to
# their own forks or to the private sister remote.
PUBLIC_REMOTE_RE='reconsumeralization/[Tt]eacher'
if [[ -z "${REMOTE_NAME}" ]] || ! [[ "${REMOTE_URL}" =~ ${PUBLIC_REMOTE_RE} ]]; then
    exit 0
fi

MANIFEST_PATH="docs/scrub-manifests/latest.json"

# Paths that are assumed to be CellAI-derived and therefore subject to the
# scrub gate. Extend this list in lockstep with the ingest runbook.
CELLAI_PATHS=(
    "curriculum/medical/"
    "curriculum/cellai/"
)

# Read ref updates from stdin.
CHANGED_FILES=()
while read -r local_ref local_sha remote_ref remote_sha; do
    if [[ "${local_sha}" == "0000000000000000000000000000000000000000" ]]; then
        # Deleting a branch; nothing to scan.
        continue
    fi
    if [[ "${remote_sha}" == "0000000000000000000000000000000000000000" ]]; then
        # New branch; compare against the remote's default branch merge-base.
        RANGE="origin/main..${local_sha}"
    else
        RANGE="${remote_sha}..${local_sha}"
    fi
    while IFS= read -r f; do
        [[ -z "${f}" ]] && continue
        CHANGED_FILES+=("${f}")
    done < <(git diff --name-only "${RANGE}" 2>/dev/null || true)
done

# No changes to gate.
if [[ ${#CHANGED_FILES[@]} -eq 0 ]]; then
    exit 0
fi

# Filter to CellAI-derived paths only.
CELLAI_CHANGES=()
for f in "${CHANGED_FILES[@]}"; do
    for prefix in "${CELLAI_PATHS[@]}"; do
        if [[ "${f}" == ${prefix}* ]]; then
            CELLAI_CHANGES+=("${f}")
            break
        fi
    done
done

# No CellAI-derived changes.
if [[ ${#CELLAI_CHANGES[@]} -eq 0 ]]; then
    exit 0
fi

# There are CellAI-derived changes. Require a manifest.
if [[ ! -f "${MANIFEST_PATH}" ]]; then
    echo "[pre-push-scrub-gate] REFUSED: push includes CellAI-derived content but" 1>&2
    echo "                       ${MANIFEST_PATH} is missing." 1>&2
    echo "                       Run the Forgetful Agent and commit the manifest" 1>&2
    echo "                       before pushing. See docs/ingest.md." 1>&2
    exit 1
fi

# Every CellAI changed file must appear in the manifest.
MISSING=()
for f in "${CELLAI_CHANGES[@]}"; do
    if ! grep -q "\"path\":\s*\"${f}\"" "${MANIFEST_PATH}" 2>/dev/null; then
        MISSING+=("${f}")
    fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
    echo "[pre-push-scrub-gate] REFUSED: the following CellAI-derived files" 1>&2
    echo "                       have no entry in ${MANIFEST_PATH}:" 1>&2
    for f in "${MISSING[@]}"; do
        echo "                         - ${f}" 1>&2
    done
    echo "                       Run the Forgetful Agent on the source tree and" 1>&2
    echo "                       update the manifest. See docs/ingest.md." 1>&2
    exit 1
fi

echo "[pre-push-scrub-gate] OK: ${#CELLAI_CHANGES[@]} CellAI-derived file(s) covered by manifest."
exit 0
