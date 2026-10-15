"""Optional annual risk data. Reconcile the source to retained accounts first.

No balance or missing field is inferred; failed observations keep their dates.
These values do not silently alter the valuation's cash-flow definition.
"""
from company_standard_financials import table
from company_publications import get


def collect_depth(profile, company, today, load=get):
    base=f"https://stockanalysis.com/stocks/{profile['symbol'].lower()}/financials/"
    income, income_date, _=table(load(base+'income-statement/'),profile,today)
    end=company['annual']['end']
    inc=income.get(end)
    if not inc or any(abs(inc.get(label,float('inf'))*1e6-company['annual'][key])>1
                      for key,label in [('revenue','Revenue'),('netIncome','Net Income')]):
        raise ValueError('Risk data income does not reconcile with retained issuer accounts')
    fields={}; dates=[income_date]; hashes={};errors={}
    for kind in ['balance-sheet/','cash-flow-statement/']:
        url=base+kind
        try:
            rows,date,digest=table(load(url),profile,today)
            r=rows.get(end)
            if not r:raise ValueError('Risk data fiscal period missing')
            output={}
            def add(key,value,definition):
                output[key]={'value':value*1e6,'end':end,'sourceUrl':url,'definition':definition}
            if kind=='balance-sheet/':
                for label in ['Total Assets','Total Liabilities',"Shareholders' Equity",'Total Liabilities & Equity']:
                    if label not in r:raise ValueError('Balance equation inputs missing')
                if abs(r['Total Assets']-r['Total Liabilities & Equity'])>2 or abs(r['Total Assets']-r['Total Liabilities']-r["Shareholders' Equity"])>2:
                    raise ValueError('Rounded balance equation does not reconcile')
                for key,label,definition in [('cash','Cash & Equivalents','Trésorerie et équivalents à la clôture annuelle, hors placements'),('debt','Total Debt','Dette totale standardisée à la clôture ; peut inclure les locations, non ajoutées une seconde fois')]:
                    if label in r:
                        if r[label]<0:raise ValueError('Negative unsigned balance')
                        add(key,r[label],definition)
                if 'Current Portion of Leases' in r and 'Long-Term Leases' in r:
                    if min(r['Current Portion of Leases'],r['Long-Term Leases'])<0:raise ValueError('Negative lease liability')
                    add('leaseLiabilities',r['Current Portion of Leases']+r['Long-Term Leases'],'Parts courante et non courante des dettes de location ; indicateur séparé, hors calcul')
            else:
                if abs(r.get('Net Income',float('inf'))*1e6-company['annual']['netIncome'])>1:raise ValueError('Cash-flow income mismatch')
                for key,label,definition in [
                    ('acquisitions','Cash Acquisitions','Flux de trésorerie des acquisitions ; positif = décaissement, négatif = encaissement' ),
                    ('shareBasedCompensation','Stock-Based Compensation','Rémunération en actions publiée, charge non monétaire'),
                    ('shareRepurchases','Repurchase of Common Stock','Décaissements pour rachats d’actions ordinaires'),
                    ('dividendsPaid','Common Dividends Paid','Dividendes ordinaires décaissés')]:
                    if label in r:
                        value=r[label] if key=='shareBasedCompensation' else -r[label]
                        if key!='acquisitions' and value<0:raise ValueError('Unsupported signed cash-flow field')
                        add(key,value,definition)
            fields.update(output);dates.append(date);hashes[kind]=digest
        except (ValueError,OSError,KeyError) as error:
            errors[kind]=str(error)[:250]
    if not fields:raise ValueError('No qualified risk data: '+str(errors))
    return {'version':1,'currency':profile['currency'],'annualEnd':end,'observedAt':today.isoformat(),
            'sourceAsOf':min(dates),'fields':fields,'sourceHashes':hashes,'restrictions':errors}
