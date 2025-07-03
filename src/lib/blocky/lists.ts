import { apiHTTP } from "../../constants";

export default Object.freeze({
  async refresh(): Promise<void> {
    const res = await fetch(
      `http://${apiHTTP.host}:${apiHTTP.port}/api/lists/refresh`,
      { method: "POST" },
    );
    if (res.status === 500) {
      const text = await res.text();
      throw new Error(`Failed to refresh lists: ${text}`);
    }
    if (!res.ok) {
      throw new Error(`Failed to refresh lists: ${res.statusText}`);
    }
  },
});
