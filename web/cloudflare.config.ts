import { bindings, defineConfig, triggers } from "cf/config";

export default defineConfig({
	worker: {
		name: "music",
		compatibilityDate: "2026-11-23",
		entrypoint: "./src/server.ts",
		// Clerk's server SDK uses Node.js APIs.
		compatibilityFlags: ["nodejs_compat"],
		domains: ["music.charliegleason.com"],
		env: {
			// What signed-in people save. Tables are in migrations/.
			DB: bindings.d1({ id: "517b7f2f-2e66-4d48-938a-ed41db5eb64c", name: "music" }),
			// Clerk's keys: .dev.vars locally, Worker secrets in production.
			CLERK_SECRET_KEY: bindings.secret(),
			CLERK_PUBLISHABLE_KEY: bindings.secret(),
			// The theory book's daily email (src/theory/email/). charliegleason.com must be onboarded to Email Service.
			EMAIL: bindings.sendEmail({ allowedSenderAddresses: ["theory@charliegleason.com"] }),
		},
		// The theory book's daily email goes out at 07:00 UTC. Later runs that day retry anyone a failure
		// skipped; nobody gets two, because each person's last send day is recorded.
		triggers: [triggers.scheduled({ schedule: "0 7-23 * * *" })],
		observability: {
			enabled: true,
		},
	},
});
