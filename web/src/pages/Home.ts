import { Mount, UiSchema } from '@effect/ui'
import { Html } from '@effect/ui/html'
import { DitheringShapes, DitheringTypes, ShaderFitOptions, ShaderMount, defaultPatternSizing, ditheringFragmentShader, getShaderColorFromString } from '@paper-design/shaders'
import { Effect, Schema, Stream } from 'effect'
import { OpenSignIn, ShowUserButton, absurd } from '../islands/auth'
import { SiteFooter } from '../islands/views'

export const HomeProps = Schema.Struct({ userId: Schema.NullOr(Schema.String) })
export type HomeProps = typeof HomeProps.Type

export const HomeMessage = UiSchema.TaggedEnum({ ClickedSignIn: {} })
export type HomeMessage = typeof HomeMessage.Type

const Art = Schema.Struct({
  type: Schema.Literals(['2x2', '4x4', '8x8', 'random']),
  back: Schema.String,
  front: Schema.String,
  size: Schema.Number,
  scale: Schema.Number,
  rotation: Schema.Number,
  speed: Schema.Number,
})
type Art = typeof Art.Type

/**
 * A card's art: Paper's dithered warp shader, drawn into the tile once the page runs. It stays still while
 * the visitor asks for reduced motion, and follows that setting as it changes.
 */
const DitherArt = Mount.makeStream('DitherArt', { args: { art: Art } }, (node: HTMLElement, { art }) =>
  Stream.callback<never>(
    Effect.fnUntraced(function* () {
      const motion = matchMedia('(prefers-reduced-motion: reduce)')
      const speed = () => (motion.matches ? 0 : art.speed)
      const shader = yield* Effect.acquireRelease(
        Effect.sync(
          () =>
            new ShaderMount(node, ditheringFragmentShader, {
              u_colorBack: getShaderColorFromString(art.back),
              u_colorFront: getShaderColorFromString(art.front),
              u_shape: DitheringShapes.warp,
              u_type: DitheringTypes[art.type],
              u_pxSize: art.size,
              u_fit: ShaderFitOptions[defaultPatternSizing.fit],
              u_scale: art.scale,
              u_rotation: art.rotation,
              u_offsetX: defaultPatternSizing.offsetX,
              u_offsetY: defaultPatternSizing.offsetY,
              u_originX: defaultPatternSizing.originX,
              u_originY: defaultPatternSizing.originY,
              u_worldWidth: defaultPatternSizing.worldWidth,
              u_worldHeight: defaultPatternSizing.worldHeight,
            }, undefined, speed()),
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

// Each card's art is the same dithered warp in its section's colours, as hex: the shaders don't read oklch.
const CARDS: ReadonlyArray<{ href: string; title: string; about: string; art: Art }> = [
  {
    href: '/chords',
    title: 'Chords',
    about: 'Chord shapes on the Ableton Move pad grid, in any key, scale and layout. Learn, play along with songs, and practise to a playhead.',
    art: { type: '2x2', back: '#0b1517', front: '#00d6d7', size: 2, scale: 1.4, rotation: 0, speed: 0.6 },
  },
  {
    href: '/production',
    title: 'Production',
    about: 'A step-by-step course in music production with Ableton Live 12: sound, soundscapes, melody, songwriting, drums and mixing.',
    art: { type: '4x4', back: '#141a24', front: '#f7cd3a', size: 1.5, scale: 1.2, rotation: 90, speed: 0.4 },
  },
  {
    href: '/theory',
    title: 'Theory',
    about:
      'An illustrated music theory book you can play, from the first note to advanced harmony: reading music, scales, chords and theory for songwriting. One idea a day by email, if you like.',
    art: { type: '8x8', back: '#fbf6ee', front: '#bb4d2a', size: 1.5, scale: 1.6, rotation: 180, speed: 0.3 },
  },
  {
    href: '/ableton',
    title: 'Extensions',
    about: 'Right-click tools for Live 12 that write chords, progressions and ambient soundscapes into your Set.',
    art: { type: 'random', back: '#141414', front: '#70b1ed', size: 1.5, scale: 1.3, rotation: 270, speed: 0.5 },
  },
  {
    href: '/tools',
    title: 'Tools',
    about: 'The whole studio, from Live and a field recorder to Melodyne, RX and Ozone, with exercises to learn each tool and links to Production lessons.',
    art: { type: '2x2', back: '#101a12', front: '#7fd18b', size: 1.5, scale: 1.5, rotation: 45, speed: 0.35 },
  },
]

// Plain links between sections: each loads its own styles, so a full page load keeps them apart.
export const Home = Html.component({ name: 'Home', props: HomeProps, model: Schema.Struct({}), message: HomeMessage }).make({
  init: () => ({}),
  update: ($, message) => HomeMessage.match(message, { ClickedSignIn: () => $.set($.model).run(OpenSignIn.make({})) }),
  view: (h) =>
    h.main.children(
      h.div.class('account').children(
        h.props.userId === null
          ? h.button.attr('type', 'button').class('signin').on('click', HomeMessage.ClickedSignIn()).children('Sign in')
          : h.div.onMount(ShowUserButton().pipe(Mount.map(absurd))),
      ),
      h.h1.children('music'),
      h.p.children('Tools and theory for making music, with Ableton Live and Move.'),
      h.ul.class('cards').children(
        CARDS.map((c) =>
          h.li.key(c.href).children(
            h.a.class('card art-card').attr('href', c.href).children(
              h.div.class('art').onMount(DitherArt({ art: c.art }).pipe(Mount.map(absurd))),
              h.div.children(h.h3.children(c.title), h.p.children(c.about)),
            ),
          ),
        ),
      ),
      SiteFooter(h, { current: 'home' }),
    ),
})
