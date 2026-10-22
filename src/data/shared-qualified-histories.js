import RECORDS from './ranking-histories.json' with {type:'json'}
// Explicit consumer qualification travels with the collected listing record.
// It does not admit every ranking candidate to the other tools automatically.
export const SHARED_QUALIFIED_HISTORIES = Object.fromEntries(Object.entries(RECORDS).filter(([,record])=>record.sharedHistory===true))
