import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { unsubscribe } from '~/theory/email/daily'

export const ALL: APIRoute = ({ request, url }) => unsubscribePage(request, url)

/**
 * The daily email's unsubscribe link. Opening it shows a button, so a mail scanner following links
 * can't unsubscribe anyone; the button, and mail apps' one-click unsubscribe, POST here.
 */
async function unsubscribePage(request: Request, url: URL): Promise<Response> {
  const token = url.searchParams.get('t') ?? ''
  const page = (body: string, status = 200) =>
    new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Daily email · Theory</title><style>body{margin:0;font:18px/1.6 Georgia,serif;background:#f6f1e9;color:#221c17}main{max-width:32rem;margin:15vh auto;padding:0 16px}button{font:600 15px -apple-system,sans-serif;padding:11px 18px;border:0;border-radius:8px;background:#b4532a;color:#fff;cursor:pointer}a{color:#b4532a}@media(prefers-color-scheme:dark){body{background:#1b1714;color:#efe7dc}}</style></head><body><main>${body}</main></body></html>`,
      { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  if (!token) return page('<p>This unsubscribe link is missing its code. Turn the email off from <a href="/theory">the book</a> instead.</p>', 400)
  if (request.method === 'POST') {
    const ok = await unsubscribe(env, token)
    return ok
      ? page('<h1>Unsubscribed</h1><p>No more daily emails. You can turn them back on from <a href="/theory">the book</a>.</p>')
      : page('<p>That link doesn’t match a subscription. It may already be off; check from <a href="/theory">the book</a>.</p>', 404)
  }
  return page(
    `<h1>Stop the daily email?</h1><p>You’ll stop getting one idea a day from the book.</p><form method="post"><button type="submit">Unsubscribe</button></form>`,
  )
}

