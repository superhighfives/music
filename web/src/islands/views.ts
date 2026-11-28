import type { Html } from '@effect/ui/html'
import { SITE_LINKS, type Section } from '../site-links'

/** The site footer, the same in every section. Its stylesheet, site-footer.css, loads with the page. */
export const SiteFooter = <M>(h: Html.H<M>, o: { current?: Section; className?: string }) =>
  h.footer.class(o.className ? `sitefoot ${o.className}` : 'sitefoot').children(
    h.nav.attr('aria-label', 'music').children(
      SITE_LINKS.map((l) => h.a.key(l.id).attr('href', l.href).attr('aria-current', l.id === o.current ? 'page' : undefined).children(l.label)),
    ),
  )
