import { describe, expect, it, vi } from 'vitest'

// AccountButton imports Clerk's React components, which this test doesn't need.
vi.mock('@clerk/tanstack-react-start', () => ({ Show: () => null, SignInButton: () => null, UserButton: () => null }))
vi.mock('@clerk/ui/themes', () => ({ dark: { name: 'dark' } }))

const { isDarkPage } = await import('./AccountButton')

describe('isDarkPage', () => {
  it('follows an explicit data-theme over the system setting', () => {
    expect(isDarkPage('dark', false)).toBe(true)
    expect(isDarkPage('light', true)).toBe(false)
  })

  it('follows the system setting when nothing is set', () => {
    expect(isDarkPage(null, true)).toBe(true)
    expect(isDarkPage(null, false)).toBe(false)
  })
})
