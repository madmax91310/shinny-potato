import observations from './automated-insurance.json' with { type: 'json' }
// Preserve the archived evidence, but never publish a successor's terms under the old name.
export const ARCHIVED_INSURANCE = observations.records.filter(row => row.availability?.status === 'superseded')
export const INSURANCE = observations.records.filter(row => row.availability?.status !== 'superseded')
