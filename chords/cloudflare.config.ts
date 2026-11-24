import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "movechords",
		compatibilityDate: "2026-11-23",
		entrypoint: "@tanstack/react-start/server-entry",
		domains: ["movechords.charliegleason.com"],
		observability: {
			enabled: true,
		},
	},
});
