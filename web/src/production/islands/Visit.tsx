import { useEffect } from 'preact/hooks'
import { visit } from './store'

/** Records the lesson on this page as where you were, for Continue on the course home. Draws nothing. */
export default function Visit({ lessonKey }: { lessonKey: string }) {
  useEffect(() => visit(lessonKey), [lessonKey])
  return null
}
