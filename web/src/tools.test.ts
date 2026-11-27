import { describe, expect, it, vi } from 'vitest'
import { lessonLink, TOOL_GROUPS } from './tools'

// The course's store syncs to accounts through the Worker runtime, which tests don't have. Lesson titles don't need it.
vi.mock('~/production/lib/store', () => ({}))

describe('TOOL_GROUPS', () => {
  it('links every tool only to Production lessons and recipes that exist', () => {
    const keys = TOOL_GROUPS.flatMap((g) => g.tools.flatMap((t) => t.lessons))
    expect(keys.filter((key) => lessonLink(key) === null)).toEqual([])
  })
})

describe('lessonLink', () => {
  it('resolves lessons and recipes to their pages, and nothing else', () => {
    expect(lessonLink('sound.gain')).toEqual({ title: 'Gain staging', href: '/production/themes/sound/gain' })
    expect(lessonLink('recipe.the-peace')?.href).toBe('/production/recipes/the-peace')
    expect(lessonLink('sound.nope')).toBeNull()
  })
})
