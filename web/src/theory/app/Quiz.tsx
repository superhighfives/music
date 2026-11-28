/** @jsxImportSource ~/content */
import { Schema } from 'effect'
import { findChapter } from '~/theory/content/book'
import { figure } from './define'

/**
 * A chapter's "Check yourself": multiple-choice questions, one after another. Each shows why once
 * answered. Answering every one right on the first try reports `passed` to the page.
 */
export const Quiz = figure('Quiz', {
  args: Schema.Struct({ chapterId: Schema.String, passed: Schema.Boolean }),
  state: Schema.Struct({ answers: Schema.Array(Schema.NullOr(Schema.Number)) }),
  init: ({ chapterId }) => ({ answers: (findChapter(chapterId)?.check ?? []).map(() => null) }),
  view: ({ chapterId, passed }, { answers }, act) => {
    const questions = findChapter(chapterId)?.check ?? []
    const answered = answers.filter((a) => a !== null).length
    const right = answers.filter((a, i) => a === questions[i]?.answer).length
    const finished = answered === questions.length
    const choose = (qi: number, oi: number) => {
      if (answers[qi] !== null) return undefined
      const next = answers.map((a, i) => (i === qi ? oi : a))
      const all = next.every((a, i) => a === questions[i]?.answer)
      return all ? act.set({ answers: next }, { emit: 'passed' }) : act.set({ answers: next })
    }
    return (
      <div className="quiz">
        {questions.map((q, qi) => {
          const a = answers[qi] ?? null
          // One at a time: the next question appears once this one's answered.
          if (qi > 0 && answers[qi - 1] === null) return null
          return (
            <div className="q">
              <div className="qp">
                <span className="qn">{qi + 1}</span>
                <div>{q.prompt}</div>
              </div>
              {q.figure}
              <div className="opts" role="group" aria-label={`Question ${qi + 1} answers`}>
                {q.options.map((o, oi) => {
                  const state = a === null ? '' : oi === q.answer ? 'good' : oi === a ? 'bad' : 'idle'
                  return (
                    <button type="button" className={`opt ${state}`} disabled={a !== null} onClick={() => choose(qi, oi)}>
                      {o}
                    </button>
                  )
                })}
              </div>
              {a !== null ? (
                <div className={a === q.answer ? 'why good' : 'why bad'} role="status">
                  <b>{a === q.answer ? 'Yes.' : `Not quite: it's ${q.options[q.answer]}.`}</b> {q.why}
                </div>
              ) : null}
            </div>
          )
        })}
        {finished ? (
          <div className="qfoot">
            <span>
              {right} of {questions.length} right.{' '}
              {right === questions.length ? (passed ? 'Check passed.' : '') : 'Get them all to pass the check.'}
            </span>
            <button type="button" className="btn" onClick={() => act.set({ answers: questions.map(() => null) })}>
              Try again
            </button>
          </div>
        ) : null}
      </div>
    )
  },
})
