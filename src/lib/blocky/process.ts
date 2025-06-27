import { spawn as spawnChild, type ChildProcess } from "node:child_process";
import { BLOCKY_EXECUTABLE_PATH, blockyExecutableExists } from "./download.ts";

interface BlockyCLIFlags {
  host: string;
  port: number;
  strictPort: boolean;
  config: string;
}

let BLOCKY_CHILD_PROCESS: ChildProcess | null = null;
let BLOCKY_PROCESS_FLAGS: Readonly<BlockyCLIFlags> | null = null;

export { BLOCKY_EXECUTABLE_PATH } from "./download.ts";

const Signals = Object.freeze({
  softKill: "SIGTERM",
  hardKill: "SIGKILL",
});

const Errors = Object.freeze({
  noSuchProcess: "ESRCH",
});

export function spawn({
  host,
  port,
  strictPort,
  config,
}: BlockyCLIFlags): void {
  if (!blockyExecutableExists()) {
    throw Error(
      "Blocky executable does not exist, make sure to download it first",
    );
  }

  host = host || "127.0.0.1";
  port = port || 4000;
  strictPort = strictPort || false;
  config = config || "";

  if (port < 1024) throw RangeError("Port is less than 1024");
  if (port > 65535) throw RangeError("Port is more than 65535");

  if (isRunning()) {
    throw Error("Blocky is already running");
  }

  // New object for control safety
  BLOCKY_PROCESS_FLAGS = Object.freeze({
    host,
    port,
    strictPort,
    config,
  });

  const args = ["--apiHost", host, "--apiPort", port.toString()];

  if (config) {
    args.push("--config", config);
  }

  BLOCKY_CHILD_PROCESS = spawnChild(BLOCKY_EXECUTABLE_PATH, args, {
    stdio: "inherit",
  });

  BLOCKY_CHILD_PROCESS.on("exit", (code, signal) => {
    console.log(`Blocky process exited with code ${code} and signal ${signal}`);
    BLOCKY_CHILD_PROCESS = null; // Reset the PID when the process exits
  });
  BLOCKY_CHILD_PROCESS.on("error", (err) => {
    console.error("Error spawning Blocky process:", err);
    BLOCKY_CHILD_PROCESS = null; // Reset the PID on error
  });
  BLOCKY_CHILD_PROCESS.on("close", (err) => {
    console.error("Blocky process closed unexpectedly:", err);
    BLOCKY_CHILD_PROCESS = null; // Reset the PID on close
  });

  console.log(`Blocky started with PID ${BLOCKY_CHILD_PROCESS.pid}`);
}

export function stop() {
  if (!isRunning()) {
    console.warn("Blocky is not running, nothing to stop");
    return;
  }

  if (BLOCKY_CHILD_PROCESS === null) {
    console.error("Blocky child process is null, cannot stop");
    return;
  }

  const { kill: sendSignal } = BLOCKY_CHILD_PROCESS;

  try {
    sendSignal(Signals.softKill);
    console.log(`Blocky process with PID ${BLOCKY_CHILD_PROCESS!.pid} stopped`);
  } catch (err) {
    console.error("Error stopping Blocky process:", err);
  } finally {
    BLOCKY_CHILD_PROCESS = null; // Reset the PID after stopping
  }
  console.log("Blocky process stopped successfully");
}

export function kill() {
  if (!isRunning()) {
    console.warn("Blocky is not running, nothing to kill");
    return;
  }
  if (BLOCKY_CHILD_PROCESS === null) {
    console.error("Blocky child process is null, cannot kill");
    return;
  }
  const { kill: sendSignal } = BLOCKY_CHILD_PROCESS;
  try {
    sendSignal(Signals.hardKill);
    console.log(`Blocky process with PID ${BLOCKY_CHILD_PROCESS!.pid} killed`);
  } catch (err) {
    console.error("Error killing Blocky process:", err);
  } finally {
    BLOCKY_CHILD_PROCESS = null; // Reset the PID after killing
  }
  console.log("Blocky process killed successfully");
}

export function isRunning(): boolean {
  if (BLOCKY_CHILD_PROCESS === null) return false;
  const { kill: sendSignal } = BLOCKY_CHILD_PROCESS;
  try {
    sendSignal(0);
    return true;
  } catch (err) {
    // @ts-ignore
    if (err.code === Errors.noSuchProcess) {
      // ESRCH: No such process
      BLOCKY_CHILD_PROCESS = null;
      return false;
    }
    throw err;
  }
}

export function getPID(): number | null {
  return BLOCKY_CHILD_PROCESS?.pid || null;
}

export function getFlags(): Readonly<BlockyCLIFlags> | null {
  if (BLOCKY_CHILD_PROCESS === null || !isRunning()) return null;
  return BLOCKY_PROCESS_FLAGS;
}
