import { Html } from '@effect/ui/html'
import { Schema } from 'effect'
import { EXTENSIONS } from '../extensions'
import { SiteFooter } from '../islands/views'
import { TOOL_GROUPS, lessonLink } from '../tools'

/*
 * Pages with nothing to do in the browser. They render on the Worker as plain HTML, with home's styles
 * and no script.
 */
const component = <Name extends string>(name: Name) =>
  Html.component({ name, model: Schema.Struct({}), message: Schema.Never })

const Back = (h: Html.H<never>) => h.a.class('back').attr('href', '/').children('← music')

export const Ableton = component('Ableton').make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
  h.main.children(
    Back(h),
    h.h1.children('Ableton Extensions'),
    h.p.children('Tools that read and rewrite a Live Set, run from right-click menus inside Live. They need Live 12.4.5 Suite (public beta) or later.'),
    h.h2.children('Extensions'),
    h.ul.class('cards').children(
      EXTENSIONS.map((x) =>
        h.li.key(x.id).class('card').children(
          h.h3.children(x.id),
          h.p.children(x.about),
          h.p.class('how').children(x.how),
          h.a.class('download').attr('href', `/ableton/${x.id}.ablx`).children('Download'),
        ),
      ),
    ),
    h.h2.children('Install'),
    h.ol.children(
      h.li.children('Download the ', h.code.children('.ablx'), ' for an extension.'),
      h.li.children('In Live, open Settings → Extensions.'),
      h.li.children('Drag the ', h.code.children('.ablx'), ' onto the Extensions page, then turn it on. Restart Live if it asks.'),
    ),
    h.p.children('Source, older versions and release notes are on ', h.a.attr('href', 'https://github.com/superhighfives/music/releases').children('GitHub'), '.'),
    SiteFooter(h, { current: 'ableton' }),
  ),
})

// Plain links to Production, like everywhere else between sections: it loads its own styles.
export const Tools = component('Tools').make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
  h.main.children(
    Back(h),
    h.h1.children('Tools'),
    h.p.children(
      'Everything in the studio, what each tool is for, and short exercises to learn it. Lessons link to ',
      h.a.attr('href', '/production').children('Production'),
      ', where the techniques are taught in order.',
    ),
    TOOL_GROUPS.map((group) =>
      h.section.key(group.name).children(
        h.h2.children(group.name),
        h.p.class('group-about').children(group.about),
        h.ul.class('cards').children(
          group.tools.map((tool) => {
            const links = [
              ...tool.lessons.flatMap((key) => {
                const link = lessonLink(key)
                return link ? [{ label: link.title, href: link.href }] : []
              }),
              ...(tool.links ?? []),
            ]
            return h.li.key(tool.name).class('card').children(
              h.h3.children(tool.name),
              h.p.children(tool.what),
              h.h4.children('Learn it'),
              h.ul.class('learn').children(tool.learn.map((step) => h.li.key(step).children(step))),
              links.length > 0 &&
                h.p.class('how').children(
                  'See: ',
                  links.map((l, i) => h.span.key(l.href).children(i > 0 ? ' · ' : '', h.a.attr('href', l.href).children(l.label))),
                ),
            )
          }),
        ),
      ),
    ),
    SiteFooter(h, { current: 'tools' }),
  ),
})

const link = (h: Html.H<never>, href: string, text: string) => h.a.attr('href', href).children(text)

export const Privacy = component('Privacy').make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
  h.main.children(
    Back(h),
    h.h1.children('Privacy'),
    h.p.children('Last updated 26 November 2026.'),
    h.h2.children('Without an account'),
    h.p.children(
      "Chords, Production and Theory save your settings, pasted chord sheets, course progress and chapters read in your browser's own storage. They never leave your device. Clearing your browser's data for this site removes them.",
    ),
    h.h2.children('With an account'),
    h.p.children(
      'Signing in is optional. Sign-in is handled by ',
      link(h, 'https://clerk.com/privacy', 'Clerk'),
      ', which keeps your email address and, if you sign in with Google, your name and profile picture from Google. This site asks Google only for your email address and basic profile, nothing else.',
    ),
    h.p.children(
      "Signed in, the same things your browser saves are also kept with your account, so they follow you to other devices: your pasted chord sheets, Production's key, mode, tempo and lessons done, and the Theory chapters you've read and checks you've passed. They're stored on ",
      link(h, 'https://www.cloudflare.com/privacypolicy/', 'Cloudflare'),
      ', which runs this site, and only you can read or change them through this site.',
    ),
    h.p.children('Nothing is sold, shared for advertising, or used to track you. There are no analytics or ad cookies.'),
    h.h2.children('The daily email'),
    h.p.children(
      "Theory's daily email is off unless you turn it on, signed in. Turning it on keeps your account's email address and a record of which ideas you've been sent, so you don't get the same one twice. Emails are sent through ",
      link(h, 'https://www.cloudflare.com/privacypolicy/', 'Cloudflare'),
      '. Every email has a link to stop them, and turning it off in the book stops them too.',
    ),
    h.h2.children('Deleting your data'),
    h.p.children('To delete your account and everything saved with it, email ', link(h, 'mailto:hi@charliegleason.com', 'hi@charliegleason.com'), '.'),
    SiteFooter(h, { current: 'privacy' }),
  ),
})

export const NotFound = component('NotFound').make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) => h.main.children(Back(h), h.h1.children('Not found'), h.p.children('There’s no page here.'), SiteFooter(h, {})),
})
