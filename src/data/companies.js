import profiles from './company-profiles.json' with { type: 'json' }
import observations from './company-analysis.json' with { type: 'json' }

// Candidates remain available to explicit collection trials until full runner qualification.
export const COMPANIES = profiles.filter(profile => !profile.candidateOnly).map(profile => ({ ...profile, ...observations.companies[profile.id] }))
