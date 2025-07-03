import { apiHTTP } from "../../constants.ts";

export default Object.freeze({
  async flush(): Promise<void> {
    const res = await fetch(
      `http://${apiHTTP.host}:${apiHTTP.port}/api/cache/flush`,
      { method: "POST" },
    );
    if (!res.ok) {
      throw new Error(`Failed to flush cache: ${res.statusText}`);
    }
  },
});
