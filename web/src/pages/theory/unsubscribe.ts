import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { unsubscribePage } from '~/theory/email/unsubscribe'

export const ALL: APIRoute = ({ request, url }) => unsubscribePage(request, url, env)
