"""Keep excluded securities auditable without duplicating unused pricing configuration."""
EXCLUDED_FIELDS={'id','instrumentId','listingId','name','company','companyId','cik','legalCompanyName','companyIdentitySource','shareClass','shareType','isin','ticker','mic','currency','sourceCurrency','country','listingCountry','family','instrumentType','sourceId','directorySources','sourceUrl','sourceAsOf','checkedAt','identitySha256','officialSecurityId','issuerClassificationProof','status','reason','errorCategory','permanentExclusion','lastAttempt','lastSuccess','coverageFrom','coverageThrough','dailySourceUrl'}
def compact_catalogue(rows):
 return [{k:v for k,v in r.items() if k in EXCLUDED_FIELDS} if r.get('permanentExclusion') else dict(r) for r in rows]
