import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { emailApi } from '~/theory/email/api'

export const ALL: APIRoute = ({ request, locals, url }) => emailApi(request, env, url.pathname, locals.auth().userId ?? null)
