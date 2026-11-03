"""Exact Federal Reserve H.10 daily TWD/USD, the primary source of FRED DEXTAUS."""
import csv
import datetime as dt
import io
import math
import zipfile
import xml.etree.ElementTree as ET
from urllib.parse import urlencode

DISCOVERY = 'https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H10'
PACKAGE = '60f32914ab61dfab590e0e470153e3ae'
SERIES = 'H10/H10/RXI_N.B.TA'
XML_SOURCE = 'https://www.federalreserve.gov/releases/h10/data/FRB_h10_xml.zip'


def parse_xml_zip(body, now):
    """Official complete H.10 release, linked from the country history page.

    The release announces DDP retirement. This is the same RXI_N.B.TA
    business-day buying-rate series, not a replacement spot quote.
    """
    with zipfile.ZipFile(io.BytesIO(body)) as archive:
        names = archive.namelist()
        if names.count('H10_data.xml') != 1 or any(i.file_size > 40_000_000 for i in archive.infolist()):
            raise ValueError('Unexpected H.10 XML release archive')
        raw = archive.read('H10_data.xml')
    root = ET.fromstring(raw)
    message = '{http://www.SDMX.org/resources/SDMXML/schemas/v1_0/message}'
    common = '{http://www.federalreserve.gov/structure/compact/common}'
    structure = '{http://www.federalreserve.gov/structure/compact/H10_H10}'
    header = root.find(message+'Header')
    if root.tag != message+'MessageGroup' or header is None or header.findtext(message+'ID') != 'H10' or header.findtext(message+'Test') != 'false':
        raise ValueError('Wrong H.10 XML release identity')
    sender = header.find(message+'Sender')
    if sender is None or sender.get('id') != 'FRB':
        raise ValueError('Wrong H.10 XML release sender')
    prepared = dt.datetime.fromisoformat(header.findtext(message+'Prepared') or '')
    if prepared.date() > now.date():
        raise ValueError('Future H.10 XML release')
    candidates = [e for e in root.iter(structure+'Series') if e.get('SERIES_NAME') == 'RXI_N.B.TA']
    if len(candidates) != 1:
        raise ValueError('Missing or ambiguous H.10 TWD XML series')
    series = candidates[0]
    # FREQ=9 is Business day in the official H10_struct.xml codelist.
    identity = {'CURRENCY':'TWD','FREQ':'9','FX':'TWD','SERIES_NAME':'RXI_N.B.TA','UNIT':'Currency','UNIT_MULT':'1'}
    if series.attrib != identity:
        raise ValueError('Wrong H.10 XML TWD currency, frequency or unit')
    values = {}; seen = set()
    for row in series.findall(common+'Obs'):
        day = dt.date.fromisoformat(row.attrib['TIME_PERIOD'])
        if day in seen or day > now.date():
            raise ValueError('Duplicate or future H.10 XML date')
        seen.add(day)
        status, value = row.get('OBS_STATUS'), row.get('OBS_VALUE')
        if status == 'ND' and value in ('-9999',''):
            continue
        if status != 'A':
            raise ValueError('Unqualified H.10 XML observation status')
        rate = float(value)
        if not math.isfinite(rate) or not 0 < rate < 1000:
            raise ValueError('Invalid H.10 XML TWD rate')
        values[day] = rate
    if not values:
        raise ValueError('Empty H.10 XML TWD history')
    return values


def source_url(now):
    # Daily-rates package linked in the official Data Download Program.
    return 'https://www.federalreserve.gov/datadownload/Output.aspx?' + urlencode({
        'rel':'H10','series':PACKAGE,'lastobs':'','from':'01/01/1999',
        'to':now.strftime('%m/%d/%Y'),'filetype':'csv','label':'include',
        'layout':'seriescolumn','type':'package'})


def parse(body, now):
    if body.startswith(b'PK\x03\x04'):
        return parse_xml_zip(body, now)
    rows=list(csv.reader(io.StringIO(body.decode('utf-8-sig'))))
    if len(rows)<8 or [r[0].strip() for r in rows[:6]] != [
            'Series Description','Unit:','Multiplier:','Currency:','Unique Identifier:','Time Period']:
        raise ValueError('Wrong H.10 daily-rates export')
    if len({len(r) for r in rows}) != 1 or rows[4].count(SERIES)!=1:
        raise ValueError('Truncated or ambiguous H.10 series')
    col=rows[4].index(SERIES)
    if [rows[i][col] for i in range(6)] != [
            'Taiwanese N.T. Dollar','Currency','1','TWD',SERIES,'RXI_N.B.TA']:
        raise ValueError('Wrong H.10 TWD currency, multiplier or daily buying-rate identity')
    values={};seen=set()
    for row in rows[6:]:
        day=dt.date.fromisoformat(row[0])
        if day in seen or day>now.date():raise ValueError('Duplicate or future H.10 date')
        seen.add(day)
        if row[col] in ('ND',''):continue
        rate=float(row[col])
        if not math.isfinite(rate) or not 0<rate<1000:raise ValueError('Invalid H.10 TWD rate')
        values[day]=rate
    if not values:raise ValueError('Empty H.10 daily TWD history')
    return values
