// The Worker's bindings, as cloudflare.config.ts declares them. Only the D1 and email calls this app uses are typed.
declare module 'cloudflare:workers' {
  export const env: { DB: D1Database; EMAIL: SendEmail; CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T>(): Promise<T | null>
  all<T>(): Promise<{ results: T[] }>
  run(): Promise<{ meta: { changes: number } }>
}

/** Cloudflare Email Service's send binding. */
interface SendEmail {
  send(message: {
    to: string | string[]
    from: string | { email: string; name: string }
    subject: string
    html?: string
    text?: string
    headers?: Record<string, string>
  }): Promise<{ messageId: string }>
}
