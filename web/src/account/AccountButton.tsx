import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'

/**
 * Sign in, or the signed-in person's menu. Each section styles the sign-in button to match itself;
 * Clerk's own dialog and menu look the same everywhere.
 */
export function AccountButton({ className }: { className: string }) {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className={className}>
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  )
}
