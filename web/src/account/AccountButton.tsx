import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { dark } from '@clerk/ui/themes'
import { type ComponentProps, useEffect, useState } from 'react'

/** How Clerk's sign-in dialog and account menu look in a section. */
export type ClerkAppearance = NonNullable<ComponentProps<typeof UserButton>['appearance']>

/** chords is always dark, with its cyan for buttons and links. */
export const DARK_APPEARANCE: ClerkAppearance = {
  theme: dark,
  variables: { colorPrimary: 'oklch(0.78 0.16 195)', colorPrimaryForeground: '#0a0a0a', colorBackground: '#171717' },
}

/** The home page's light version, with the darker cyan it uses on white (see site.css). */
const LIGHT_APPEARANCE: ClerkAppearance = {
  variables: { colorPrimary: 'oklch(0.55 0.12 200)', colorPrimaryForeground: '#ffffff' },
}

/** The home page follows the system's light or dark setting, and so do Clerk's dialog and menu there. */
export const useSiteAppearance = () => (useDarkPage() ? DARK_APPEARANCE : LIGHT_APPEARANCE)

/**
 * Sign in, or the signed-in person's menu. Each section styles the sign-in button to match itself
 * and picks how Clerk's own dialog and menu look.
 */
export function AccountButton({ className, appearance }: { className: string; appearance?: ClerkAppearance }) {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal" appearance={appearance}>
          <button type="button" className={className}>
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton appearance={appearance} />
      </Show>
    </>
  )
}

/** An explicit data-theme on <html> wins; without one, the system setting decides. */
export const isDarkPage = (dataTheme: string | null, systemDark: boolean) => (dataTheme ? dataTheme === 'dark' : systemDark)

/**
 * Whether the page is dark right now: an explicit data-theme on <html> (Production's toggle sets one),
 * or else the system setting. Follows both as they change. False until mounted, like the server render.
 */
export function useDarkPage() {
  const [isDark, setDark] = useState(false)
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const read = () => {
      setDark(isDarkPage(document.documentElement.getAttribute('data-theme'), media.matches))
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    media.addEventListener('change', read)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', read)
    }
  }, [])
  return isDark
}
