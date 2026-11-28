import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { savedApi } from '~/account/api'

export const ALL: APIRoute = ({ request, locals }) => savedApi(request, env.DB, locals.auth().userId ?? null)
