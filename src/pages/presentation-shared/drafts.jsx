import { createContext, useContext, useState } from 'react'
export const PresentationDrafts = createContext(null)
// The parent owns selections and drafts so switching family never drops an edit.
export function usePresentationDraft(kind, firstId) {
  const shared = useContext(PresentationDrafts)
  const [local, setLocal] = useState({})
  const [states, setStates] = shared ?? [local, setLocal]
  const state = states[kind] ?? { id: firstId, drafts: {} }
  const setId = id => setStates(all => ({ ...all, [kind]: { ...state, id } }))
  const setDraft = draft => setStates(all => {
    const current = all[kind] ?? state
    return { ...all, [kind]: { ...current, drafts: { ...current.drafts, [state.id]: draft } } }
  })
  return [state.id, setId, state.drafts[state.id] ?? null, setDraft]
}
