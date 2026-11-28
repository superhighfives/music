import { toggleDone, useSaved } from './store'

export default function DoneButton({ doneKey, label }: { doneKey: string; label: string }) {
  const done = !!useSaved().done[doneKey]
  return (
    <button type="button" className={done ? 'btn isdone' : 'btn primary'} onClick={() => toggleDone(doneKey)}>
      {done ? '✓ Done' : label}
    </button>
  )
}
