"""Read explicit diluted averages from issuer EPS notes, never infer shares from EPS."""
import re
from company_extended_publications import value


def schneider_shares(text):
    headings=list(re.finditer(r'Full Year (20\d{2})\s+Full Year (20\d{2})\s*\n\(in thousands of shares and in euros per share\)\s+Basic Diluted Basic Diluted',text))
    if len(headings)!=1:raise ValueError('Missing or ambiguous diluted share columns')
    h=headings[0];years=[int(h[1]),int(h[2])]
    if years[0]!=years[1]+1:raise ValueError('Nonconsecutive share years')
    block=text[h.end():].split('Dividends paid and proposed',1)[0]
    shares=value(block,r'(?:AVERAGE WEIGHTED|WEIGHTED AVERAGE) NUMBER OF SHARES',4)
    issued=value(block,r'Issued shares \(Net of treasury shares\)',4)
    def instruments(label):
        rows=re.findall(r'^'+label+r'\s+-\s+([\d,]+)\s+-\s+([\d,]+)\s*$',block,re.M)
        if len(rows)!=1:raise ValueError('Missing or ambiguous dilution components')
        return [float(v.replace(',','')) for v in rows[0]]
    performance=instruments('Performance shares')
    bonds=instruments('Bonds convertible into shares')
    result={}
    for i,year in enumerate(years):
        basic,diluted=shares[2*i:2*i+2]
        if basic<=0 or diluted<basic or abs(diluted-issued[2*i+1]-performance[i]-bonds[i])>1:
            raise ValueError('Diluted share components do not reconcile')
        result[f'{year}-12-31']=diluted*1000
    return result


def lvmh_shares(text, years):
    from company_publications import numbers
    match=re.findall(r'^Diluted Group share of net earnings per share \(EUR\)[^\n]*\nNumber of shares on which the calculation is based ([^\n]+)',text,re.M)
    if len(match)!=1:raise ValueError('Missing or ambiguous LVMH diluted averages')
    shares=numbers(match[0])
    if len(shares)!=len(years) or any(v<=0 for v in shares):raise ValueError('Invalid LVMH diluted averages')
    return {f'{year}-12-31':v for year,v in zip(years,shares)}


def lvmh_investments(text, years):
    # Use cash paid for fixed assets, before disposal proceeds. The issuer's
    # operating-investment aggregate includes disposals and is not substituted.
    match=re.search(r'Operating investments comprise the following elements for the fiscal years presented:(.*?)(?:15\.4|Interim and final dividends)',text,re.S)
    if not match:raise ValueError('Cash investment note missing')
    block=match[1]
    header=block.split('Purchase of intangible assets',1)[0]
    observed=[int(y) for y in re.findall(r'\b20\d{2}\b',header)]
    if observed!=years:raise ValueError('Cash investment years differ')
    cash=value(block,r'Net cash used in purchases of fixed assets',len(years))
    if any(v>=0 for v in cash):raise ValueError('Unexpected cash investment sign')
    return {f'{year}-12-31':-v*1e6 for year,v in zip(years,cash)}


def lvmh_cash_note(raw):
    import io
    import pdfplumber
    # Search the dedicated financial document's notes, including those beyond
    # the existing 45-page income/cash-table extraction window.
    try:
        document=pdfplumber.open(io.BytesIO(raw))
    except Exception as error:
        raise ValueError('Unreadable cash investment document') from error
    with document as pdf:
        for page in pdf.pages[:100]:
            text=page.extract_text(x_tolerance=1) or ''
            if 'Operating investments comprise the following elements' in text:
                return text
    raise ValueError('Detailed cash investment note not found')
