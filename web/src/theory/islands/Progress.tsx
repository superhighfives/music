import { useEffect } from 'preact/hooks'
import { Quiz } from '~/theory/components/ui'
import { CHAPTERS, findChapter } from '~/theory/content/book'
import { passCheck, toggleRead, useSaved, visit } from './store'

/** Chapters read, in the masthead, once there are any. */
export function MastProgress() {
  const { read, ready } = useSaved()
  const done = CHAPTERS.filter((c) => read[c.id]).length
  if (!ready || done === 0) return null
  return (
    <span className="mastprog" title={`${done} of ${CHAPTERS.length} chapters read`}>
      <span className="bar">
        <i style={{ width: `${(done / CHAPTERS.length) * 100}%` }} />
      </span>
      {done}/{CHAPTERS.length}
    </span>
  )
}

/** "· Read · Check passed" beside a chapter's reading time. Records the chapter as where you were. */
export function ChapterStatus({ chapterId }: { chapterId: string }) {
  const { read, checks } = useSaved()
  useEffect(() => visit(chapterId), [chapterId])
  return (
    <>
      {read[chapterId] ? ' · Read' : ''}
      {checks[chapterId] ? ' · Check passed' : ''}
    </>
  )
}

export function ReadButton({ chapterId }: { chapterId: string }) {
  const read = !!useSaved().read[chapterId]
  return (
    <button type="button" className={read ? 'btn isdone' : 'btn primary'} onClick={() => toggleRead(chapterId)}>
      {read ? '✓ Read' : 'Mark chapter read'}
    </button>
  )
}

/** The chapter's "Check yourself". Getting every question right first time passes it. */
export function Check({ chapterId }: { chapterId: string }) {
  const passed = !!useSaved().checks[chapterId]
  const chapter = findChapter(chapterId)
  if (!chapter) return null
  return <Quiz questions={chapter.check} onPass={() => passCheck(chapterId)} passed={passed} />
}
