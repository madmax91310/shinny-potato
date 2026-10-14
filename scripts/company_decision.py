"""Optional decision inputs, aligned to already validated consolidated accounts.

Ratios are computed by the application. Missing fields stay missing; an access
failure never recertifies an old observation. No estimates or adjusted FCF.
"""
import datetime as dt
import math

DECISION_VERSION = 3

FCF_METHOD = 'Flux d’exploitation moins achats d’immobilisations ; locations et acquisitions d’entreprises non déduites'


def sec_decision(body, profile, company, today):
    from refresh_company_analysis import fact_rows, aligned, REVENUE
    if str(body.get('cik', '')).zfill(10) != profile['cik'] or profile['currency'] != 'USD':
        raise ValueError('Wrong decision account identity/currency')
    source = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{profile['cik']}.json"
    def annual(tags, unit='USD'):
        # Alternative taxonomy concepts may have distinct scopes. Do not merge
        # e.g. interest on debt with a broader total interest-expense series.
        fallback = []
        for tag in tags:
            rows = fact_rows(body, [tag], unit, '10-K', 330, 400, today)
            if any(r['end'] == company['annual']['end'] for r in rows):
                return rows
            if rows and not fallback:
                fallback = rows
        return fallback
    revenues = annual(REVENUE)
    incomes = annual(['NetIncomeLoss', 'NetIncomeLossAvailableToCommonStockholdersBasic', 'ProfitLoss'])
    fields = {
        'operatingCashFlow': annual(['NetCashProvidedByUsedInOperatingActivities']),
        'capitalExpenditure': annual(['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets']),
        'operatingIncome': annual(['OperatingIncomeLoss']),
        'shareBasedCompensation': annual(['ShareBasedCompensation']),
        'shareRepurchases': annual(['PaymentsForRepurchaseOfCommonStock']),
        # Never use net interest income/expense as a debt-servicing denominator.
        'interestExpense': annual(['InterestExpenseNonOperating', 'InterestAndDebtExpense', 'InterestExpense']),
        'dividendsPaid': annual(['PaymentsOfDividendsCommonStock', 'PaymentsOfDividends']),
        'averageDilutedShares': annual(['WeightedAverageNumberOfDilutedSharesOutstanding'], 'shares'),
    }
    intangible = annual(['PaymentsToAcquireIntangibleAssets']) if profile['id'] == 'nvidia' else []
    references = company.get('history', {}).get('years', []) or [company['annual']]
    years = []
    for reference in references:
        candidates = [r for r in revenues if r['end'] == reference['end'] and r['val'] == reference['revenue']]
        candidates = [r for r in candidates if (aligned(incomes, r) or {}).get('val') == reference['netIncome']]
        if len(candidates) != 1:
            continue
        period = candidates[0]
        result = {k: reference[k] for k in ('end', 'revenue', 'netIncome')}
        result.update(start=period['start'], sourceUrl=source, tags={})
        for field, rows in fields.items():
            found = aligned(rows, period)
            if found and (field in ('operatingCashFlow', 'operatingIncome') or found['val'] >= 0):
                result[field] = found['val']
                result['tags'][field] = found['tag']
                if field == 'averageDilutedShares':
                    result['sharesBasisSource'] = source + '#' + found['filed']
        if 'operatingCashFlow' in result and 'capitalExpenditure' in result and profile['id'] != 'amd':
            # Nvidia's issuer definition includes purchased intangible assets.
            extra = aligned(intangible, period) if intangible else None
            if profile['id'] != 'nvidia' or extra is not None:
                if extra:
                    if extra['val'] < 0:
                        raise ValueError('Negative intangible investment')
                    result['capitalExpenditure'] += extra['val']
                    result['tags']['capitalExpenditure'] = [result['tags']['capitalExpenditure'], extra['tag']]
                result['freeCashFlow'] = result['operatingCashFlow'] - result['capitalExpenditure']
                result['freeCashFlowDefinition'] = FCF_METHOD + (' ; actifs incorporels inclus' if extra else '')
        # Published FCF remains authoritative when its scope differs from SEC.
        if reference['end'] == company['annual']['end'] and 'freeCashFlow' in company['annual']:
            published = company['annual']['freeCashFlow']
            if 'freeCashFlow' in result and abs(result['freeCashFlow'] - published) > 1:
                for key in ('operatingCashFlow', 'capitalExpenditure', 'freeCashFlow', 'freeCashFlowDefinition'):
                    result.pop(key, None)
        years.append(result)
    if not years or years[-1]['end'] != company['annual']['end']:
        raise ValueError('Decision accounts do not match current annual accounts')
    block = {'observedAt': today.isoformat(), 'annualEnd': company['annual']['end'],
             'years': years, 'sourceUrl': source, 'method': FCF_METHOD, 'componentVersion': DECISION_VERSION}
    from refresh_company_analysis import parse_accounts
    try:
        accounts = parse_accounts(body, profile, today)
        current = accounts.get('quarter') or accounts['annual']
        expected = company.get('quarter') or company['annual']
        if all(current[k] == expected[k] for k in ('end','revenue','netIncome')):
            for key in ('balance','shares'):
                if key in accounts and profile['id'] not in ('alphabet','visa','meta'):
                    block[key] = {**accounts[key], 'observedAt': today.isoformat(), 'sourceUrl': source}
    except ValueError:
        pass
    return block


