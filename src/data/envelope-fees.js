import insurance from './automated-insurance.json' with { type: 'json' }

// Frais annuels d’enveloppe relevés par le collecteur assurance-vie : frais de gestion sur les
// unités de compte, qui s’ajoutent aux frais du support. Le PEA et le CTO n’ont pas de frais
// d’enveloppe proportionnels ; leurs frais de courtage ou de garde ne sont pas simulés ici.
const pct = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
export const NO_ENVELOPE = Object.freeze({ id: '', name: 'Aucun frais d’enveloppe (PEA, CTO)', fee: 0 })
export const ENVELOPE_FEES = Object.freeze([
  NO_ENVELOPE,
  ...insurance.records
    .filter(record => Number.isFinite(record.fees?.units))
    .map(record => Object.freeze({ id: record.id, name: `${record.name} · ${pct(record.fees.units)} sur les unités de compte`, contract: record.name, fee: record.fees.units,
      sourceUrl: record.fees.sourceUrl ?? record.sourceUrl, checkedAt: record.checkedAt, scope: record.fees.scope ?? null }))
    .sort((a, b) => a.contract.localeCompare(b.contract, 'fr')),
])
export const envelopeFeeOption = id => ENVELOPE_FEES.find(option => option.id === (id ?? '')) ?? NO_ENVELOPE
