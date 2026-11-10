import retired from '../data/retired-automations.json' with {type:'json'}

// Keep this boundary aligned with automation_contracts.workflow_retirement.
export function workflowRetirement(row) {
  const workflow = ['monitor:radar','monitor:radar-proofs','critical:radar-coverage'].includes(row.id) ? 'update-editorial-radar.yml' : row.workflow
  const policy = retired.workflows[workflow]
  if (!policy) return null
  if (policy.status === 'disabled-by-request') {
    if (['monitor:radar','monitor:radar-proofs','critical:radar-coverage'].includes(row.id)) return policy
    if (row.tools?.some(tool=>tool!=='Radar éditorial') || row.impactScope==='asset') return null
    if (row.dataId && !row.dataId.startsWith('radar:')) return null
  }
  return policy
}
