import type { ComponentChildren as ReactNode } from 'preact'

/**
 * A short, standalone idea from a chapter. Cards close each chapter as its key ideas, and the daily
 * email sends one at a time, so they're plain text: no components, and each must make sense alone.
 */
export interface Card {
  /** Unique within the chapter. Never rename one: emails already sent are tracked by it. */
  id: string
  kind: 'concept' | 'pattern' | 'tip' | 'listen'
  title: string
  /** Paragraphs. `*word*` is set in bold. */
  body: string[]
}

export interface Question {
  prompt: ReactNode
  /** Something to look at or hear with the question, such as a Staff or Keyboard. */
  figure?: ReactNode
  options: string[]
  /** Index into options. */
  answer: number
  /** Shown once answered, right or wrong. */
  why: ReactNode
}

export interface Chapter {
  /** The chapter's address: /theory/<id>. Never rename one: progress is saved by it. */
  id: string
  title: string
  /** One line, for the contents. */
  summary: string
  /** About how long it takes, reading and playing. */
  minutes: number
  cards: Card[]
  /** "Check yourself" at the end. Getting them all right marks the check passed. */
  check: Question[]
}

export interface Part {
  id: string
  title: string
  level: 'Foundations' | 'Beginner' | 'Intermediate' | 'Advanced'
  blurb: string
  chapters: Chapter[]
  /** Chapters outlined but not written yet. */
  planned: { title: string; summary: string }[]
}
