import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "music",
		compatibilityDate: "2026-11-23",
		entrypoint: "./src/server.ts",
		// chords and sounds moved here from their own subdomains. src/server.ts sends those on, with their saved data.
		domains: ["music.charliegleason.com", "chords.charliegleason.com", "sounds.charliegleason.com"],
		observability: {
			enabled: true,
		},
	},
});
