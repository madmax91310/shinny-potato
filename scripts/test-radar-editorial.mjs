import assert from 'node:assert/strict'
import { editorialState, etfAnnouncement, groupSignals, factualTitle, recentEditorial, investorFilingType } from '../src/lib/radar-editorial.js'
import { parseLaunchDetails, officialNewsDocument, enrichEtfLaunches, parseVanguardNews, parseGlobalXNews } from './lib/radar-news.mjs'
import { pendingNotifications } from './lib/radar-notifications.mjs'
import { readableSignal } from '../src/pages/editorial-radar/presentation.js'
import { advanceRadar } from './lib/editorial-radar.mjs'
const now = new Date('2026-10-20T12:00:00Z')
const event = { id: 'a', family: 'etf', entity: 'IE0002XZSHO1', label: 'ETF Monde', field: 'ter', fieldLabel: 'Frais annuels', kind: 'change', before: .2, after: .15, beforeText: '0,2 %', afterText: '0,15 %', period: '2026-10-19', detectedAt: now.toISOString() }
assert.equal(editorialState(event), 'ready')
for (const field of ['aum', 'metric:priceEarnings', 'countries:United States', 'sectors:Technology', 'top10']) assert.equal(editorialState({ ...event, field }), 'secondary')
assert.equal(editorialState({ ...event, kind: 'new' }), 'secondary', 'Catalogue discovery is not a launch')
assert.equal(editorialState({ ...event, field: 'pea' }), 'ready')
assert.equal(editorialState({ ...event, status: 'source-conflict' }), 'secondary')
for (const label of ['Vanguard cuts ETF fees', 'ETF dividend announcement', 'Vanguard launches research on ETFs', 'Vanguard may launch an ETF']) assert.equal(etfAnnouncement(label), null)
for (const label of ['Vanguard will launch a UCITS ETF', 'ETF will begin trading tomorrow']) assert.equal(etfAnnouncement(label).stage, 'announced')
assert.equal(etfAnnouncement('Global X launches a UCITS ETF').stage, 'launched')
assert.equal(etfAnnouncement('UCITS ETF begins trading today').stage, 'trading')
const launch = { ...event, field: 'announcement', label: 'Vanguard launches a UCITS ETF', kind: 'new' }
assert.equal(editorialState(launch), 'watch')
assert.equal(editorialState({ ...launch, launchDetails: { isin: event.entity, fees: '0.15 %' } }), 'ready')
assert.equal(editorialState({ ...launch, label: 'Vanguard will launch a UCITS ETF', launchDetails: { isin: event.entity, fees: '0.15 %' } }), 'watch')
const news = { ...event, family: 'pouvoir-achat', kind: 'new', label: 'PTZ : nouveau plafond', summary: 'Plafond applicable de 100 000 euros.', status: 'Application indiquée' }
assert.equal(editorialState(news), 'ready')
assert.equal(editorialState({ ...news, status: 'Annonce' }), 'watch')
assert.equal(editorialState({ ...news, summary: '', label: 'Épargne : une étude publiée' }), 'watch')
const related = { ...event, id: 'b', field: 'pea', before: false, after: true }
const groups = groupSignals([event, related, { ...event, id: 'c', field: 'aum' }, { ...event, id: 'd', period: '2026-10-18' }, { ...event, id: 'e', entity: 'another-share' }])
assert.equal(groups.length, 4, 'Separate products, dates and maturity states stay distinct')
assert.equal(groups.find(group => group.events.length === 2).events.length, 2)
assert.equal(recentEditorial(event, now.getTime()), true)
assert.equal(recentEditorial({ ...event, detectedAt: '2026-09-01' }, now.getTime()), false)
assert.equal(recentEditorial({ ...event, detectedAt: '2026-10-21' }, now.getTime()), false)
assert.match(factualTitle(event), /0,2 % → 0,15 %/)
assert.match(factualTitle(launch), /Lancement déclaré/)
const document = 'ISIN: IE0002XZSHO1\nBenchmark: MSCI World Index\nTotal expense ratio: 0.15%\nDistribution policy: Accumulating\nEligible for PEA\nFirst trading date: 20 October 2026'
assert.deepEqual(parseLaunchDetails(document), { isin: 'IE0002XZSHO1', index: 'MSCI World Index', fees: '0.15%', distribution: 'Capitalisation', pea: 'Éligible, selon le communiqué', tradingDate: '20 October 2026' })
assert.equal(parseLaunchDetails(document.replace('Eligible for PEA', 'Not eligible for PEA')).pea, 'Non éligible, selon le communiqué')
assert.deepEqual(parseLaunchDetails(document + '\nFR001400U5Q4'), {}, 'Do not mix funds in a multi-product document')
assert.equal(parseLaunchDetails(document + '\nTER: 0.20%').fees, undefined)
for (const url of ['http://www.vanguard.co.uk/content/dam/intl/europe/documents/a.pdf', 'https://evil.invalid/a.pdf', 'https://globalxetfs.eu.evil.invalid/doc', 'https://www.vanguard.co.uk@evil.invalid/a.pdf']) assert.equal(officialNewsDocument(url), false)
const html = '<h1>Press releases</h1><nds-base-card><span>19 October 2026</span><h3>Vanguard launches a UCITS ETF</h3><a href="/content/dam/intl/europe/documents/new.pdf">PDF</a></nds-base-card>'
const rows = parseVanguardNews(html, now)
const card = { ':type': 'eds-aem-app/components/card', heading: 'Vanguard launches a UCITS ETF', subtitle: '19 October 2026', link: { href: '/content/dam/intl/europe/documents/new.pdf' } }
const model = { title: 'Press releases', ':path': '/content/uk-aem/gb/en/professional/contact-us/press-releases', ':items': { card } }
const structured = value => `<script id="serverApp-state" type="application/json">${JSON.stringify({ _angular_initial_state: value })}</script>`
assert.equal(parseVanguardNews(structured(model), now)[0].sourceUrl, rows[0].sourceUrl)
assert.throws(() => parseVanguardNews(structured({ ...model, ':path': '/another-page' }), now), /format/)
assert.throws(() => parseVanguardNews(structured({ ...model, ':items': { card: { ...card, link: { href: 'https://evil.invalid/a.pdf' } } } }), now), /officiel/)
const enriched = await enrichEtfLaunches(rows, now, async url => ({ ok: true, url }), async () => document)
assert.equal(enriched.errors.length, 0)
assert.equal(enriched.observations[0].launchDetails.isin, event.entity)
const start = advanceRadar(null, [], { now })
const detected = advanceRadar(start.state, rows, { now })
assert.equal(detected.newEvents.length, 1)
assert.equal(editorialState(detected.newEvents[0]), 'ready')
assert.equal(advanceRadar(detected.state, rows, { now }).newEvents.length, 0, 'No repeated launch on each collection')
const failed = await enrichEtfLaunches(parseVanguardNews(html, now), now, async () => { throw new Error('HTTP 503') })
assert.equal(failed.errors.length, 1)
assert.equal(failed.observations.length, 1, 'The known official announcement survives a document failure')
assert.equal(editorialState({ ...launch, ...failed.observations[0] }), 'watch')
let requested = false
await enrichEtfLaunches(parseVanguardNews(html.replace('19 October', '1 October'), now), now, async () => { requested = true })
assert.equal(requested, true, 'Archives enter the durable queue with their original publication date')
const global = parseGlobalXNews('<div>Recent News</div><a href="https://gxeustrapi.blob.core.windows.net/webpublic/uploads/new.pdf"><li><p>19 Oct 2026</p><h3>Global X launches a UCITS ETF</h3></li></a>', now)
assert.match(global[0].documentUrl, /webpublic\/uploads/)
console.log('Editorial radar: relevance, factual titles, grouping, launch evidence, future announcements, ambiguous multi-fund documents, failure preservation and no duplicate launch verified.')

