import { derived, type Derived } from '~/production/lib/music'
import { useSaved } from './store'

/** One value that follows the key and tempo in the masthead, such as a delay time. */
export default function Value({ k }: { k: keyof Derived }) {
  return <>{derived(useSaved().settings)[k]}</>
}
