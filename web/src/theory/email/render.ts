import { BOOK_SUBTITLE, BOOK_TITLE, type BookCard, chapterNumber } from '~/theory/content/book'

export const SITE = 'https://music.charliegleason.com'

const KIND_LABEL: Record<BookCard['kind'], string> = { concept: 'Concept', pattern: 'Pattern', tip: 'Tip', listen: 'Listen for' }

export type Email = { subject: string; html: string; text: string }

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A card paragraph as HTML: `*word*` is bold. */
const paragraphHtml = (t: string) => escape(t).replace(/\*([^*]+)\*/g, '<b>$1</b>')

/**
 * One day's email: a card, a link to its chapter, and the unsubscribe link. `review` marks a card
 * coming round a second time. Plain tables and inline styles, since that's what email clients render.
 */
export function renderEmail(card: BookCard, { unsubscribeUrl, review = false }: { unsubscribeUrl: string; review?: boolean }): Email {
  const chapterUrl = `${SITE}/theory/${card.chapter.id}#card-${card.id}`
  const n = chapterNumber(card.chapter)
  const kicker = `${review ? 'Review · ' : ''}${KIND_LABEL[card.kind]} · Chapter ${n}, ${card.chapter.title}`
  const subject = `${card.title} · ${BOOK_TITLE}`

  const text = [
    kicker,
    '',
    card.title,
    '',
    ...card.body.map((p) => p.replace(/\*([^*]+)\*/g, '$1')).flatMap((p) => [p, '']),
    `Read the chapter: ${chapterUrl}`,
    '',
    '—',
    `${BOOK_TITLE}: ${BOOK_SUBTITLE}. One idea a day from the book.`,
    `Stop these emails: ${unsubscribeUrl}`,
  ].join('\n')

  const font = "Georgia, 'Times New Roman', serif"
  const ui = "-apple-system, 'Helvetica Neue', Arial, sans-serif"
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f1e9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e9;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px 16px;font:600 13px/1.4 ${ui};letter-spacing:0.08em;text-transform:uppercase;color:#7a6f64;">${escape(BOOK_TITLE)} · daily</td></tr>
<tr><td style="background:#fffdf9;border:1px solid #e6ddd0;border-radius:14px;padding:28px 28px 24px;">
<p style="margin:0 0 10px;font:600 12px/1.4 ${ui};letter-spacing:0.08em;text-transform:uppercase;color:#b4532a;">${escape(kicker)}</p>
<h1 style="margin:0 0 16px;font:600 26px/1.25 ${font};color:#221c17;">${escape(card.title)}</h1>
${card.body.map((p) => `<p style="margin:0 0 14px;font:400 18px/1.6 ${font};color:#3a3129;">${paragraphHtml(p)}</p>`).join('\n')}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:10px;"><tr><td style="background:#b4532a;border-radius:8px;">
<a href="${escape(chapterUrl)}" style="display:inline-block;padding:11px 18px;font:600 15px/1 ${ui};color:#ffffff;text-decoration:none;">Read chapter ${n} →</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:18px 4px 0;font:400 13px/1.6 ${ui};color:#7a6f64;">
${escape(BOOK_TITLE)}: ${escape(BOOK_SUBTITLE)}. One idea a day from the book, in reading order.<br>
<a href="${escape(unsubscribeUrl)}" style="color:#7a6f64;">Stop these emails</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, html, text }
}