// Corrections within a quarter are never new trades, including legacy events.
{
  const observation = {family:'investisseurs', entity:'fund-test', label:'Investisseur test', field:'filing', fieldLabel:'Positions et mouvements déclarés', value:{positions:[{ticker:'ABC',changePct:15,isNew:false}],exits:[]}, period:'2026-06-30', checkedAt:now.toISOString(), sourceUrl:'https://www.sec.gov/Archives/test', scope:'13F · hors options', tool:'/portefeuilles-investisseurs', rule:'publication'}
  const initial=advanceRadar(null,[observation],{now})
  const revised={...observation,value:{positions:[{ticker:'ABC',changePct:15,isNew:false},{ticker:'XYZ',changePct:null,isNew:true}],exits:[]}}
  const correction=advanceRadar(initial.state,[revised],{now})
  assert.equal(correction.newEvents.length,1,'Keep the correction in the audit history')
  const event=correction.newEvents[0]
  assert.equal(editorialState(event),'secondary')
  assert.equal(investorFilingType(event),'revision')
  assert.match(event.title,/relevé révisé pour la même période/)
  assert.match(event.draft,/ne prouve pas une nouvelle opération/)
  assert.deepEqual(pendingNotifications([event],{acknowledged:[]}),[])
  const legacy={...event,kind:'publication',title:'Positions modifiées',reason:'Changement publié',draft:'Nouveaux achats'}
  assert.equal(editorialState(legacy),'secondary','Never trust a historical publication label')
  assert.match(readableSignal(legacy).reason,/ne prouve pas une nouvelle opération/)
  const previous={...initial.state,events:[legacy]}
  const migrated=advanceRadar(previous,[],{now}).feed.events[0]
  assert.equal(migrated.id,legacy.id)
  assert.equal(migrated.detectedAt,legacy.detectedAt)
  assert.deepEqual(migrated.before,legacy.before)
  assert.match(migrated.title,/relevé révisé/)
  assert.deepEqual(pendingNotifications([legacy],{acknowledged:[]}),[],'Pending retries are also excluded')
  assert.equal(advanceRadar(correction.state,[revised],{now}).newEvents.length,0,'No repeated correction')
  const publication=advanceRadar(correction.state,[{...revised,period:'2026-09-30'}],{now}).newEvents[0]
  assert.equal(editorialState(publication),'ready','A later quarter remains actionable even with unchanged positions')
  assert.equal(pendingNotifications([publication],{acknowledged:[]}).length,1)
  for(const beforePeriod of [null,'','2026-12-31','2026-02-30','not-a-date']) {
    assert.equal(editorialState({...event,beforePeriod}),'secondary')
    assert.deepEqual(pendingNotifications([{...event,beforePeriod}],{acknowledged:[]}),[])
  }
  assert.equal(editorialState({...publication,kind:'new'}),'secondary','A newly tracked fund is not new trading activity')
  assert.equal(groupSignals([legacy,publication]).filter(group=>group.state==='ready').length,1)
  console.log('13F radar: same-quarter revisions, legacy migration, pending notifications, unchanged later quarter and unknown periods verified.')
}
