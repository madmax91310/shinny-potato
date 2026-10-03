import { useContext } from 'react'
import { ActionTarget } from './actionTarget'
import { createPortal } from 'react-dom'

export default function WorkspaceActions({ children }) {
  const target = useContext(ActionTarget)
  return target ? createPortal(children, target) : null
}
