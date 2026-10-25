// These are audited access points, explicitly NOT functioning discovery adapters.
// Keep their gap visible until a dated official publication is extracted and tested.
export const SOURCE_ACCESS_GAPS = [
  {id:'lcl-news',name:'LCL',url:'https://presse.credit-agricole.com/section/lcl?lang=fra',reason:'Section officielle identifiée ; le connecteur groupe couvre l’accueil, pas toute l’archive LCL. Extraction et profondeur spécifiques à qualifier.'},
  {id:'degiro-news',name:'DEGIRO',url:'https://www.degiro.fr/a-propos-de-degiro/nouvelles-presse',reason:'Une seule étude 2025 visible ; aucun avis de produit ou tarif découvert et qualifié. Prochaine piste : salle de presse flatexDEGIRO et avis clients publics.'},
  {id:'ibkr-news',name:'Interactive Brokers',url:'https://www.interactivebrokers.eu/',reason:'Anciennes routes mediaRelations/8-pressReleases.php et mediaRelations.php en 404. Prochaine piste : salle de presse du groupe et avis européens ; aucun flux supposé.'},

  {id:'fortuneo-news',name:'Fortuneo · presse',url:'https://www.fortuneo.fr/espace-presse',reason:'Page accessible (200) ; le JSON Gatsby officiel contient zéro article. Archive Arkéa à 27 éléments vérifiée : annonces Fortuneo corporate, aucune nouveauté financière qualifiée. Brochure et page des offres raccordées séparément par le suivi de deux versions ; la découverte de communiqués presse financiers reste partielle. Aucun lancement déduit de la présence d’un produit sur le site.'},
  {id:'trade-republic-news',name:'Trade Republic · presse',url:'https://traderepublic.com/en-de/press',reason:'Routes de presse et support en HTTP 404 localement ; /fr-fr/about répond 200 depuis GitHub mais ne contient qu’une coquille de navigation sans communiqué extractible. Le rendu client et une archive publique française restent à qualifier. Le moteur de recherche conserve des annonces indexées, sans découverte publique reproductible ; tarifs partagés conservés.'},
  {id:'xtb-news',name:'XTB · actualités',url:'https://www.xtb.com/fr/analyses-marches/actualites',reason:'Actualités accessibles mais principalement commentaires de marché ; découverte des annonces de services français non qualifiée. Registres financiers inchangés.'},
  {id:'insee-calendar',name:'INSEE · agenda de diffusion',url:'https://www.insee.fr/fr/information/1405540',reason:'Page accessible mais calendrier chargé par JavaScript ; requête JSON de l’agenda testée en erreur HTTP 500. Aucune publication déduite d’une date attendue.'},
  {id:'fuel-dgec',name:'DGEC · prix des produits pétroliers',url:'https://www.ecologie.gouv.fr/politiques-publiques/prix-produits-petroliers',reason:'Page et bulletin hebdomadaire PDF accessibles ; extraction des tableaux par carburant et comparaison compatible non raccordées. Pas de faux suivi quotidien ni de téléchargement intégral répété.'},
  {id:'notaires-france',name:'Notaires de France · conjoncture',url:'https://www.notaires.fr/fr/actualites',reason:'Accès au portail national refusé HTTP 403 lors de la qualification ; les Notaires du Grand Paris et INSEE sont exploités séparément.'},
  { id:'ishares', name:'iShares / BlackRock', url:'https://www.blackrock.com/corporate/newsroom/media/press-releases', reason:'Liste corporate accessible ; couverture des lancements UCITS européens et profondeur non qualifiées.' },
  { id:'spdr', name:'State Street / SPDR', url:'https://newsroom.statestreet.com/rss/pressrelease.aspx', reason:'Flux mondial raccordé et daté ; exemple du 14 octobre non UCITS rejeté. Aucun communiqué UCITS européen dans la fenêtre testée : couverture européenne partielle.' },
  { id:'vaneck', name:'VanEck', url:'https://www.vaneck.com/fr/fr/', reason:'Accueil France accessible au nouveau contrôle ; /sitemap.xml redirige vers un fonds américain, pas un sitemap. Avis PDF européens identifiés par recherche, sans liste datée automatique qualifiée. Prochaine piste : archive news-and-media officielle.' },
  { id:'ubs', name:'UBS', url:'https://www.ubs.com/global/en/media.html', reason:'Page Asset Management accessible ; API publique de recherche observée dans Chromium, zéro résultat ETF dans le périmètre rendu. Rejeu d’un document connu possible, découverte UCITS non prouvée. Prochaine piste : index média européen distinct.' },
  { id:'jpmorgan', name:'JPMorgan AM', url:'https://am.jpmorgan.com/fr/fr/asset-management/adv/', reason:'Portail conseiller accessible ; découverte datée des annonces UCITS non qualifiée.' },
]
export async function checkSourceAccess(now = new Date(), request = fetch, previous = {}) {
  // Retire obsolete access-only gaps when their real connector is installed.
  // Publication queues, event IDs and receipts are stored separately and unchanged.
  const state = Object.fromEntries(Object.entries(structuredClone(previous)).filter(([id])=>SOURCE_ACCESS_GAPS.some(source=>source.id===id)))
  await Promise.all(SOURCE_ACCESS_GAPS.map(async source => {
    const old = state[source.id]
    state[source.id]={...old,...source}
    if (old?.url===source.url && old?.nextCheckAt && Date.parse(old.nextCheckAt) > +now) return
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
