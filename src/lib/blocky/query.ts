import { apiHTTP } from "../../constants.js";

interface QueryResponse {
  /** blocky reason for resolution */
  reason: string;
  /** actual DNS response */
  response: string;
  /** response type (CACHED, BLOCKED, ...) */
  responseType: string;
  /** DNS return code (NOERROR, NXDOMAIN, ...) */
  returnCode: string;
}

interface QueryParams {
  /** query for DNS request */
  query: string;
  /** request type (A, AAAA, ...) */
  type: string;
}

export default Object.freeze({
  async query(queryParams: QueryParams): Promise<QueryResponse> {
    const res = await fetch(
      `http://${apiHTTP.host}:${apiHTTP.port}/api/query`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryParams),
      },
    );
    if (res.status === 400) {
      const text = await res.text();
      throw new Error(`Invalid query: ${text}`);
    }
    if (!res.ok) {
      throw new Error(`Failed to query DNS: ${res.statusText}`);
    }
    return await res.json();
  },
});
