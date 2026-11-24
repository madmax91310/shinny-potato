#!/usr/bin/env bash
# Rebundle the current inputs at the certified reference time before reusing proof.
set -euo pipefail
proof=${1:-}
[[ -f "$proof" ]] || exit 1
reference_date=$(node scripts/tweet-midi-ci.mjs date "$proof") || exit 1
TWEET_MIDI_REFERENCE_DATE="$reference_date" node scripts/build-tweet-midi-verifier.mjs
node scripts/tweet-midi-ci.mjs reuse test-artifacts/tweet-midi-verifier.mjs "$proof"
