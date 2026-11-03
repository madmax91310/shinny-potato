"""Qualify an issuer split solely to reconcile comparison quote units.

Never rescale the collected daily prices, infer a split from a price ratio,
or infer a dividend adjustment. Other instruments keep their existing guards.
"""
import datetime as dt
import hashlib
import math
import re
from issuer_documents import download, pdf_text

NOTICE='https://www.ssga.com/library-content/announcement/etfs/emea/2025/en/en-spdr-i-shareholder-notice-stock-split.pdf'


def qualify(config, now, fetch=None):
    if not config.get('splitComparisonNotice'):
        return None
    identity=(config.get('isin'),config.get('symbol'),config.get('mic'),config.get('currency'),config.get('field'),config.get('consumerScope'))
    if identity!=('IE00B3YLTY66','IMIE.PA','XPAR','EUR','adjclose','catalog') or config['splitComparisonNotice']!=NOTICE:
        raise ValueError('Unqualified split comparison identity or notice')
    body=(fetch or download)(NOTICE)
    text=' '.join(pdf_text(body).split())
    if 'IE00B3YLTY66' not in text or 'USD Unhedged (Acc)' not in text or 'no change to any of the identifiers' not in text:
        raise ValueError('Split notice exact accumulating share or continuity missing')
    ratios=re.findall(r'stock split ratio will be (\d+)-to-(\d+)',text)
    dates=re.findall(r'Ex-date\s+(\d+ [A-Za-z]+ \d{4})',text)
    if ratios!=[('25','1')] or dates!=['23 February 2026'] or 'Date: 20 January 2026' not in text:
        raise ValueError('Official split ratio/date changed; new qualification required')
    exdate=dt.date(2026,2,23)
    if now.date()<exdate or config.get('periodStart','9999-99')>='2026-02':
        raise ValueError('Split comparison outside qualified historical period')
    return {'isin':config['isin'],'sourceUrl':NOTICE,'sha256':hashlib.sha256(body).hexdigest(),
            'checkedAt':now.date().isoformat(),'noticeDate':'2026-01-20','exDate':exdate.isoformat(),'ratio':25,
            'method':'Official exact-share split; comparison quote units only; collected daily prices unchanged'}


def comparison_value(value, target, day, notice, *, rel_tol=1e-7, abs_tol=1e-6):
    if not notice or math.isclose(value,target,rel_tol=rel_tol,abs_tol=abs_tol):
        return value, False
    if day.isoformat()<notice['exDate'] and math.isclose(value/notice['ratio'],target,rel_tol=rel_tol,abs_tol=abs_tol):
        return value/notice['ratio'], True
    return value, False  # Existing disagreement guard must still reject this.
