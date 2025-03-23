import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const newVersion = process.argv[process.argv.length - 1];
const fileName = resolve(import.meta.dirname, "package.json");

if (
  !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(
    newVersion
  )
) {
  throw new Error(
    `New version does not match semver regex! Got "${newVersion}".`
  );
}

/** @type import("./package.json") */
const pkg = JSON.parse(new TextDecoder().decode(readFileSync(fileName)));

if (pkg.version === newVersion) {
  console.warn("Package version is the same. No changes made");
  process.exit(0);
}

pkg.version = newVersion;

writeFileSync(fileName, new TextEncoder().encode(JSON.stringify(pkg, null, 2)));
