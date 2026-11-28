import { describe, expect, it, vi } from 'vitest'

// Masthead imports Clerk's React components through AccountButton, which this test doesn't need.
vi.mock('@clerk/tanstack-react-start', () => ({ Show: () => null, SignInButton: () => null, UserButton: () => null }))
vi.mock('@clerk/ui/themes', () => ({ dark: { name: 'dark' } }))

const { THEME_SCRIPT } = await import('./Masthead')

// THEME_SCRIPT is a string the browser runs before first paint, so the typechecker never sees it. Run it here.
function runThemeScript(stored: string | null | Error) {
  const attributes: Record<string, string> = {}
  const localStorage = {
    getItem: (key: string) => {
      if (stored instanceof Error) throw stored
      return key === 'music.theme' ? stored : null
    },
  }
  const document = { documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) } }
  new Function('localStorage', 'document', THEME_SCRIPT)(localStorage, document)
  return attributes['data-theme']
}

describe('THEME_SCRIPT', () => {
  it('applies a saved light or dark choice', () => {
    expect(runThemeScript('dark')).toBe('dark')
    expect(runThemeScript('light')).toBe('light')
  })

  it('leaves the system setting in charge when nothing valid is saved', () => {
    expect(runThemeScript(null)).toBeUndefined()
    expect(runThemeScript('purple')).toBeUndefined()
  })

  it('does not throw when storage is blocked', () => {
    expect(runThemeScript(new Error('SecurityError'))).toBeUndefined()
  })
})
