from etf_watch.render_dashboard import render

SAMPLE_PAYLOAD = {
    "generated_at": "2026-08-23T09:00:00+00:00",
    "is_first_run": False,
    "sources_ok": ["amundi", "justetf"],
    "sources_failed": ["ishares"],
    "products_seen_this_run": 12,
    "catalogue_size": 140,
    "new_launches": [
        {
            "isin": "FR0014017NX3",
            "name": "Amundi PEA Global MSCI ACWI UCITS ETF",
            "issuer": "Amundi",
            "ticker": "GPEA",
            "index_tracked": "MSCI ACWI",
            "ter": "0.18%",
            "asset_class": "equity",
            "region": None,
            "launch_date": "15 juillet 2026",
            "currency": None,
            "source_name": "amundi",
            "source_url": "https://www.amundietf.fr/fr/actus/lancement-gpea",
        }
    ],
}


def test_render_includes_product_fields():
    html_out = render(SAMPLE_PAYLOAD)
    assert "Amundi PEA Global MSCI ACWI UCITS ETF" in html_out
    assert "FR0014017NX3" in html_out
    assert "GPEA" in html_out
    assert "0.18%" in html_out


def test_render_includes_tweet_text():
    html_out = render(SAMPLE_PAYLOAD)
    assert "Nouvel ETF Amundi" in html_out
    assert "amundietf.fr/fr/actus/lancement-gpea" in html_out


def test_render_shows_issuer_chip_states():
    html_out = render(SAMPLE_PAYLOAD)
    assert "justETF" in html_out  # config issuer label for justetf source
    assert "iShares" in html_out or "BlackRock" in html_out


def test_render_first_run_uses_baseline_notice():
    payload = dict(SAMPLE_PAYLOAD, is_first_run=True, new_launches=[])
    html_out = render(payload)
    assert "Ligne de base" in html_out
    assert "140" in html_out  # catalogue_size


def test_render_empty_launches_shows_empty_state():
    payload = dict(SAMPLE_PAYLOAD, new_launches=[])
    html_out = render(payload)
    assert "Aucun nouveau lancement détecté" in html_out


def test_render_escapes_html_in_product_name():
    payload = dict(SAMPLE_PAYLOAD)
    payload["new_launches"] = [
        dict(SAMPLE_PAYLOAD["new_launches"][0], name="<script>alert(1)</script>")
    ]
    html_out = render(payload)
    assert "<script>alert(1)</script>" not in html_out
    assert "&lt;script&gt;" in html_out


def test_render_is_valid_shell_with_title():
    html_out = render(SAMPLE_PAYLOAD)
    assert "<title>ETF Watch Europe</title>" in html_out