def publication_decision(profile, company, today):
    """Re-read issuer annual documents; the five initial adapters check columns."""
    from company_publications import get, add_cash_flow, collect_history, row
    if profile['id'] in ('lvmh', 'air-liquide', 'schneider', 'totalenergies', 'visa', 'costco'):
        return extended_publication_decision(profile, company, today)
    if profile['id'] == 'amd':
        return amd_publication_decision(profile, company, today)
    from company_round4_publications import ROUND4
    if profile['id'] in ROUND4:
        from company_round4_publications import publication_decision as fourth_round
        return fourth_round(profile, company, today)
    from company_round3_publications import ROUND3
    if profile['id'] in ROUND3:
        from company_round3_publications import publication_decision as third_round
        return third_round(profile,company,today)
    from company_round2_publications import ROUND2
    if profile['id'] in ROUND2:
        return round2_publication_decision(profile, company, today)
    if profile['id'] not in ('apple', 'microsoft', 'nvidia', 'alphabet', 'amazon', 'meta'):
        raise NotImplementedError('No qualified issuer cash-flow adapter')
    years = []
    references = collect_history(profile, today)
    expected = {r['end']: r for r in company.get('history', {}).get('years', []) or [company['annual']]}
    for reference in references:
        if reference['end'] not in expected or any(reference[k] != expected[reference['end']][k] for k in ('revenue', 'netIncome')):
            continue
        result = {k: reference[k] for k in ('end', 'revenue', 'netIncome')}
        result.update(sourceUrl=reference['sourceUrl'], tags={})
        # The URL in a comparative row may describe the following exercise.
        from company_publications import statement
        raw = get(reference['sourceUrl'])
        parsed, income_text = statement(raw, profile['id'])
        annual = parsed['annual']
        if annual is None:
            raise ValueError('Not an issuer annual document')
        add_cash_flow(raw, annual, profile['id'])
        previous = reference['end'] == annual['previousEnd']
        if reference['end'] != annual['end'] and not previous:
            raise ValueError('Unknown issuer historical period')
        prefix = 'previous' if previous else ''
        def key(field):
            return prefix + field[0].upper() + field[1:] if prefix else field
        if any(annual[key(k)] != reference[k] for k in ('revenue', 'netIncome')):
            raise ValueError('Issuer decision income mismatch')
        for field in ('freeCashFlow', 'operatingCashFlow', 'capitalExpenditure', 'dividendsPaid', 'shareRepurchases', 'shareBasedCompensation', 'operatingIncome'):
            if key(field) in annual:
                result[field] = annual[key(field)]
        if 'freeCashFlow' in result:
            result['freeCashFlowDefinition'] = annual.get('freeCashFlowDefinition', FCF_METHOD)
        import re
        # Distinguish dollar EPS from the separate count row, with issuer units.
        counts = [line for line in income_text.splitlines() if re.match(r'^\s*Diluted\s', line, re.I) and '$' not in line]
        valid = [row(line, [r'Diluted'], 4) for line in counts]
        valid = [values for values in valid if values and min(values) > 100]
        if len(valid) == 1 and profile['id'] not in ('alphabet', 'meta'):
            i = 3 if profile['id'] == 'amazon' else 2
            j = 2 if i == 3 else 3
            result['averageDilutedShares'] = valid[0][j if previous else i] * (1000 if profile['id']=='apple' else 1e6)
            result['sharesBasisSource'] = reference['sourceUrl']
        years.append(result)
    if not any('freeCashFlow' in y for y in years):
        raise ValueError('No qualified issuer cash flow')
    return {'observedAt': today.isoformat(), 'annualEnd': company['annual']['end'],
            'years': years, 'method': FCF_METHOD, 'componentVersion': DECISION_VERSION}


