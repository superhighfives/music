import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "chords",
		compatibilityDate: "2026-11-23",
		entrypoint: "@tanstack/react-start/server-entry",
		domains: ["chords.charliegleason.com"],
		observability: {
			enabled: true,
		},
	},
});
