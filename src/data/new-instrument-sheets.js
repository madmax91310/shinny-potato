import IDENTITIES from './new-instrument-identities.json' with { type: 'json' }

// Rédaction revue le 01/11/2026, sources exactes dans le dossier du lot.
// Les chiffres et caractéristiques viennent exclusivement des registres collectés.
import COPY from './new-instrument-copy.json' with { type: 'json' }


export const NEW_INSTRUMENT_SHEETS = IDENTITIES.map(identity => ({
  ...identity, ...COPY[identity.isin], presentationOnly: true, isNew: true,
  verdict: COPY[identity.isin].whatIs,
}))
