import assert from 'node:assert/strict'
import { PURCHASING_SOURCES, parsePurchasingFeed, collectPurchasingNews, classifyStatus, classifyTopic, officialUrl } from './lib/purchasing-power-news.mjs'
import { advanceRadar, observationKey } from './lib/editorial-radar.mjs'
import { validateFeed } from '../src/pages/editorial-radar/client.js'
import { pendingNotifications, notificationState } from './lib/radar-notifications.mjs'
const now = new Date('2026-10-11T07:30:00Z'), source = PURCHASING_SOURCES[0]
const item = ({ title = 'PTZ : un nouveau plafond proposé', summary = 'Le Gouvernement propose un plafond de 100 000 euros pour certains foyers.', link = 'https://www.service-public.gouv.fr/particuliers/actualites/A12345?xtor=RSS-111', date = '2026-10-09T00:00:00+02:00' } = {}) => `<item><title><![CDATA[${title}]]></title><description><![CDATA[${summary}]]></description><link>${link.replaceAll('&', '&amp;')}</link><dc:date>${date}</dc:date></item>`
const feed = (...items) => `<rss xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>${items.join('')}</channel></rss>`
const parsed = parsePurchasingFeed(feed(item()), source, now)
assert.equal(parsed.observations.length, 1)
const row = parsed.observations[0]
assert.equal(row.period, '2026-10-09', 'Date de publication locale, pas le jour UTC précédent')
assert.equal(row.topic, 'logement')
assert.equal(row.status, 'Proposition / en discussion')
assert.equal(row.sourceUrl.endsWith('A12345'), true)
assert.equal(classifyTopic('PLF 2027 : mesures pour les particuliers et les entreprises', ''), 'fiscalite')
assert.equal(classifyTopic('Impôts : un numéro dédié aux professionnels', ''), null)
assert.equal(classifyTopic('Suspension du permis de conduire', 'Possibilité prévue pour les préfets.'), null)
assert.equal(classifyTopic('Bilan carbone de Bercy', 'Les émissions de gaz à effet de serre.'), null)
assert.equal(classifyTopic('Données personnelles après un décès', 'Une assurance utilise des données de santé.'), null)
assert.equal(classifyTopic('Prime d’activité : revalorisation', ''), 'revenus')
assert.equal(classifyStatus('PTZ : un plafond de 100 000 euros', '').status, 'À préciser')
assert.equal(classifyStatus('Projet de loi de finances', 'Le texte a été adopté par le Sénat.').status, 'Vote indiqué · étape à vérifier')
assert.equal(classifyStatus('Le taux du Livret A entrera en vigueur le 1er août', '').status, 'Application annoncée')
assert.equal(classifyStatus('PTZ : pas encore adopté', '').status, 'À préciser')
assert.equal(classifyStatus("Le texte n’a pas été adopté", '').status, 'À préciser')
assert.equal(classifyStatus('Un taux prévu par la réglementation', '').status, 'À préciser')
assert.equal(classifyStatus('Le montant pourrait augmenter', '').status, 'À préciser')
assert.equal(classifyStatus('Une loi promulguée', '').status, 'Promulgation indiquée')
assert.equal(classifyStatus('Le nouveau taux entre en vigueur', '').status, 'Application indiquée')
assert.throws(() => officialUrl('https://evil.invalid/news', source))
assert.throws(() => officialUrl('javascript:alert(1)', source))
assert.throws(() => officialUrl('https://www.service-public.gouv.fr@evil.invalid/news', source))
for (const xml of ['<html>Consent</html>', '<rss><channel><item></channel></rss>', '<!DOCTYPE rss><rss><channel/></rss>']) assert.throws(() => parsePurchasingFeed(xml, source, now))
assert.equal(parsePurchasingFeed(feed(), source, now).observations.length, 0, 'Un flux valide sans sujet pertinent n’est pas une panne')
for (const date of ['', '2026-10-32', '2026-11-01', '2026-02-30']) assert.equal(parsePurchasingFeed(feed(item({ date })), source, now).errors.length, 1)
assert.equal(parsePurchasingFeed(feed(item({ date: '2025-10-01' })), source, now).observations.length, 0)
assert.equal(parsePurchasingFeed(feed(item(), item({ link: row.sourceUrl + '?utm_source=foo' })), source, now).observations.length, 1)
const mixed = parsePurchasingFeed(feed(item(), item({ link: 'https://evil.invalid/news' })), source, now)
assert.equal(mixed.observations.length, 1); assert.equal(mixed.errors.length, 1)
const initialized = advanceRadar(null, [], { now }).state
const bootstrap = advanceRadar(initialized, [row], { now })
assert.equal(bootstrap.newEvents.length, 0, 'Ajout de la famille silencieux')
assert.equal(bootstrap.feed.purchasingPower.items.length, 1, 'Premier relevé consultable')
const newer = parsePurchasingFeed(feed(item({ title: 'PTZ : une nouvelle annonce', link: row.sourceUrl + '-new', date: '2026-10-10' })), source, now).observations[0]
const next = advanceRadar(bootstrap.state, [row, newer], { now })
assert.equal(next.newEvents.length, 1)
assert.equal(next.newEvents[0].topic, 'logement'); assert.match(next.newEvents[0].draft, /Sauvegarde ce tweet/)
assert.equal(advanceRadar(next.state, [row, newer], { now }).newEvents.length, 0, 'Collecte répétée silencieuse')
const ledger = notificationState(bootstrap.state, null, now)
assert.equal(pendingNotifications(next.state.events, ledger).length, 1)
assert.equal(pendingNotifications(next.state.events, { ...ledger, acknowledged: next.state.events.map(e => e.id) }).length, 0)
const updated = { ...row, period: '2026-10-10', status: 'Vote indiqué · étape à vérifier', statusEvidence: 'Le texte a été adopté.', value: { ...row.value, status: 'Vote indiqué · étape à vérifier' } }
const revised = advanceRadar(next.state, [updated, newer], { now })
assert.equal(revised.newEvents.length, 1, 'Révision de la même URL suivie')
assert.match(revised.newEvents[0].title, /mise à jour/)
const failed = advanceRadar(revised.state, [], { now, errors: [{ family: 'pouvoir-achat', entity: source.name, reason: 'HTTP 500' }] })
assert.equal(failed.state.current[observationKey(row)].value.status, updated.value.status)
assert.equal(failed.feed.purchasingPower.items.length, 2, 'Historique conservé après panne')
assert.equal(failed.newEvents.length, 0)
validateFeed(next.feed); validateFeed(failed.feed)
assert.throws(() => validateFeed({ ...next.feed, purchasingPower: { items: [{ sourceUrl: 'javascript:alert(1)' }], sources: [] } }))
const response = xml => ({ ok: true, headers: new Headers({ 'content-type': 'application/rss+xml' }), arrayBuffer: async () => new TextEncoder().encode(xml).buffer })
const partial = await collectPurchasingNews(now, async url => {
  if (url !== source.url) throw new Error('HTTP 500')
  return response(feed(item()))
})
assert.equal(partial.errors.length, PURCHASING_SOURCES.length - 1); assert.equal(partial.observations.length, 1)
assert.equal(partial.sources.filter(s => s.status === 'error').length, PURCHASING_SOURCES.length - 1)
const attempts = new Map()
const retry = await collectPurchasingNews(now, async url => {
  const n = (attempts.get(url) ?? 0) + 1; attempts.set(url, n)
  if (n === 1) throw new Error('Transient failure')
  if (url.includes('banque-france')) return { ...response('<a class="publication-card" href="/fr/statistiques/credit/credits-aux-particuliers-2026-08"><h3>Crédits aux particuliers - 2026-08</h3><p>06 Octobre 2026</p></a>'), headers: new Headers({ 'content-type': 'text/html' }) }
  if (url.includes('cre.fr')) return { ...response('<div class="card-body"><a href="/prix-gaz.html">Le prix repère du gaz augmente</a><time datetime="2026-10-09"></time></div>'), headers: new Headers({ 'content-type': 'text/html' }) }
  return response(feed())
})
assert.equal(retry.errors.length, 0, 'Reprise automatique après panne transitoire')
assert.ok([...attempts.values()].every(n => n === 2))
console.log('Veille pouvoir d’achat : thèmes, statuts, dates, sécurité, déduplication, bootstrap, révisions, conservation et reprise validés.')
if (process.argv.includes('--live')) {
  const live = await collectPurchasingNews()
  for (const s of live.sources) console.log(`${s.name}: ${s.status}, ${s.articles} articles, ${s.relevant} retenus`)
  console.log(live.errors)
  assert.equal(live.errors.length, 0, 'Les sources officielles raccordées doivent être exploitables au déploiement')
  assert.ok(live.observations.length > 0)
  validateFeed(advanceRadar(null, live.observations, { purchasingSources: live.sources }).feed)
}

