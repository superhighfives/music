import { describe, expect, it } from 'vitest'
import { CARDS } from '~/theory/content/book'
import { pickCard, utcDay } from './pick'
import { renderEmail } from './render'

describe('pickCard', () => {
  const cards = [{ key: 'a' }, { key: 'b' }, { key: 'c' }]

  it('sends the first unsent card in reading order', () => {
    expect(pickCard(cards, new Map([['a', 1]]))).toEqual({ card: { key: 'b' }, review: false })
  })

  it('picks up a card added before ones already sent', () => {
    expect(pickCard(cards, new Map([['a', 1], ['c', 2]]))?.card.key).toBe('b')
  })

  it('once every card is sent, reviews the one sent longest ago', () => {
    expect(pickCard(cards, new Map([['a', 5], ['b', 2], ['c', 9]]))).toEqual({ card: { key: 'b' }, review: true })
  })

  it('has nothing to send from an empty book', () => {
    expect(pickCard([], new Map())).toBeNull()
  })
})

describe('renderEmail', () => {
  const card = CARDS[0]
  const email = renderEmail(card, { unsubscribeUrl: 'https://example.com/u?t=x' })

  it('links to the card in its chapter, and to unsubscribe', () => {
    expect(email.html).toContain(`/theory/${card.chapter.id}#card-${card.id}`)
    expect(email.html).toContain('https://example.com/u?t=x')
    expect(email.text).toContain('Stop these emails: https://example.com/u?t=x')
  })

  it('bolds starred words in HTML and drops the stars in text', () => {
    const starred = CARDS.find((c) => c.body.some((p) => p.includes('*')))!
    const e = renderEmail(starred, { unsubscribeUrl: 'u' })
    expect(e.html).toMatch(/<b>[^<]+<\/b>/)
    expect(e.text).not.toContain('*')
  })

  it('marks a card coming round again', () => {
    expect(renderEmail(card, { unsubscribeUrl: 'u', review: true }).text.startsWith('Review · ')).toBe(true)
  })
})

describe('utcDay', () => {
  it('uses the UTC date', () => {
    expect(utcDay(new Date('2026-11-26T23:30:00-05:00'))).toBe('2026-11-27')
  })
})
