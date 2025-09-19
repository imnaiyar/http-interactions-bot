import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tsConfigPath from 'vite-tsconfig-paths';
export default defineConfig({
	plugins: [cloudflare(), tsConfigPath()],
	server: {
		allowedHosts: ['.ngrok-free.app', '.discord.com', '.discordapp.com', 'discord.com'],
	},
	build: {
		target: 'esnext', // Workers run modern V8
		outDir: 'dist',
		lib: {
			entry: 'src/index.ts',
			formats: ['es'], // must be ESM
		},
		rollupOptions: {
			external: ['zlib-sync'],
		},
		minify: true,
	},
});
