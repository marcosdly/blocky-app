import { exec } from "child_process";
import { promisify } from "util";
import { BLOCKY_EXECUTABLE_PATH } from "./download.ts";

const execAsync = promisify(exec);

export interface VersionStruct {
  major: number;
  minor: number;
  patch: number;
}

export default Object.freeze({
  async string(): Promise<string> {
    let stdout: string;
    try {
      stdout = (await execAsync(`${BLOCKY_EXECUTABLE_PATH} version`)).stdout;
      for (const line of stdout.split("\n")) {
        if (line.startsWith("Version")) {
          return line.slice("Version: ".length).trim();
        }
      }
      throw new Error("Version not found in output");
    } catch (error) {
      throw new Error(`Failed to get version: ${(error as Error).message}`);
    }
  },

  async struct(): Promise<VersionStruct> {
    const versionString = await this.string();
    const [major, minor, patch] = versionString
      .replace(/^v+/, "") // Remove leading 'v' if present
      .split(".")
      .map(Number);
    if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
      throw new Error("Invalid version format");
    }
    return { major, minor, patch } as VersionStruct;
  },
});
