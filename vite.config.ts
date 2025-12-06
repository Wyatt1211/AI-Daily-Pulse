import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Strictly use the environment variable. Do NOT fallback to a hardcoded string.
  const apiKey = env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in the browser after build
      // It will be replaced by the actual value from Vercel/System environment
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});