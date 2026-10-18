"""Read PEL savings remuneration, never the neighbouring mortgage interest table."""
import calendar
import datetime as dt
import re

MONTHS = dict(zip('janvier février mars avril mai juin juillet août septembre octobre novembre décembre'.split(), range(1,13)))
DATE = r'(\d{1,2})(?:er)? (\w+) (\d{4})'

def date(match):
    day, month, year = match
    return dt.date(int(year), MONTHS[month], int(day)).isoformat()

def parse_generations(root, today, text, unique):
    rows=[]
    for section in root.iter():
        title=section.find('Titre')
        if title is None or text(title) != "Quel est le taux d'intérêt du PEL ?":continue
        for item in section.iter('Item'):
            line=text(item)
            match=re.fullmatch(r'([\d,]+) % pour les PEL ouverts (.+?)[,.]?',line)
            if not match:continue
            dates=re.findall(DATE,match[2]);rate=float(match[1].replace(',','.'))
            if 'à partir du' in match[2] and len(dates)==1:end=None
            elif 'entre le' in match[2] and len(dates)==2:end=date(dates[1])
            else:raise ValueError('PEL generation boundaries missing')
            rows.append({'from':date(dates[0]),'to':end,'rate':rate})
    for table in root.iter('Tableau'):
        title=table.find('TitreRiche')
        if title is None or text(title)!="Taux de rémunération du PEL (hors prime d'État)":continue
        for row in table.findall('Rangée'):
            if row.get('type')!='normal':continue
            cells=row.findall('Cellule');period=text(cells[0]);rate=unique(r'([\d,]+) %',text(cells[1]))
            match=re.fullmatch(r'Entre (\w+) (\d{4}) et (\w+) (\d{4})',period)
            if match:
                start=dt.date(int(match[2]),MONTHS[match[1]],1).isoformat()
                year,month=int(match[4]),MONTHS[match[3]]
                end=dt.date(year,month,calendar.monthrange(year,month)[1]).isoformat()
                # Existing product supports generations since August 2003.
                if start>='2003-08-01':rows.append({'from':start,'to':end,'rate':rate})
            # The 2016-2017 table repeats the longer 2016-2022 interval above.
    rows.sort(key=lambda r:r['from'])
    if not rows or rows[0]['from']!='2003-08-01' or rows[-1]['to'] is not None:raise ValueError('Incomplete PEL savings table')
    for i,row in enumerate(rows):
        if not 0<row['rate']<=20 or row['from']>today:raise ValueError('Invalid/future PEL rate')
        if i and (dt.date.fromisoformat(rows[i-1]['to'])+dt.timedelta(days=1)).isoformat()!=row['from']:raise ValueError('PEL overlap or missing generation')
    return list(reversed(rows))
