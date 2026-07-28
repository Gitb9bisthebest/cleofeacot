import { defineConfig } from 'vite';

// Respect an externally assigned port (e.g. PORT from a preview harness);
// fall back to vite's default 5173 for plain `npm run dev`.
export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
});
