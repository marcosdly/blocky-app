import { apiHTTP } from "../../constants.ts";

interface DisableCondition {
  /** Duration in seconds for which blocking should be disabled */
  duration?: number;
  /** Specific groups to disable blocking for */
  groups?: string[];
  /** If true, disables blocking for all groups */
  allGroups?: boolean;
}

export default Object.freeze({
  async status(): Promise<boolean> {
    try {
      return await fetch(
        `http://${apiHTTP.host}:${apiHTTP.port}/api/blocking/status`,
        { method: "GET" },
      )
        .then((res) => res.json())
        .then((data) => data.enabled as boolean);
    } catch (err) {
      console.error(
        `Failed to check blocking status: ${(err as Error).message}`,
      );
      throw err;
    }
  },

  async enable(): Promise<void> {
    const res = await fetch(
      `http://${apiHTTP.host}:${apiHTTP.port}/api/blocking/enable`,
      { method: "GET" },
    );
    if (!res.ok) {
      throw new Error(`Failed to enable blocking: ${res.statusText}`);
    }
  },

  async disable(condition: DisableCondition): Promise<void> {
    const url = new URL(
      `http://${apiHTTP.host}:${apiHTTP.port}/api/blocking/disable`,
    );
    if (condition.duration) {
      url.searchParams.append("duration", condition.duration.toString() + "s");
    }
    if (condition.allGroups) {
      // If empty, disable for all groups
      url.searchParams.append("groups", "");
    } else if (condition.groups && condition.groups.length > 0) {
      url.searchParams.append("groups", condition.groups.join(","));
    }
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Failed to disable blocking: ${res.statusText}`);
    }
  },
});
