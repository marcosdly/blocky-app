import { exec } from "node:child_process";
import { promisify } from "node:util";
import { BLOCKY_EXECUTABLE_PATH } from "./download.ts";

export interface GlobalCLIFlags {
  host?: string;
  port?: number;
  config?: string;
}

const execAsync = promisify(exec);

export async function blockyCLIExec(
  args: string[],
  { host, port, config }: GlobalCLIFlags,
): Promise<{ stdout: string; stderr: string }> {
  if (!host) host = "localhost";
  if (!port) port = 4000;
  if (!config) config = "";
  const cmd = [
    BLOCKY_EXECUTABLE_PATH,
    "--apiHost",
    host,
    "--apiPort",
    port.toString(),
  ];
  if (config) {
    cmd.push("--config", config);
  }
  cmd.concat(args);
  try {
    return await execAsync(cmd.join(" "));
  } catch (error) {
    throw new Error(
      `Failed to execute Blocky CLI command: ${(error as Error).message}`,
    );
  }
}
