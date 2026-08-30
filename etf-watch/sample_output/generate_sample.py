"""Generates sample_output/example_run.txt from realistic (hand-crafted,
not live-scraped) ETFProduct examples, so you can see the tool's output
format without needing network access. Run: python sample_output/generate_sample.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etf_watch.models import ETFProduct
from etf_watch.summarize import build_digest

examples = [
    ETFProduct(
        isin="FR0014017NX3", name="Amundi PEA Global MSCI ACWI UCITS ETF",
        issuer="Amundi", source_name="amundi",
        source_url="https://www.amundietf.fr/fr/professionnels/a-propos/actualites/lancement-gpea",
        ticker="GPEA", index="MSCI ACWI", ter="0.18%",
        asset_class="equity", launch_date="15 juillet 2026",
    ),
    ETFProduct(
        isin="IE00BKWQ0DQ4", name="iShares Core MSCI Europe UCITS ETF EUR (Acc)",
        issuer="BlackRock / iShares", source_name="ishares",
        source_url="https://www.ishares.com/uk/individual/en/products/etf-investments",
        ticker="EMEA", index="MSCI Europe", ter="0.12%",
        asset_class="equity", launch_date="2026-06-02",
    ),
    ETFProduct(
        isin="LU2861254893", name="SPDR Bloomberg Euro Government Bond 1-3Y UCITS ETF",
        issuer="SPDR / State Street", source_name="spdr",
        source_url="https://www.ssga.com/library-content/products/fund-docs/etfs/emea/product-list-emea.pdf",
        ticker="SPFB", asset_class="fixed_income",
    ),
]

digest = build_digest(examples)
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "example_run.txt")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(digest + "\n")

print(digest)
print(f"\n(written to {output_path})")
