import { BrowserHost } from '@effect/ui/html'
import { Effect, Layer } from 'effect'
import { Rhythm } from './Rhythm.ts'

const Main = BrowserHost.mount(Rhythm, { rhythm: 'q q e e q', beats: 4, bpm: 84 }, document.getElementById('root')!)

Layer.launch(Main).pipe(Effect.runFork)
