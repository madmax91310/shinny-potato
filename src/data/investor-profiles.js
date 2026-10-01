// Une présentation courte par profil ; les déclarations 13F restent une source distincte.
export const INVESTOR_PROFILES = Object.freeze(Object.fromEntries([
  ['tepper', 'David Tepper a fondé Appaloosa en 1993, après avoir travaillé sur les entreprises en difficulté.', ['https://www.panthers.com/team/ownership_business/test-david-a-tepper']],
  ['ackman', 'Bill Ackman est le fondateur de Pershing Square, une société de gestion qui investit dans des entreprises cotées.', ['https://www.pershingsquareinc.com/team/bill-ackman/', 'https://pershingsquareholdings.com/about-us/']],
  ['berkshire', 'Berkshire Hathaway est le conglomérat développé par Warren Buffett et Charlie Munger, qui possède des entreprises et un portefeuille d’actions.', ['https://www.berkshirehathaway.com/2025ar/2025ar.pdf']],
  ['cathie-wood', 'Cathie Wood est la fondatrice d’ARK Invest, une société de gestion spécialisée dans les entreprises liées à l’innovation.', ['https://www.ark-invest.com/the-ark-difference']],
  ['thiel', 'Peter Thiel est un entrepreneur et investisseur, cofondateur de PayPal et de Palantir, et associé de Founders Fund.', ['https://foundersfund.com/team/peter-thiel/']],
  ['druckenmiller', 'Stanley Druckenmiller est un investisseur américain qui a fondé Duquesne Capital Management en 1981.', ['https://www.grantspub.com/includes/cfn_speakerBio.cfm?sid=155']],
  ['loeb', 'Daniel Loeb dirige Third Point, une société de gestion créée en 1995 qui investit notamment dans les actions et le crédit.', ['https://www.thirdpoint.com/']],
  ['aschenbrenner', 'Leopold Aschenbrenner est un ancien chercheur d’OpenAI qui a fondé une société d’investissement centrée sur l’intelligence artificielle.', ['https://situational-awareness.ai/leopold-aschenbrenner/']],
  ['li-lu', 'Li Lu est le fondateur d’Himalaya Capital, une société de gestion qui investit à long terme dans les entreprises en Asie et en Amérique du Nord.', ['https://www.himcap.com/']],
  ['gates-trust', 'Le Gates Foundation Trust détient et gère la dotation qui finance les activités de la fondation Gates.', ['https://www.gatesfoundation.org/about/financials/foundation-trust']],
  ['klarman', 'Seth Klarman dirige les investissements de Baupost, une société de gestion qui recherche la valeur sur le long terme.', ['https://www.baupost.com/About']],
].map(([slug, intro, sourceUrls]) => [slug, Object.freeze({ intro, sourceUrls: Object.freeze(sourceUrls), checkedAt: '2026-10-01' })])))

export function investorIntroduction(slug) { return INVESTOR_PROFILES[slug]?.intro ?? '' }
