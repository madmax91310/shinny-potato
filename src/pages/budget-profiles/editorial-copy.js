// Static copy patches preserve prior evidence and every untouched financial field.
export function reviseEditorialCopy(previous, patch) {
  if (!patch) return previous
  return { ...previous, ...patch,
    publicProfile: { ...previous.publicProfile, ...patch.publicProfile },
    contextEntries: { ...previous.contextEntries, ...patch.contextEntries,
      evidenceAddition: { ...previous.contextEntries.evidenceAddition, ...patch.contextEntries.evidenceAddition },
    },
  }
}
