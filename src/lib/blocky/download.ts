import node_os from "node:os";
import fsPromises from "node:fs/promises";
import fs from "node:fs";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import path from "node:path";
import yauzl from "yauzl";
import * as tar from "tar";
import { __APP_META__ } from "../../constants.ts";

export const BLOCKY_BRANCH = "v0.26.2";

type BlockyArch = "x86_64" | "arm64";

function getBlockyArch(): BlockyArch {
  const arch: string = node_os.arch();
  if (arch === "x64") return "x86_64";
  if (arch === "arm64") return "arm64";
  throw new TypeError(`unsupported architecture '${arch}'`);
}

type BlockyOS = "Linux" | "Windows";

function getBlockyOS(): BlockyOS {
  const os: string = node_os.platform();
  if (os === "linux") return "Linux";
  else if (os === "win32") return "Windows";
  throw new TypeError(`unsupported operating system '${os}'`);
}

type BlockyArchiveExtension = ".tar.gz" | ".zip";

function getArchiveExtension(): BlockyArchiveExtension {
  return getBlockyOS() === "Windows" ? ".zip" : ".tar.gz";
}

function getBlockyDownloadDir(): string {
  return path.join(
    __dirname,
    "../../..",
    __APP_META__.isDev ? "debug" : "data",
    "assets/blocky",
  );
}

export const BLOCKY_ARCH: BlockyArch = getBlockyArch();
export const BLOCKY_OS: BlockyOS = getBlockyOS();
export const BLOCKY_ARCHIVE_EXTENSION: BlockyArchiveExtension =
  getArchiveExtension();
export const BLOCKY_DOWNLOAD_DIR: string = getBlockyDownloadDir();
export const BLOCKY_ARCHIVE_FILE_NAME = `blocky_${BLOCKY_BRANCH}_${BLOCKY_OS}_${BLOCKY_ARCH}${BLOCKY_ARCHIVE_EXTENSION}`;
export const BLOCKY_ARCHIVE_PATH = path.join(
  BLOCKY_DOWNLOAD_DIR,
  `blocky_${BLOCKY_BRANCH}_${BLOCKY_OS}_${BLOCKY_ARCH}${BLOCKY_ARCHIVE_EXTENSION}`,
);
export const BLOCKY_EXECUTABLE_PATH = path.join(
  BLOCKY_DOWNLOAD_DIR,
  "blocky.exe",
);
export const BLOCKY_DOWNLOAD_URL = `https://github.com/0xERR0R/blocky/releases/download/${BLOCKY_BRANCH}/${BLOCKY_ARCHIVE_FILE_NAME}`;

export async function downloadBlocky() {
  if (fs.existsSync(BLOCKY_ARCHIVE_PATH)) return;
  if (!fs.existsSync(BLOCKY_DOWNLOAD_DIR)) {
    // TODO catch
    await fsPromises.mkdir(BLOCKY_DOWNLOAD_DIR, { recursive: true });
  }
  // TODO catch
  const response = await fetch(BLOCKY_DOWNLOAD_URL, {
    headers: {
      DNT: "1", // Do Not Track
      "do-not-track": "1",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      "Sec-GPC": "1", // Global Privacy Control
    },
    redirect: "follow",
    cache: "no-store",
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(
      `Failed to download Blocky archive: ${response.status} ${response.statusText}`,
    );
  }
  if (response.body === null) {
    throw new Error("Failed to download Blocky archive: Response body is null");
  }
  const fileStream = fs.createWriteStream(BLOCKY_ARCHIVE_PATH, {
    flags: "wx",
  });
  await finished(Readable.fromWeb(response.body).pipe(fileStream));
}

export async function blockyExecutableExists(): Promise<boolean> {
  try {
    await fsPromises.access(BLOCKY_EXECUTABLE_PATH, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function extractBlockyExecutable(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      fs.accessSync(BLOCKY_EXECUTABLE_PATH, fs.constants.F_OK);
      resolve();
      return;
    } catch {
      console.log("Blocky executable does not exist, extracting...");
      // noop
    }
    if (BLOCKY_ARCHIVE_EXTENSION === ".zip") {
      console.log("Extracting Blocky executable from zip archive...");
      yauzl.open(BLOCKY_ARCHIVE_PATH, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err);
          console.log("Error opening zip file:", err);
          return;
        }
        zipfile.readEntry(); // read first entry
        // entry event
        zipfile.on("entry", (entry) => {
          if (entry.fileName !== "blocky.exe") {
            zipfile.readEntry(); // read next entry, event recursively calls triggers itself
            return;
          }
          zipfile.openReadStream(entry, (err, readStream) => {
            // read file content of the entry
            if (err) {
              reject(err);
              console.log("Error reading entry from zip file:", err);
              return;
            }
            const writeStream = fs.createWriteStream(BLOCKY_EXECUTABLE_PATH, {
              flags: "wx",
            });
            readStream.pipe(writeStream);
            writeStream.on("finish", () => {
              writeStream.close();
              console.log("Blocky executable extracted successfully.");
              resolve();
            });
            writeStream.on("error", (writeErr) => {
              writeStream.close();
              console.log("Error writing Blocky executable to disk:", writeErr);
              reject(writeErr);
            });
          });
        });
        zipfile.once("end", () => {
          zipfile.close();
          console.log(
            "Finished extracting Blocky executable from zip archive.",
          );
          resolve();
        });
        zipfile.once("error", (zipErr) => {
          zipfile.close(); // close event may still be emitted
          reject(zipErr);
          console.log("Error during zip extraction:", zipErr);
        });
      });
    } else {
      tar.extract(
        {
          file: BLOCKY_ARCHIVE_PATH,
          cwd: BLOCKY_DOWNLOAD_DIR,
          strip: 1, // Remove the first directory level
        },
        [],
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        },
      );
    }
  });
}