// Parliamentary filtering must reject general politics and catch household rules.
const { parseParliamentaryTopic, parliamentaryStatus, atomToRss, parseOfficialListing } = await import('./lib/purchasing-power-sources.mjs')
for (const title of ['Élections sénatoriales', 'Projet de loi de finances pour 2027', 'Déployer un office de la biodiversité', 'Financement des entreprises', 'Stocks de sécurité des médicaments', 'Développement de la production nucléaire']) assert.equal(parseParliamentaryTopic(title, ''), null, title)
for (const [title, topic] of [['PTZ et accession à la propriété', 'logement'], ['Taxe foncière : plafonnement', 'fiscalite'], ['PEA et assurance-vie', 'fiscalite'], ['Tarifs de l’électricité', 'depenses'], ['Prime d’activité', 'revenus'], ['Allocations familiales', 'revenus'], ['Revalorisation des retraites', 'revenus']]) assert.equal(parseParliamentaryTopic(title, ''), topic, title)
assert.equal(parliamentaryStatus('Amendement PTZ adopté en commission', '', {}).status, 'Adoption en commission indiquée')
assert.equal(parliamentaryStatus('Amendement PTZ rejeté au Sénat', '', {}).status, 'Rejet indiqué')
assert.equal(parliamentaryStatus('PTZ pas encore adopté', '', { status: 'À préciser' }).status, 'À préciser')
const senate = PURCHASING_SOURCES.find(s => s.id === 'senat-textes')
assert.equal(officialUrl('http://www.senat.fr/leg/ppl26-001.html', senate), 'https://www.senat.fr/leg/ppl26-001.html')
assert.throws(() => officialUrl('http://evil.invalid/x', senate))
const dossierXml = `<feed><title>Sénat - PTZ et accession</title><entry><title>Vote en première lecture</title><id>http://www.senat.fr/leg/ppl26-001.html</id><updated>2026-10-10T12:00:00Z</updated><summary>Le texte est adopté au Sénat en première lecture.</summary></entry></feed>`
assert.match(atomToRss(dossierXml), /PTZ et accession/)
assert.throws(() => atomToRss('<feed><entry></feed>'))
const priorDossier = { ...row, sourceUrl: 'https://www.senat.fr/leg/ppl26-001.html', dossierFeedUrl: 'https://www.senat.fr/dossierleg/rss/doslegppl26-001.xml' }
const followed = await collectPurchasingNews(now, async url => {
  if (url === priorDossier.dossierFeedUrl) return response(dossierXml)
  if (url.includes('cre.fr')) return { ...response('<div class="card-body"><a href="/article.html">Actualité générale</a></div>'), headers: new Headers({ 'content-type': 'text/html' }) }
  if (url.includes('banque-france')) return { ...response('<a class="publication-card" href ="/fr/statistiques/credit/credits-aux-particuliers-2026-08"><h3>Crédits aux particuliers - 2026-08</h3><p>06 Octobre 2026</p></a>'), headers: new Headers({ 'content-type': 'text/html' }) }
  return response(feed())
}, { current: { old: priorDossier } })
assert.equal(followed.errors.length, 0)
const followedRow = followed.observations.find(o => o.dossierFeedUrl)
assert.equal(followedRow.status, 'Adoption en chambre indiquée')
assert.equal(followedRow.topic, 'logement')
const same = advanceRadar(advanceRadar(null, followed.observations, { now }).state, followed.observations, { now })
assert.equal(same.newEvents.length, 0, 'Les dossiers suivis ne répètent pas les alertes')
assert.throws(() => parseOfficialListing('<html>Format différent</html>', PURCHASING_SOURCES.find(s => s.id === 'cre-prix')))
console.log('Nouvelles sources : filtre particuliers, étapes parlementaires, dossiers persistants, dates et formats vérifiés.')
