import { EqChart, Rack, SignalMap, VocoderFlow } from '~/production/components/diagrams'
import Arrangement from './Arrangement.astro'
import Cell from './Cell.astro'
import KeyBox from './KeyBox.astro'
import Note from './Note.astro'
import Row from './Row.astro'
import Sheet from './Sheet.astro'
import Steps from './Steps.astro'
import Task from './Task.astro'
import V from './V.astro'

/** What lessons and recipes are written with. Their MDX uses these by name, with no imports. */
export const components = { Arrangement, Cell, EqChart, KeyBox, Note, Rack, Row, Sheet, SignalMap, Steps, Task, V, VocoderFlow }
