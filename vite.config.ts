import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const isProd = mode === "production";

  return {
    plugins: [preact()],
    define: {
      __APP_META__: JSON.stringify({
        isDev,
        isProd,
      }),
    },
  };
});
