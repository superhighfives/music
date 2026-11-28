import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { dark } from '@clerk/ui/themes'
import { type ComponentProps, useEffect, useState } from 'react'

type ClerkAppearance = NonNullable<ComponentProps<typeof UserButton>['appearance']>

// Clerk's dialog and menu follow the page's light or dark theme, in its type.
const LIGHT: ClerkAppearance = { variables: { fontFamily: 'var(--sans)' } }
const DARK: ClerkAppearance = { theme: dark, variables: { fontFamily: 'var(--sans)' } }

/** Sign in, or the signed-in person's menu. */
export function AccountButton({ className }: { className: string }) {
  const appearance = useDarkPage() ? DARK : LIGHT
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
 * Whether the page is dark right now: an explicit data-theme on <html> (the masthead's toggle sets one),
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
