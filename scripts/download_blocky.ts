import * as dl from "../src/lib/blocky/download.ts";

(async () => {
  if (await dl.blockyExecutableExists()) return;
  await dl.downloadBlocky();
  await dl.extractBlockyExecutable();
  console.log("Blocky executable downloaded and extracted successfully.");
})();