def amd_publication_decision(profile, company, today):
    from company_amd_publications import parse, MONTHS
    from company_publications import get, row
    from bs4 import BeautifulSoup
    import re
    documents={};years=[]
    for reference in reversed(company.get('history',{}).get('years',[]) or [company['annual']]):
        url=reference['sourceUrl']
        if url not in documents:
            try:
                raw=get(url);annual=parse(raw,url,today)['annual']
                if annual is None:continue
                soup=BeautifulSoup(raw,'html.parser');cash=[]
                for table in soup.find_all('table'):
                    heading=table.find_previous(['p','h3','h4'])
                    title=heading.get_text(' ',strip=True)if heading else ''
                    if not re.search(r'ADVANCED MICRO DEVICES, INC\.\s+(?:CONDENSED )?CONSOLIDATED STATEMENTS OF CASH FLOWS',title,re.I):continue
                    if not re.search(r'\bmillions\b',title,re.I):raise ValueError('Unknown AMD cash-flow units')
                    lines=[' '.join(cell.get_text(' ',strip=True)for cell in tr.find_all(['td','th'],recursive=False))for tr in table.find_all('tr')if tr.find_parent('table')is table]
                    text='\n'.join(lines).replace('—','0')
                    header=text.split('Cash flows from operating activities:',1)[0]
                    dates=[dt.date(int(y),MONTHS[m.lower()],int(day)).isoformat()for m,day,y in re.findall(r'\b('+'|'.join(MONTHS)+r')\s+(\d{1,2}),\s*(20\d{2})',header,re.I)]
                    if len(dates)!=4 or dates!=[annual['end'],annual['previousEnd'],annual['end'],annual['previousEnd']]or not re.search(r'Year Ended',header,re.I):continue
                    ocf=row(text,[r'Net cash provided by operations',r'Net cash provided by operating activities',r'Net cash provided by \(used in\) operating activities'],4)
                    capex_rows=re.findall(r'^\s*Purchases of property and equipment\s+([^\n]+)$',text,re.I|re.M)
                    from company_publications import numbers
                    capex=[numbers(line)for line in capex_rows]
                    if not ocf or len(capex)not in(1,2)or any(len(values)!=4 for values in capex):continue
                    cash.append((ocf,[sum(abs(values[i])for values in capex)for i in range(4)]))
                if len(cash)!=1:raise ValueError('No unambiguous consolidated AMD annual cash flows: '+url)
                ocf,capex=cash[0]
                for i,prefix in ((2,''),(3,'previous')):
                    for k,v in [('operatingCashFlow',ocf[i]*1e6),('capitalExpenditure',capex[i]*1e6),('freeCashFlow',(ocf[i]-capex[i])*1e6)]:annual[prefix+k[0].upper()+k[1:]if prefix else k]=v
                documents[url]=annual
            except (ValueError, OSError):
                documents[url] = None
                continue
        if documents[url] is None:continue
        annual=documents[url];previous=reference['end']==annual['previousEnd'];prefix='previous'if previous else ''
        def key(k):return prefix+k[0].upper()+k[1:]if prefix else k
        if reference['end']not in(annual['end'],annual['previousEnd'])or any(reference[k]!=annual[key(k)]for k in('revenue','netIncome')):continue
        result={k:reference[k]for k in('end','revenue','netIncome')}
        result.update(sourceUrl=url,tags={},freeCashFlowDefinition=FCF_METHOD+' ; activités poursuivies et abandonnées incluses')
        for k in('operatingCashFlow','capitalExpenditure','freeCashFlow'):result[k]=annual[key(k)]
        years.append(result)
    years.sort(key=lambda r:r['end'])
    if not years or years[-1]['end']!=company['annual']['end']:raise ValueError('AMD cash-flow history mismatch')
    return {'observedAt':today.isoformat(),'annualEnd':company['annual']['end'],'years':years,'method':FCF_METHOD}


