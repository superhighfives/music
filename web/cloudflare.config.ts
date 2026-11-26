import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "music",
		compatibilityDate: "2026-11-23",
		entrypoint: "./src/server.ts",
		domains: ["music.charliegleason.com"],
		observability: {
			enabled: true,
		},
	},
});
