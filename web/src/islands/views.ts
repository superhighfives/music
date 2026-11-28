import { Mount } from '@effect/ui'
import type { Html } from '@effect/ui/html'
import { Sun } from 'lucide'
import { type Child, noMessages, render } from '../content/render'
import { SITE_LINKS, type Section } from '../site-links'
import { ShowUserButton, absurd } from './auth'
import { Icon } from './masthead'

/** The site footer, the same in every section. Its stylesheet, site-footer.css, loads with the page. */
export const SiteFooter = <M>(h: Html.H<M>, o: { current?: Section; className?: string }) =>
  h.footer.class(o.className ? `sitefoot ${o.className}` : 'sitefoot').children(
    h.nav.attr('aria-label', 'music').children(
      SITE_LINKS.map((l) => h.a.key(l.id).attr('href', l.href).attr('aria-current', l.id === o.current ? 'page' : undefined).children(l.label)),
    ),
  )

/**
 * The masthead's theme toggle and account button, for a page's islands. `theme` and `signIn` are the page
 * component's messages for them; its update runs `ToggleTheme` and `OpenSignIn`.
 */
export const mastheadIslands = <M>(h: Html.H<M>, o: { userId: string | null; theme: M; signIn: M }) => ({
  ThemeToggle: (): Child<M> =>
    h.button
      .attr('type', 'button')
      .class('iconbtn')
      .attr('aria-label', 'Switch light or dark theme')
      .on('click', o.theme)
      .children(render(h, Icon({ icon: Sun, size: 20, strokeWidth: 1.6 }), {}, noMessages)),
  Account: (): Child<M> =>
    o.userId === null
      ? h.button.attr('type', 'button').class('btn').on('click', o.signIn).children('Sign in')
      : h.div.onMount(ShowUserButton().pipe(Mount.map(absurd))),
})
