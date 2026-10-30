"""Producer input plans, constructed before invoking a collector or reading its output.

IDs use the existing monitoring adapters. Fields describe the native validation unit,
not an assertion that a source checked unrelated fields in the asset catalogue.
"""
import importlib
import importlib.util
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return json.loads((ROOT/name).read_text())


def option(args, flag, default=None, many=False):
    if flag not in args:
        return default
    values=[]
    for value in args[args.index(flag)+1:]:
        if value.startswith('--'):break
        values.extend(value.split())
        if not many:break
    return values if many else (values[0] if values else default)


def output_path(producer, args):
    value=option(args,'--output') or option(args,'--report')
    return Path(value) if value else None


def module_for(name):
    if name in sys.modules:return sys.modules[name]
    return importlib.import_module(name)


def build_plan(producer, args, report_stem=None, module=None):
    stem=report_stem or producer.replace('_','-')
    items=[]
    def add(identifier, instrument=None, fields=None, selected=True, reason=None, **extra):
        items.append({'id':str(identifier),'instrument':str(instrument or identifier),'fields':fields or ['native validated observation'],
                      'selected':bool(selected),**({'reason':reason}if reason else{}),**extra})
    def cfg(name,key='instruments'):return read('scripts/'+name+'.json')[key]
    def mod():return module or module_for(producer)
    only=option(args,'--only',many=True)
    if producer=='collect_instrument_metadata' and only:
        import re
        only=[piece.upper()for value in only for piece in re.split(r'[,\s]+',value)if piece]
    if producer in {'collect_etf_pilot','collect_amundi_etf','collect_ssga_etf','refresh_additional_etf','collect_exposure_expansion'}:
        file={'collect_etf_pilot':'etf-pilot','collect_amundi_etf':'amundi-etf','collect_ssga_etf':'ssga-etf','refresh_additional_etf':'additional-etf-sources','collect_exposure_expansion':'exposure-etf-expansion'}[producer]
        for c in cfg(file):
            enabled=c.get('enabled',True);selected=enabled and (not only or c['isin']in only)
            add('etf-'+stem+'-'+c['isin'],c['isin'],['issuer share observation','individual collectionErrors','unavailable/retained fields'],selected,'Excluded by explicit selection or disabled configuration' if not selected else None)
    elif producer=='collect_presentation_performance':
        for c in mod().SOURCES:add('etf-'+stem+'-'+c['isin'],c['isin'],['exact-share published cumulative performance <= 1 year','currency','reinvestment convention'])
    elif producer in {'refresh_index_sources','refresh_index_companies'}:
        configs=cfg('index-automation','indices') if producer=='refresh_index_sources' else cfg('index-company-sources','additionalIndices')
        ids=option(args,'--ids',many=True)
        for c in configs:
            selected=c.get('enabled',True) and (not ids or c['id']in ids) and ('--only-derived'not in args or c.get('parser')=='monthly-derived')
            # A derived-only refresh intentionally does not collect composition.
            fields=['returns'] if '--only-derived'in args else (['composition'] if producer=='refresh_index_companies' else ['composition','returns'])
            for f in fields:
                applicable=not(f=='composition'and c.get('collectComposition')is False)
                add('index-'+c['id']+'-'+f,c['id'],[f],selected and applicable,
                    'Non applicable : composition explicitly disabled'if not applicable else 'Outside requested index partition'if not selected else None, **({'phase':'validation','sourceAttempted':False}if c.get('parser')=='monthly-derived'else{}))
    elif producer=='collect_practical_sheets':
        for key in json.loads(mod().CONFIG.read_text()):add('practical:'+key,key,['official document body/hash','editorial review lock'])
    elif producer=='collect_insurance':
        from collect_other_insurance import PRODUCTS
        for key in dict(mod().PRODUCTS,**PRODUCTS):add(key,key,['contract terms validated by adapter','declared euro-fund conditions'])
    elif producer=='collect_scpi':
        from collect_corum import PRODUCTS
        from collect_extended_scpi import PRODUCTS as EXTRA
        from collect_atland_scpi import PRODUCTS as ATLAND
        for key in ['iroko-zen','remake-live',*PRODUCTS,*EXTRA,*ATLAND]:add(key,key,['SCPI bulletin','subscription/withdrawal price','distribution','publication state'])
        add('iroko-zen:snapshot','iroko-zen',['quarterly portfolio snapshot'],dependsOn='iroko-zen')
    elif producer=='collect_presentation_actors':
        for key in mod().SOURCES:add(key,key,['current actor conditions/activity','official source identity'])
    elif producer=='collect_regulatory_data':
        for key in mod().SOURCES:add(stem+':'+key,key,['official regulatory parameters'])
    elif producer=='collect_broker_tariffs':
        m=mod()
        for key in m.SOURCES:add(stem+':'+key,key,['broker tariff fields'])
        for key in ['bourso:extras','fortuneo:extras',*m.SUPPLEMENT_SOURCES]:add(stem+':'+key,key,['supplementary tariff/document conditions'])
        from broker_profiles import SOURCES
        # Profile fields are configuration-owned, never inferred from the successes.
        from broker_profiles import DOCUMENTS as PROFILES
        for broker,profile in PROFILES.items():
            for field in profile:add(stem+':'+broker+':profile:'+field,broker,['profile:'+field])
    elif producer=='collect_economic_data':
        family=option(args,'--family');m=mod()
        for key in m.SOURCES:add('insee-'+key,key,['INSEE household indicator'],family in(None,'households'),'Outside requested economic family'if family not in(None,'households')else None)
        for key,f in [('livret-a','savings'),('fonds-euros','fonds_euros'),('scpi','scpi')]:add(key,key,[f],family in(None,f),'Outside requested economic family'if family not in(None,f)else None)
    elif producer=='update_inflation':add('inflation:011814631','011814631',['INSEE consumer-price annual rates','source period'])
    elif producer=='update_bitcoin_monthly':add('history:bitcoin-yahoo','BTC-USD',['monthly close','daily month-end crosscheck','USD','unadjusted cryptocurrency price'])
    elif producer=='collect_lifestrategy':
        for _,_,isin in mod().CONFIG:add(isin,isin,['fund characteristics','asset allocation','full holdings','fieldQualification'])
    elif producer=='collect_qualified_exposures':
        for c in cfg('qualified-exposure-sources'):
            selected=not only or c['id']in only
            add(c['isin'],c['isin'],['countries','sectors','holdings','aum','identity'],selected,'Outside qualified-exposure selection'if not selected else None)
    elif producer=='collect_dca_equities':
        for key,isin in read('scripts/dca-equity-identities.json').items():add('dca-equity:'+key,isin,['country of risk','sector'])
    elif producer=='collect_dca_complete_holdings':
        configs={**read('scripts/dca-complete-holdings-sources.json'),**read('scripts/generated-holdings-sources.json')}
        for isin,config in configs.items():
            derived=config.get('parser')=='lifestrategy-lookthrough'
            add('dca-holdings:'+isin,isin,['complete economic holdings','security identities','weights','asOf'],not only or isin in only,'Outside requested holdings selection'if only and isin not in only else None,
                **({'phase':'validation','sourceAttempted':False}if derived else{}))
    elif producer=='collect_vanguard_sleeves':
        for c in mod().SOURCES:add('vanguard-underlier:'+c[1],c[1],['countries','sectors','factsheet/API identity'])
    elif producer=='collect_exposure_sleeves':
        m=mod()
        for isin in m.FUNDS.values():add('exposure-sleeve:'+isin,isin,['economic country/sector classification'])
        for code in m.US_FUNDS:add('exposure-sleeve:'+code,code,['US holdings classification source'])
        for key in ['US8740391003','GB0009895292','IE000UL6CLP7','IE0003R87OG3','IE00BM8R0J59','avantis-AVDV','avantis-AVUV','morningstar-SILV']:add('exposure-sleeve:'+key,key,['economic sleeve classification'])
    elif producer=='refresh_anniversary_levels':
        for c in mod().configurations():add('anniversary-'+c['id'],c.get('isin',c['id']),['dated closing level',c.get('field','close'),c.get('currency','')])
        add('anniversary-or','or',['derived EUR gold level; no new source control'])
    elif producer=='refresh_anniversary_indices':
        for c in mod().configurations():add('anniversary-index-'+c['id'],c['id'],['completed official monthly index levels',c.get('currency','USD')])
    elif producer=='collect_instrument_metadata':
        m=mod();sources=cfg('instrument-metadata-sources');chosen=m.select_sources(sources,only)
        selected={s['isin']for s in chosen}
        for s in sources:
            for field in m.FIELDS:
                for suffix in ['',':qualification']:
                    add(s['isin']+':'+field+suffix,s['isin'],[field],s['isin']in selected,'Outside explicit metadata selection'if s['isin']not in selected else None,**({'phase':'qualification','sourceAttempted':False}if suffix else{}))
    elif producer=='update-investor-13f':
        for entry in [{'slug':slug}for slug in mod().MANAGERS]:add('investor:'+entry['slug'],entry['slug'],['13F last successful check','positions date','report quarter','amendments'])
    elif producer=='refresh_non_bond_sources':
        fields=option(args,'--fields',['etf','monthly','levels'],many=True)
        for c in cfg('non-bond-expansion-sources'):add('funds:etf-issuer-'+c['isin'],c['isin'],['fund observations'], 'etf'in fields,'ETF partition not requested'if 'etf'not in fields else None)
        for c in cfg('non-bond-qualified-sources'):add('qualified:'+c['id'],c['isin'],['qualified exposures'],'etf'in fields,'ETF partition not requested'if 'etf'not in fields else None)
        for c in cfg('non-bond-monthly-sources','series'):
            add('monthly:'+c['id'],c.get('isin',c['id']),['monthly history',c.get('field','')], 'monthly'in fields,'Monthly partition not requested'if 'monthly'not in fields else None)
            add('levels:anniversary-'+c['id'],c.get('isin',c['id']),['dated close'], 'levels'in fields,'Levels partition not requested'if 'levels'not in fields else None)
    elif producer=='qualify_monthly_candidates':
        candidate_path=option(args,'--candidates');candidates=json.loads(Path(candidate_path).read_text())
        status=read('scripts/source-snapshots/monthly-qualification-status.json')
        ordered=sorted(candidates,key=lambda c:(status.get(c['isin'],{}).get('checkedAt',''),c['isin']))
        limit=int(option(args,'--limit','12'));selected=set(list(dict.fromkeys(c['isin']for c in ordered))[:limit])
        for c in candidates:add('candidate:'+c['isin']+':'+c['symbol'],c['isin'],['exact listing identity',c['symbol'],'monthly/daily history qualification'],c['isin']in selected,'Deferred by exact-instrument quota'if c['isin']not in selected else None)
    else:raise ValueError('Producer has no input plan: '+producer)
    if not items and producer!='qualify_monthly_candidates':
        raise ValueError('Périmètre attendu anomalement vide : '+producer+' ; configuration requise absente, aucune collecte certifiée')
    identifiers=[r['id']for r in items]
    if len(set(identifiers))!=len(identifiers):raise ValueError('Duplicate predeclared producer identity: '+producer)
    if only:
        selectable={r['instrument']for r in items}|{r['id']for r in items}
        if producer=='collect_qualified_exposures':selectable|={c['id']for c in cfg('qualified-exposure-sources')}
        if set(only)-selectable:raise ValueError('Unknown producer target: '+','.join(set(only)-selectable))
    return {'items':items,'mode':'targeted'if only or any(flag in args for flag in ('--ids','--only-derived','--family','--fields','--limit'))else'full',
            'selectionReason':'Parsed CLI selection and producer input configuration, before collection',
            'emptyReason':'No configured applicable instruments'if not items else None,
            'cacheRequested': '--cache'in args}
