import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const roots = [".open-next/assets"];
let removed = 0;

for (const root of roots) {
  stripLocalMedia(root);
}

console.log(`strip-local-media: removed ${removed} local media director${removed === 1 ? "y" : "ies"}`);

function stripLocalMedia(path) {
  if (!existsSync(path)) return;
  const stat = statSync(path);
  if (!stat.isDirectory()) return;

  if (basename(path) === "local-media") {
    rmSync(path, { recursive: true, force: true });
    removed += 1;
    return;
  }

  for (const entry of readdirSync(path)) {
    stripLocalMedia(join(path, entry));
  }
}