def round2_publication_decision(profile, company, today):
    from company_round2_publications import parse
    from company_publications import get, sections, row
    import re
    documents = {}
    references = company.get('history', {}).get('years', []) or [company['annual']]
    years = []
    for reference in references:
        url = reference['sourceUrl']
        if url not in documents:
            raw = get(url)
            annuals = [p for p in parse(raw, profile['id'], url, today) if p['durationMonths'] == 12]
            if len(annuals) != 1: continue
            a = annuals[0]
            # Look only in a consolidated annual cash-flow statement. Some
            # releases publish quarterly cash flow only; those are omitted.
            candidates = []
            cash_sections = sections(raw)
            if raw.startswith(b'%PDF'):
                full = '\n'.join(cash_sections)
                heading = re.search(r'^\s*(?:Condensed )?Consolidated Statements? of Cash Flows[^\n]*$', full, re.I|re.M)
                if heading:
                    block = full[heading.start():]
                    limit = re.search(r'^\s*(?:Condensed )?Consolidated (?:Balance|Statements? of (?!Cash))', block[heading.end()-heading.start():], re.I|re.M)
                    if limit: block = block[:heading.end()-heading.start()+limit.start()]
                    # Never include later non-GAAP reconciliations or segment tables.
                    close = re.search(r'^.*(?:cash.*\bend\b.*|of period).*?(?:\$\s*)?[\d,]+(?:\s+\$?\s*[\d,]+)+\s*$', block, re.I|re.M)
                    if close: block = block[:close.end()]
                    cash_sections = [block]
            if not raw.startswith(b'%PDF'):
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(raw, 'html.parser')
                cash_sections = []
                for table in soup.find_all('table'):
                    caption = table.find_previous(string=re.compile(r'CONSOLIDATED (?:STATEMENTS?|BALANCE)',re.I))
                    if not caption or not re.search(r'CONSOLIDATED STATEMENTS? OF CASH FLOWS',str(caption),re.I):continue
                    heading = caption.parent.get_text(' ',strip=True)
                    lines = [' '.join(cell.get_text(' ',strip=True)for cell in tr.find_all(['td','th'],recursive=False))for tr in table.find_all('tr')if tr.find_parent('table')is table]
                    text='\n'.join(lines)
                    cash_sections.append((heading if len(heading)<400 else str(caption))+'\n'+text)
            for text in cash_sections:
                if not re.search(r'CONSOLIDATED STATEMENTS? OF CASH FLOWS', text, re.I): continue
                text = re.sub(r'\.{2,}', ' ', text)
                header = re.split(r'(?im)^\s*(?:Cash flows from operating|OPERATING ACTIVITIES|Net income)', text, 1)[0]
                if not re.search(r'(?:years?|twelve months|52 weeks|53 weeks) ended', header, re.I): continue
                header_years = [int(y) for y in re.findall(r'\b20\d{2}\b', header)]
                expected = [int(a['end'][:4]), int(a['previousEnd'][:4])]
                if header_years == expected: indices=(0,1)
                elif header_years == expected*2: indices=(2,3)
                elif len(header_years)==3 and header_years[:2]==expected: indices=(0,1)
                else: continue
                n=len(header_years)
                if not re.search(r'in millions', header, re.I): continue
                ocf = row(text, [r'Net cash provided by operating activities', r'Net cash provided by \(used in\) operating activities'], n)
                capex = row(text, [r'Purchases of property and equipment', r'Capital expenditures', r'Capital spending', r'Purchases of property, plant and equipment'], n)
                dividends = row(text, [r'Payments of dividends', r'Payments of dividends and dividend equivalents', r'Dividends paid', r'Cash dividends paid'], n)
                if ocf and capex and len(ocf)==len(capex)==n:
                    extras={}
                    for field, labels in [('shareRepurchases',[r'Repurchases of common stock',r'Purchases of treasury stock',r'Share repurchases']),('shareBasedCompensation',[r'Share-based compensation(?: expense)?',r'Stock-based compensation(?: expense)?'])]:
                        try: vals=row(text,labels,n)
                        except ValueError: continue
                        if vals and len(vals)==n:extras[field]=vals
                    candidates.append((ocf,capex,dividends if dividends and len(dividends)==n else None,extras,indices))
            if len(candidates)==1:
                ocf,capex,dividends,extras,indices=candidates[0]
                for index,prefix in ((indices[0],''),(indices[1],'previous')):
                    for field,val in [('operatingCashFlow',ocf[index]*1e6),('capitalExpenditure',abs(capex[index])*1e6),('freeCashFlow',(ocf[index]-abs(capex[index]))*1e6)]:
                        a[prefix+field[0].upper()+field[1:] if prefix else field]=val
                    if dividends:a[prefix+'DividendsPaid' if prefix else 'dividendsPaid']=abs(dividends[index])*1e6
                    for field,vals in extras.items():
                        a[prefix+field[0].upper()+field[1:]if prefix else field]=abs(vals[index])*1e6
            documents[url]=a
        a=documents[url]
        previous=reference['end']==a['previousEnd']
        if reference['end']!=a['end'] and not previous:continue
        prefix='previous' if previous else ''
        def key(k):return prefix+k[0].upper()+k[1:] if prefix else k
        if any(reference[k]!=a[key(k)] for k in ('revenue','netIncome')):continue
        result={k:reference[k]for k in ('end','revenue','netIncome')}
        result.update(sourceUrl=url,tags={})
        for k in ('operatingIncome','interestExpense','averageDilutedShares','operatingCashFlow','capitalExpenditure','freeCashFlow','dividendsPaid','shareRepurchases','shareBasedCompensation'):
            if key(k)in a:result[k]=a[key(k)]
        if 'averageDilutedShares'in result:result['sharesBasisSource']=url
        if 'freeCashFlow'in result:result['freeCashFlowDefinition']=FCF_METHOD
        years.append(result)
    if not years or years[-1]['end']!=company['annual']['end'] or not any(any(k in y for k in ('interestExpense','freeCashFlow','averageDilutedShares'))for y in years):
        raise ValueError('No qualified optional annual issuer components')
    return {'observedAt':today.isoformat(),'annualEnd':company['annual']['end'],'years':years,'method':FCF_METHOD}


