// The Worker's bindings, as cloudflare.config.ts declares them. Only the D1 calls this app uses are typed.
declare module 'cloudflare:workers' {
  export const env: { DB: D1Database; CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T>(): Promise<T | null>
  run(): Promise<unknown>
}
