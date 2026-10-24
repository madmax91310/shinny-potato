// These are audited access points, explicitly NOT functioning discovery adapters.
// Keep their gap visible until a dated official publication is extracted and tested.
export const SOURCE_ACCESS_GAPS = [
  { id:'ishares', name:'iShares / BlackRock', url:'https://www.blackrock.com/corporate/newsroom/media/press-releases', reason:'Liste corporate accessible ; couverture des lancements UCITS européens et profondeur non qualifiées.' },
  { id:'bnp', name:'BNP Paribas AM', url:'https://www.bnpparibas-am.com/fr-fr/', reason:'Portail public accessible ; découverte datée des annonces ETF à qualifier.' },
  { id:'spdr', name:'State Street / SPDR', url:'https://www.ssga.com/fr/fr/about-us', reason:'Portail institutionnel accessible ; liste de communiqués ETF européens non qualifiée.' },
  { id:'invesco', name:'Invesco', url:'https://www.invesco.com/uk/en/about-us/media-hub.html', reason:'Media hub accessible ; communiqués PDF et archive ETF à qualifier.' },
  { id:'vaneck', name:'VanEck', url:'https://www.vaneck.com/fr/fr/', reason:'Accès public refusé lors de la vérification initiale ; aucun flux supposé.' },
  { id:'ubs', name:'UBS', url:'https://www.ubs.com/global/en/media.html', reason:'Portail média accessible ; archive ETF européenne datée non qualifiée.' },
  { id:'jpmorgan', name:'JPMorgan AM', url:'https://am.jpmorgan.com/fr/fr/asset-management/adv/', reason:'Portail conseiller accessible ; découverte datée des annonces UCITS non qualifiée.' },
]
export async function checkSourceAccess(now = new Date(), request = fetch, previous = {}) {
  const state = structuredClone(previous)
  await Promise.all(SOURCE_ACCESS_GAPS.map(async source => {
    const old = state[source.id]
    if (old?.nextCheckAt && Date.parse(old.nextCheckAt) > +now) return
    const row = { ...source, status:'unqualified', attemptedAt:now.toISOString(), method:'Contrôle d’accès uniquement', depth:'Aucune couverture déclarée', nextCheckAt:new Date(+now+86400000).toISOString() }
    try {
      const response = await request(source.url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'EpargnantLibre-Radar/2.0',Accept:'text/html'}})
      row.httpStatus=response.status; row.finalUrl=response.url || source.url
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const html=await response.text()
      if (/Request Rejected|Access Denied|Vérification de sécurité|captcha/i.test(html) && html.length<100000) throw new Error('Page de rejet ou de vérification de sécurité')
      row.checkedAt=now.toISOString(); row.reason=source.reason
    } catch(error) { row.status='error'; row.error=error.message; row.lastSuccessAt=old?.checkedAt ?? old?.lastSuccessAt ?? null }
    state[source.id]=row
  }))
  return state
}
