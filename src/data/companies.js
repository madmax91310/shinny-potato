import profiles from './company-profiles.json' with { type: 'json' }
import observations from './company-analysis.json' with { type: 'json' }

export const COMPANIES = profiles.filter(profile=>!profile.candidateOnly).map(profile => ({ ...profile, ...observations.companies[profile.id] }))
