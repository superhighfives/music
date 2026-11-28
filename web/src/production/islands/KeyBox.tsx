import { KeyBoxView } from '~/production/components/KeyBoxView'
import { useSaved } from './store'

export default function KeyBox() {
  return <KeyBoxView settings={useSaved().settings} />
}
