// These are audited access points, explicitly NOT functioning discovery adapters.
// Keep their gap visible until a dated official publication is extracted and tested.
export const SOURCE_ACCESS_GAPS = [
  {id:'fortuneo-news',name:'Fortuneo · presse',url:'https://www.fortuneo.fr/espace-presse',reason:'Page accessible (200) ; liste datée et documents non extraits dans le HTML contrôlé. Aucun lancement déduit de la présence d’un produit sur le site.'},
  {id:'credit-agricole-news',name:'Crédit Agricole · presse',url:'https://presse.credit-agricole.com/',reason:'Accueil accessible ; flux /feed/ refusé (403). Extraction des communiqués et périmètres des caisses non qualifiée ; aucune offre régionale généralisée.'},
  {id:'trade-republic-news',name:'Trade Republic · presse',url:'https://traderepublic.com/en-de/press',reason:'Portail accessible ; liste datée française non qualifiée. Les routes françaises presse testées renvoient 404 ; tarifs partagés conservés.'},
  {id:'xtb-news',name:'XTB · actualités',url:'https://www.xtb.com/fr/analyses-marches/actualites',reason:'Actualités accessibles mais principalement commentaires de marché ; découverte des annonces de services français non qualifiée. Registres financiers inchangés.'},
  {id:'insee-calendar',name:'INSEE · agenda de diffusion',url:'https://www.insee.fr/fr/information/1405540',reason:'Page accessible mais calendrier chargé par JavaScript ; requête JSON de l’agenda testée en erreur HTTP 500. Aucune publication déduite d’une date attendue.'},
  {id:'fuel-dgec',name:'DGEC · prix des produits pétroliers',url:'https://www.ecologie.gouv.fr/politiques-publiques/prix-produits-petroliers',reason:'Page et bulletin hebdomadaire PDF accessibles ; extraction des tableaux par carburant et comparaison compatible non raccordées. Pas de faux suivi quotidien ni de téléchargement intégral répété.'},
  {id:'notaires-france',name:'Notaires de France · conjoncture',url:'https://www.notaires.fr/fr/actualites',reason:'Accès au portail national refusé HTTP 403 lors de la qualification ; les Notaires du Grand Paris et INSEE sont exploités séparément.'},
  { id:'ishares', name:'iShares / BlackRock', url:'https://www.blackrock.com/corporate/newsroom/media/press-releases', reason:'Liste corporate accessible ; couverture des lancements UCITS européens et profondeur non qualifiées.' },
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