def extended_publication_decision(profile, company, today):
    from company_extended_publications import load, pdf_text, parse_europe, parse_us, value
    from company_publications import sections
    import re
    ident = profile['id']
    references = company.get('history', {}).get('years', []) or [company['annual']]
    documents = {}
    for reference in reversed(references):
        url = reference['sourceUrl']
        if url in documents:
            continue
        try:
            raw = load(url)
            text = pdf_text(raw) if raw.startswith(b'%PDF') else '\n'.join(sections(raw))
            if ident in ('visa', 'costco'):
                parsed = parse_us(raw, ident)['annual']
                if parsed is None:
                    raise ValueError('No annual US issuer statement')
                periods = [parsed, {'end': parsed['previousEnd'], 'revenue': parsed['previousRevenue'], 'netIncome': parsed['previousNetIncome']}]
            else:
                periods = None
                for year in range(int(reference['end'][:4]), int(reference['end'][:4])+3):
                    try:
                        periods = parse_europe(text, ident, year)
                        break
                    except ValueError:
                        pass
                if periods is None:
                    raise ValueError('Unknown annual income columns')
            # Only captions of consolidated cash-flow statements are accepted.
            headings = list(re.finditer(r'^\s*(?:(?:\d+\.\s*)?Consolidated (?:statement of cash flows?|cash flow statement)|Visa Consolidated Statements of Cash Flows[^\n]*|COSTCO WHOLESALE CORPORATION CONDENSED CONSOLIDATED STATEMENTS OF CASH FLOWS[^\n]*|CONSOLIDATED STATEMENT OF CASH FLOW)\s*$', text, re.I | re.M))
            blocks = []
            for heading in headings:
                block = text[heading.end():]
                limit = re.search(r'^\s*(?:TOTAL TAX PAID|The accompanying notes|Effect of exchange rate changes|Effect of exchange rates|Net increase\s*\(|Net change|CASH AND CASH EQUIVALENTS AT END|NET CASH AND CASH EQUIVALENTS, END|\d+\s+Schneider Electric|NOTES TO|Alternative performance measure)\b', block, re.I | re.M)
                if limit: block = block[:limit.start()]
                if ident == 'totalenergies' and not re.search(r'\bYear\b', block[:220], re.I): continue
                # Keep only a cash-flow header with the exact annual columns.
                header = re.split(r'(?im)^\s*(?:I\. OPERATING|Operating [Aa]ctivities|CASH FLOW|Profit for the year|Net income|Consolidated net income)', block, 1)[0]
                years = [int(y) for y in re.findall(r'\b20\d{2}\b', header)]
                if not years and ident == 'air-liquide':
                    continue
                if len(years) != len(periods) or len(set(years)) != len(years): continue
                if set(years) != {int(p['end'][:4]) for p in periods}: continue
                if ident != 'totalenergies' and not re.search(r'millions', heading.group() + header, re.I): continue
                if ident == 'totalenergies' and '(M$)' not in header: continue
                blocks.append((block, years))
            if not blocks:
                raise ValueError('No qualified annual consolidated cash-flow table for ' + ident)
            # Duplicate captions can point at the same table; require equal values.
            extracted = []
            for block, years in blocks:
                n = len(years)
                labels = {
                    'lvmh': (r'Net cash from/\(used in\) operating activities', None, None),
                    'air-liquide': (r'Net cash flows from operating activities', r'Purchase of property, plant and equipment and intangible assets', r'• L.Air Liquide S.A.'),
                    'schneider': (r'TOTAL I - CASH FLOWS FROM / \(USED IN\) OPERATING ACTIVITIES', r'Purchases of property, plant and equipment', r'Dividends paid to Schneider Electric.s shareholders'),
                    'totalenergies': (r'Cash flow from operating activities', r'Intangible assets and property, plant and equipment additions', r'- Parent company shareholders'),
                    'visa': (r'Net cash provided by \(used in\) operating activities', r'Purchases of property, equipment and technology', r'Dividends paid'),
                    'costco': (r'Net cash provided by operating activities', r'Additions to property and equipment', r'Cash dividend payments'),
                }[ident]
                ocf = value(block, labels[0], n, notes=True)
                capex = value(block, labels[1], n, notes=True) if labels[1] else None
                if ident == 'schneider':
                    extra = value(block, r'Purchases of intangible assets', n, notes=True)
                    capex = [abs(a) + abs(b) for a, b in zip(capex, extra)]
                # TotalEnergies repeats parent shareholders for issuance and dividends.
                dividend_block = block.split('Dividends paid:', 1)[1] if ident == 'totalenergies' else block
                dividends = value(dividend_block, labels[2], n, notes=True, optional=True) if labels[2] else None
                rows = {}
                for p in periods:
                    i = years.index(int(p['end'][:4]))
                    r = {k: p[k] for k in ('end', 'revenue', 'netIncome')}
                    r.update(sourceUrl=url, operatingCashFlow=ocf[i]*1e6, tags={'operatingCashFlow': labels[0]})
                    if capex:
                        r.update(capitalExpenditure=abs(capex[i])*1e6, freeCashFlow=(ocf[i]-abs(capex[i]))*1e6,
                                 freeCashFlowDefinition=FCF_METHOD + (' ; actifs incorporels inclus' if ident in ('air-liquide','schneider','totalenergies','visa') else ''))
                    if dividends: r['dividendsPaid'] = abs(dividends[i])*1e6
                    # Only standalone interest expense, never net finance costs.
                    if ident == 'schneider':
                        income = re.split(r'Other comprehensive income', text, 1)[0]
                        interest = value(income, r'Interest expense', n, optional=True)
                        if interest: r['interestExpense'] = abs(interest[i])*1e6
                        if p.get('operatingIncome') is not None: r['operatingIncome'] = p['operatingIncome']
                    rows[r['end']] = r
                extracted.append(rows)
            if any(r != extracted[0] for r in extracted[1:]):
                raise ValueError('Conflicting issuer cash tables')
            documents[url] = extracted[0]
        except (ValueError, OSError):
            continue
    rows = []
    for ref in references:
        found = next((doc[ref['end']] for doc in documents.values() if ref['end'] in doc), None)
        if found and all(found[k] == ref[k] for k in ('revenue','netIncome')): rows.append(found)
    if not rows or rows[-1]['end'] != company['annual']['end']:
        raise ValueError('Issuer decision history mismatch')
    return {'observedAt': today.isoformat(), 'annualEnd': company['annual']['end'], 'years': rows, 'method': FCF_METHOD, 'componentVersion': DECISION_VERSION}


def validate_decision(block, company, today):
    if block['annualEnd'] != company['annual']['end'] or block['years'][-1]['end'] != block['annualEnd']:
        raise ValueError('Decision period mismatch')
    for row in block['years']:
        if dt.date.fromisoformat(row['end']) > today or not row['sourceUrl'].startswith('https://'):
            raise ValueError('Invalid decision provenance')
        if any(not math.isfinite(v) or isinstance(v, bool) for v in row.values() if isinstance(v, (int, float))):
            raise ValueError('Invalid decision number')
        if any(row.get(k, 0) < 0 for k in ('capitalExpenditure','interestExpense','dividendsPaid','averageDilutedShares','shareRepurchases','shareBasedCompensation','currentAssets','currentLiabilities')):
            raise ValueError('Negative unsigned decision component')
        if 'freeCashFlow' in row and abs(row['freeCashFlow'] - (row['operatingCashFlow'] - row['capitalExpenditure'])) > 1:
            raise ValueError('FCF does not reconcile')
    return block
