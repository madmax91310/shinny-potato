#!/usr/bin/env bash
# Publication is serialized by the workflow; compare published identity, not just
# a moving master head. Incoming collector commits must not starve validated code.
set -euo pipefail
node "$(dirname "${BASH_SOURCE[0]}")/check-pages-head.mjs" "$@"
