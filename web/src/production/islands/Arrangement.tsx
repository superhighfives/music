import { ArrangementView } from '~/production/components/diagrams'
import { useSaved } from './store'

export default function Arrangement() {
  return <ArrangementView settings={useSaved().settings} />
}
