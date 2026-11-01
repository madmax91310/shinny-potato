import classes from './investor-model-classes.json' with { type: 'json' }

// These labels describe classes, never a security held by the author.
export const MODEL_ASSET_CLASSES = Object.freeze(classes)
export const modelAllocationRows = model => model.rows.map(row => ({ classId: row.classId, issuerName: MODEL_ASSET_CLASSES[row.classId], ticker: '', weight: row.units / model.denominator }))
