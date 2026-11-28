import { Mount, UiSchema } from '@effect/ui'
import { Html } from '@effect/ui/html'
import { Effect, Schema, Stream } from 'effect'
import { render } from '../content/render'
import { OpenSignIn, absurd } from '../islands/auth'
import { ToggleTheme } from '../islands/theme'
import { SiteFooter, mastheadIslands } from '../islands/views'
import type { Section } from '../site-links'
import { AbletonPage, ART, HomePage, NotFoundPage, PrivacyPage, ToolsPage } from './content'

const Page = Schema.Literals(['home', 'ableton', 'tools', 'privacy', 'not-found'])
export type Page = typeof Page.Type

export const SiteProps = Schema.Struct({ page: Page, userId: Schema.NullOr(Schema.String) })
export type SiteProps = typeof SiteProps.Type

export const SiteMessage = UiSchema.TaggedEnum({ ClickedThemeToggle: {}, ClickedSignIn: {} })
export type SiteMessage = typeof SiteMessage.Type

const isMessage = Schema.is(SiteMessage)

type Art = (typeof ART)[number]

/**
 * A card's art: Paper's dithered warp shader, drawn into the tile once the page runs. The shader code loads
 * only here, so the other pages never fetch it. It stays still while the visitor asks for reduced motion,
 * and follows that setting as it changes.
 */
const DitherArt = Mount.makeStream('DitherArt', { args: { index: Schema.Number } }, (node: HTMLElement, { index }) =>
  Stream.callback<never>(
    Effect.fnUntraced(function* () {
      const art: Art | undefined = ART[index]
      if (!art) return
      const paper = yield* Effect.promise(() => import('@paper-design/shaders'))
      const motion = matchMedia('(prefers-reduced-motion: reduce)')
      const speed = () => (motion.matches ? 0 : art.speed)
      const sizing = paper.defaultPatternSizing
      const shader = yield* Effect.acquireRelease(
        Effect.sync(
          () =>
            new paper.ShaderMount(
              node,
              paper.ditheringFragmentShader,
              {
                u_colorBack: paper.getShaderColorFromString(art.back),
                u_colorFront: paper.getShaderColorFromString(art.front),
                u_shape: paper.DitheringShapes.warp,
                u_type: paper.DitheringTypes[art.type],
                u_pxSize: art.size,
                u_fit: paper.ShaderFitOptions[sizing.fit],
                u_scale: art.scale,
                u_rotation: art.rotation,
                u_offsetX: sizing.offsetX,
                u_offsetY: sizing.offsetY,
                u_originX: sizing.originX,
                u_originY: sizing.originY,
                u_worldWidth: sizing.worldWidth,
                u_worldHeight: sizing.worldHeight,
              },
              undefined,
              speed(),
            ),
        ),
        (s) => Effect.sync(() => s.dispose()),
      )
      const onChange = () => shader.setSpeed(speed())
      yield* Effect.acquireRelease(
        Effect.sync(() => motion.addEventListener('change', onChange)),
        () => Effect.sync(() => motion.removeEventListener('change', onChange)),
      )
    }),
  ),
)

/** Each page's content, its accent (`data-section`, see site.css), and its place in the footer. Not found has no footer. */
const PAGES: Record<Page, { content: typeof HomePage; section?: string; footer?: Section | 'none' }> = {
  home: { content: HomePage, footer: 'home' },
  ableton: { content: AbletonPage, section: 'ableton', footer: 'ableton' },
  tools: { content: ToolsPage, section: 'tools', footer: 'tools' },
  privacy: { content: PrivacyPage, footer: 'privacy' },
  'not-found': { content: NotFoundPage, footer: 'none' },
}

/** Home, Extensions, Tools, Privacy and not found: one component, since all they do is the masthead's. */
export const Site = Html.component({ name: 'Site', props: SiteProps, model: Schema.Struct({}), message: SiteMessage }).make({
  init: () => ({}),
  update: ($, message) =>
    SiteMessage.match(message, {
      ClickedThemeToggle: () => $.set($.model).run(ToggleTheme.make({})),
      ClickedSignIn: () => $.set($.model).run(OpenSignIn.make({})),
    }),
  view: (h) => {
    const { content, section, footer } = PAGES[h.props.page]
    const islands = {
      ...mastheadIslands(h, { userId: h.props.userId, theme: SiteMessage.ClickedThemeToggle(), signIn: SiteMessage.ClickedSignIn() }),
      Art: (_: unknown, props: Readonly<Record<string, unknown>>) =>
        h.div.class('art').onMount(DitherArt({ index: Number(props.index) }).pipe(Mount.map(absurd))),
    }
    return h.div
      .class('page')
      .attr('data-section', section)
      .children(...render(h, content(), islands, isMessage), footer === 'none' ? false : SiteFooter(h, footer ? { current: footer } : {}))
  },
})
