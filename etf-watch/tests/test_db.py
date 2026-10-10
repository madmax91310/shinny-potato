import os

from etf_watch import db
from etf_watch.models import ETFProduct


def make_product(isin="FR0014017NX3", name="Amundi PEA Global MSCI ACWI"):
    return ETFProduct(
        isin=isin, name=name, issuer="Amundi",
        source_name="amundi", source_url="https://example.com/article",
        ticker="GPEA", ter="0.18%",
    )


def test_init_db_creates_tables(tmp_path):
    db_path = str(tmp_path / "test.db")
    db.init_db(db_path)
    assert os.path.exists(db_path)
    with db.connect(db_path) as conn:
        tables = {
            row["name"]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
    assert {"etfs", "runs"}.issubset(tables)


def test_insert_and_get_known_isins(tmp_path):
    db_path = str(tmp_path / "test.db")
    db.init_db(db_path)
    with db.connect(db_path) as conn:
        db.insert_new_etf(conn, make_product())
        known = db.get_known_isins(conn)
    assert known == {"FR0014017NX3"}


def test_insert_is_idempotent_on_isin(tmp_path):
    db_path = str(tmp_path / "test.db")
    db.init_db(db_path)
    with db.connect(db_path) as conn:
        db.insert_new_etf(conn, make_product())
        db.insert_new_etf(conn, make_product())  # duplicate ISIN
        count = conn.execute("SELECT COUNT(*) AS c FROM etfs").fetchone()["c"]
    assert count == 1


def test_record_run(tmp_path):
    db_path = str(tmp_path / "test.db")
    db.init_db(db_path)
    with db.connect(db_path) as conn:
        db.record_run(
            conn, started_at="2026-08-21T10:00:00+00:00",
            finished_at="2026-08-21T10:01:00+00:00",
            sources_ok=["amundi"], sources_failed=["ishares"],
            products_seen=5, new_products=1, errors=1,
        )
        row = conn.execute("SELECT * FROM runs").fetchone()
    assert row["new_products"] == 1
    assert row["sources_ok"] == "amundi"
    assert row["sources_failed"] == "ishares"
