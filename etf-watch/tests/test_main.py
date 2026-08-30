import json

from etf_watch import db, main
from etf_watch.scrapers.base import BaseScraper, ScraperResult
from etf_watch.models import ETFProduct


class StubScraper(BaseScraper):
    """A scraper stand-in whose result is controlled per-test."""

    name = "stub"
    issuer = "Stub Issuer"
    _result = ScraperResult()

    def run(self):
        return type(self)._result


def make_product(isin, name="Stub ETF"):
    return ETFProduct(
        isin=isin, name=name, issuer="Stub Issuer",
        source_name="stub", source_url="https://example.com",
    )


def test_first_run_establishes_baseline_without_alerts(tmp_path, monkeypatch, capsys):
    db_path = str(tmp_path / "test.db")
    StubScraper._result = ScraperResult(products=[make_product("FR0014017NX3")], ok=True)
    monkeypatch.setitem(main.SCRAPER_CLASSES, "stub", StubScraper)
    monkeypatch.setattr(main.config, "SOURCES", {"stub": {"enabled": True, "issuer": "Stub"}})

    exit_code = main.run(["--db", db_path])
    captured = capsys.readouterr()

    assert exit_code == 0
    assert "Aucun nouveau" in captured.out  # no alert on the very first run

    with db.connect(db_path) as conn:
        known = db.get_known_isins(conn)
    assert known == {"FR0014017NX3"}  # but it IS recorded as seen


def test_second_run_reports_only_truly_new_isin(tmp_path, monkeypatch, capsys):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setitem(main.SCRAPER_CLASSES, "stub", StubScraper)
    monkeypatch.setattr(main.config, "SOURCES", {"stub": {"enabled": True, "issuer": "Stub"}})

    StubScraper._result = ScraperResult(products=[make_product("FR0014017NX3")], ok=True)
    main.run(["--db", db_path])  # baseline run

    StubScraper._result = ScraperResult(
        products=[make_product("FR0014017NX3"), make_product("LU9876543210", "New ETF")],
        ok=True,
    )
    main.run(["--db", db_path])  # second run: one genuinely new ISIN
    captured = capsys.readouterr()

    assert "LU9876543210" in captured.out
    assert captured.out.count("ISIN") == 1  # only the new one is announced


def test_dry_run_does_not_persist(tmp_path, monkeypatch):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setitem(main.SCRAPER_CLASSES, "stub", StubScraper)
    monkeypatch.setattr(main.config, "SOURCES", {"stub": {"enabled": True, "issuer": "Stub"}})
    StubScraper._result = ScraperResult(products=[make_product("FR0014017NX3")], ok=True)

    main.run(["--db", db_path, "--dry-run"])

    with db.connect(db_path) as conn:
        known = db.get_known_isins(conn)
    assert known == set()


def test_all_sources_failing_returns_nonzero_exit(tmp_path, monkeypatch):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setitem(main.SCRAPER_CLASSES, "stub", StubScraper)
    monkeypatch.setattr(main.config, "SOURCES", {"stub": {"enabled": True, "issuer": "Stub"}})
    StubScraper._result = ScraperResult(products=[], ok=False, error="site unreachable")

    exit_code = main.run(["--db", db_path])
    assert exit_code == 1


def test_json_format_emits_valid_structured_payload(tmp_path, monkeypatch, capsys):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setitem(main.SCRAPER_CLASSES, "stub", StubScraper)
    monkeypatch.setattr(main.config, "SOURCES", {"stub": {"enabled": True, "issuer": "Stub"}})

    StubScraper._result = ScraperResult(products=[make_product("FR0014017NX3")], ok=True)
    main.run(["--db", db_path, "--format", "json"])  # baseline run
    capsys.readouterr()

    StubScraper._result = ScraperResult(
        products=[make_product("FR0014017NX3"), make_product("LU9876543210", "New ETF")],
        ok=True,
    )
    main.run(["--db", db_path, "--format", "json"])
    captured = capsys.readouterr()

    payload = json.loads(captured.out)
    assert payload["is_first_run"] is False
    assert payload["catalogue_size"] == 2
    assert payload["sources_ok"] == ["stub"]
    assert len(payload["new_launches"]) == 1
    assert payload["new_launches"][0]["isin"] == "LU9876543210"
