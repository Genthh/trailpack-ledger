import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { scanSecrets } from "./secret-scan.mjs";

const inventory = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
);
const files = new Map();
for (const file of inventory.split("\0").filter(Boolean)) {
  if (file.endsWith(".woff2")) {
    const font = readFileSync(file);
    assert.equal(font.toString("ascii", 0, 4), "wOF2", "Invalid font: " + file);
    assert.equal(font.readUInt32BE(8), font.length, "Incomplete font: " + file);
    continue;
  }
  const source = readFileSync(file, "utf8");
  files.set(file, source);
  const lines = source.split("\n").length - Number(source.endsWith("\n"));
  assert.ok(lines <= 600, file + " exceeds 600 physical lines");
  if (/\.(?:c|m)?js$/.test(file))
    execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}
const findings = scanSecrets(files);
assert.equal(findings.length, 0, findings.join("\n"));
const entry = readFileSync("public/index.html", "utf8");
assert.match(entry, /<main\b/);
assert.match(entry, /<h1\b/);
for (const match of entry.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  const ref = match[1];
  if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue;
  const file = path.resolve("public", ref.split(/[?#]/)[0].replace(/^\//, ""));
  assert.ok(
    file.startsWith(path.resolve("public") + path.sep) &&
      statSync(file).isFile(),
    "Invalid local reference: " + ref,
  );
}
execFileSync(process.execPath, ["--test", "test/model.test.cjs"], {
  stdio: "inherit",
});
console.log("Verified source files and application model.");
