import { describe, expect, it } from 'vitest'
import { mergeSheets, parseSheets } from './sheets'

const sheet = (id: string, text: string) => ({ id, title: id, text })

describe('mergeSheets', () => {
  it("keeps the account's songs and adds this browser's new ones", () => {
    expect(mergeSheets([sheet('b', 'B'), sheet('c', 'C')], [sheet('a', 'A'), sheet('b', 'B')])).toEqual([
      sheet('a', 'A'),
      sheet('b', 'B'),
      sheet('c', 'C'),
    ])
  })

  it('treats the same sheet pasted on two devices as one song', () => {
    expect(mergeSheets([sheet('local', 'same')], [sheet('account', 'same')])).toEqual([sheet('account', 'same')])
  })
})

describe('parseSheets', () => {
  it('drops anything that is not a saved sheet', () => {
    expect(parseSheets([sheet('a', 'A'), { id: 1 }, null])).toEqual([sheet('a', 'A')])
    expect(parseSheets({ id: 'a' })).toBeNull()
  })
})
