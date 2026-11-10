# Recorded snapshot versus reusable workflow caller

Two ordinary scheduled producers recorded different validated observations but
`actions/deploy-pages@v5.0.1` used their older caller GITHUB_SHA as the Pages build
version. Another producer already used each caller version. The correct new
artifact was selected; the public verifier nevertheless observed the preceding
snapshot for all30attempts. Full run/job/artifact identities are in `cases.json`.
The monthly artifact's actual build-info was inspected directly from its tar.

The replacement uses the same official Pages API, uploaded artifact, OIDC,
permissions and environment, with the actual recorded commit. It preserves the
source/caller identity separately. It never rewrites GITHUB_SHA or a financial
receipt. Existing code/data order guards and the full public byte verifier remain
mandatory. Only the current job's incomplete deployment can be cancelled.

This local regression does not prove production deployment, nor that all old
publication failures have this single upstream cause. An ordinary producer on
the new code must be observed through recording and public verification.

API contract: https://docs.github.com/en/rest/pages/pages#create-a-github-pages-deployment
Original version selection: https://github.com/actions/deploy-pages/blob/v5.0.1/src/internal/context.js

A third ordinary run42873841828 exposed an independent execution-budget limit:
checkout consumed470s, composition53s, build43s, browser preparation/smoke56s,
then Pages stayed in syncing_files until the job's20-minute limit cancelled it.
Its own10-minute deployment bound and the unchanged public verifier had no
reserved time. The job now allows40minutes for these distinct bounded stages;
Pages still has its original10-minute limit and no public/financial check is
relaxed. `filter: blob:none` preserves the full commit graph and complete current
checkout while avoiding eager download of unused historical blobs. Proofs needed
by an old revision remain materialized on demand, not deleted or waived.
