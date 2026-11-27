// The Worker's bindings come from alchemy.run.ts. Alchemy names D1Database and SendEmail; only the calls this app uses are typed below.
declare module 'cloudflare:workers' {
  export const env: import('../alchemy.run.ts').WebsiteEnv
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
