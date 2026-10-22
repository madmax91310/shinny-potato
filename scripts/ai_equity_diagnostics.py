"""Stable, explicit diagnoses. A provider failure never proves a delisting."""
import re

def category(row):
 s=str(row.get('reason','')).lower();status=row.get('status')
 if status=='qualified':return 'qualified'
 if status=='unprocessed':return 'not-attempted'
 if row.get('permanentExclusion'):return 'outside-investable-scope'
 if 'photographie' in s:return 'stale-identity-evidence'
 if 'ambigu' in s or 'identité de la part' in s or 'preuve d’identité' in s:return 'identity-insufficient'
 if 'aucune cotation' in s:return 'exact-listing-undocumented'
 if '429' in s or 'too many' in s:return 'rate-limit'
 if '403' in s or 'denied' in s or 'forbidden' in s:return 'network-access-blocked'
 if '404' in s:return 'http-404-symbol-unresolved'
 if any(k in s for k in ['timed out','timeout','502','503','504','connection','urlopen']):return 'transport-temporary'
 if 'place retournée' in s or 'place de cotation' in s:return 'provider-venue-mismatch'
 if 'instrument type' in s:return 'provider-security-type-mismatch'
 if 'identity/currency' in s:return 'provider-symbol-currency-interval-mismatch'
 if 'timezone' in s:return 'provider-timezone-mismatch'
 if 'calendrier' in s or 'hors séances' in s:return 'calendar-unsupported-or-conflict'
 if 'change' in s:return 'historical-fx-unavailable'
 if 'moins de 20' in s:return 'history-shorter-than-20-completed-sessions'
 if 'clôtures attendues' in s:return 'expected-provider-session-missing'
 if 'timestamp' in s or 'json' in s or 'response' in s or 'format' in s:return 'empty-or-unexpected-response'
 if 'ancrage' in s:return 'anchor-session-missing'
 if 'dupli' in s:return 'duplicate-or-inconsistent-observations'
 return 'other-explicit-failure'
