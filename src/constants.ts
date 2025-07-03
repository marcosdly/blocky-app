/** non-vite environment debugging */
export const __APP_META__ = {
  isDev: true,
  isProd: false,
} as const;

export const apiHTTP = Object.freeze({
  host: "localhost",
  port: 4000,
});
