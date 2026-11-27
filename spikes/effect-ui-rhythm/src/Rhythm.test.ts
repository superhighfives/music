// @vitest-environment happy-dom
import { HtmlLocator, HtmlPlay } from '@effect/ui/html/testing'
import { Component } from '@effect/ui'
import { Locator, Story, TestHost } from '@effect/ui/testing'
import { assert, describe, it } from '@effect/vitest'
import { Effect } from 'effect'
import { TestClock } from 'effect/testing'
import { RhythmMessage, RhythmNoDeps, WaitStep } from './Rhythm.ts'

// Two quarters and two eighths at 60 bpm: steps of 1000, 1000, 500 and 500 ms.
const props = { rhythm: 'q q e e', bpm: 60, beats: 4 }

describe('Rhythm as a Story: the state machine, with commands answered by hand', () => {
  it.effect('plays each step in turn, then stops', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(RhythmNoDeps, props)
      story.send(RhythmMessage.ClickedPlay())
      assert.strictEqual(story.model.current, 0)
      story.resolve(WaitStep.make({ index: 0, millis: 1000, last: false }), RhythmMessage.ReachedStep({ index: 1 }))
      assert.strictEqual(story.model.current, 1)
      story.resolve(WaitStep.make({ index: 1, millis: 1000, last: false }), RhythmMessage.ReachedStep({ index: 2 }))
      story.resolve(WaitStep.make({ index: 2, millis: 500, last: false }), RhythmMessage.ReachedStep({ index: 3 }))
      story.resolve(WaitStep.make({ index: 3, millis: 500, last: true }), RhythmMessage.Finished())
      assert.strictEqual(story.model.current, null)
      story.expectNone()
    }))

  it.effect('Play does nothing with no notes or no tempo', () =>
    Effect.gen(function* () {
      for (const bad of [{ ...props, rhythm: '' }, { ...props, bpm: 0 }]) {
        const story = yield* Story.make(RhythmNoDeps, bad)
        story.send(RhythmMessage.ClickedPlay())
        assert.strictEqual(story.model.current, null)
        story.expectNone()
      }
    }))

  it.effect('Stop interrupts the waiting step', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(RhythmNoDeps, props)
      story.send(RhythmMessage.ClickedPlay()).send(RhythmMessage.ClickedStop())
      assert.strictEqual(story.model.current, null)
      assert.strictEqual(story.interrupted.length, 1)
      story.expectNone()
    }))
})

// The real WaitStep, with time owned by the TestClock: the timing itself is under test.
const Rhythm = RhythmNoDeps.pipe(Component.provide(WaitStep.layer))
const lit = Locator.attr('aria-current', 'step')

it.layer(TestHost.layer(), { buildPerTest: true })('Rhythm as a Play: timing on a TestClock', (it) => {
  it.effect('lights each note for exactly its length', () =>
    Effect.gen(function* () {
      const play = yield* HtmlPlay.make(Rhythm, props)
      yield* play.click(HtmlLocator.role('button', { name: 'Play' }))
      yield* play.expect(lit).toHaveText('1')
      yield* TestClock.adjust('999 millis')
      yield* play.expect(lit).toHaveText('1')
      yield* TestClock.adjust('1 millis')
      yield* play.expect(lit).toHaveText('2')
      yield* TestClock.adjust('1000 millis')
      yield* play.expect(lit).toHaveText('3')
      yield* TestClock.adjust('500 millis')
      yield* play.expect(lit).toHaveText('&')
      yield* TestClock.adjust('500 millis')
      yield* play.expect(lit).toBeAbsent()
      yield* play.expect(HtmlLocator.role('button', { name: 'Play' })).toExist()
    }))

  it.effect('Stop freezes the line where it is', () =>
    Effect.gen(function* () {
      const play = yield* HtmlPlay.make(Rhythm, props)
      yield* play.click(HtmlLocator.role('button', { name: 'Play' }))
      yield* TestClock.adjust('1000 millis')
      yield* play.click(HtmlLocator.role('button', { name: 'Stop' }))
      yield* play.expect(lit).toBeAbsent()
      yield* TestClock.adjust('10 seconds')
      yield* play.expect(lit).toBeAbsent()
    }))
})
