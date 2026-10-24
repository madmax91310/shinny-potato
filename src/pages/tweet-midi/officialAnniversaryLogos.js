// The compact registry is checked against first-party provenance by the logo tests.
import sources from './officialAnniversaryLogos.json' with { type: 'json' }
export const OFFICIAL_ANNIVERSARY_LOGOS = Object.freeze(sources)
