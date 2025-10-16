import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const buildDir = path.join(rootDir, "build");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const publicDir = path.join(rootDir, "public");
const staticDir = path.join(rootDir, ".next", "static");

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function ensureStandalone(): Promise<void> {
  if (!(await pathExists(standaloneDir))) {
    throw new Error(
      "Missing .next/standalone directory. Run `npm run build` before packaging."
    );
  }
}

async function packageLambda(): Promise<void> {
  await ensureStandalone();

  await rm(buildDir, { force: true, recursive: true });
  await mkdir(buildDir, { recursive: true });

  await cp(standaloneDir, buildDir, { recursive: true });

  if (await pathExists(publicDir)) {
    await cp(publicDir, path.join(buildDir, "public"), { recursive: true });
  }

  if (await pathExists(staticDir)) {
    const packageNextDir = path.join(buildDir, ".next");
    await mkdir(packageNextDir, { recursive: true });
    await cp(staticDir, path.join(packageNextDir, "static"), {
      recursive: true,
    });
  }

  process.stdout.write(`Packaged Lambda artifact at ${buildDir}\n`);
}

packageLambda().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
