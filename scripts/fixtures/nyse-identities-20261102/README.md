Official NYSE identity subsets obtained 2026-11-02 via the ordinary public API.
Each entry preserves the URL and SHA-256 of the full response, but only the five
identity fields used here are retained. No quote prices, financial metrics,
board members or chart history are imported. Full-response digests are not
claimed to be hashes of these reduced test fixtures.
Seven existing US/CA/KY ISIN NSINs match the NYSE CUSIP/CINS exactly. Spotify's
LU1778762911 does not encode its L8681T102 CUSIP. A separately downloaded
statutory SEC N-PX filing supplies 21 explicit, consistent ISIN/CUSIP records,
filed 2026-08-25 (period 2026-06-30). The full immutable XML and receipt are
retained and fingerprint-checked. This reference is not re-dated on each run;
current NYSE security identity must still match. An unknown Luxembourg ISIN
still fails without its own qualified bridge. No ISIN is inferred from a ticker.
The full official Nasdaq otherlisted.txt response was empty (header/footer,
131 bytes), SHA-256 dbe69fbb1ed0d6d94177febfcb4b5c51bcb329163df2f5f50556c52bf93f5a92.
The fallback does not renew that unavailable source's last valid reference.
