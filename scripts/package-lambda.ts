import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const buildDir = path.join(rootDir, "build");
const packageDir = path.join(buildDir, "package");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const publicDir = path.join(rootDir, "public");
const staticDir = path.join(rootDir, ".next", "static");
const outputZip = path.join(buildDir, "function.zip");
const POSIX_SAFE_PATH_ENTRIES = ["/usr/bin", "/bin"];

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
  await mkdir(packageDir, { recursive: true });

  await cp(standaloneDir, packageDir, { recursive: true });

  if (await pathExists(publicDir)) {
    await cp(publicDir, path.join(packageDir, "public"), { recursive: true });
  }

  if (await pathExists(staticDir)) {
    const packageNextDir = path.join(packageDir, ".next");
    await mkdir(packageNextDir, { recursive: true });
    await cp(staticDir, path.join(packageNextDir, "static"), { recursive: true });
  }

  await rm(outputZip, { force: true });
  await runZip(packageDir, outputZip);
  await rm(packageDir, { force: true, recursive: true });

  process.stdout.write(
    `Packaged Lambda artifact at ${path.relative(rootDir, outputZip)}\n`
  );
}

function runZip(cwd: string, zipPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const zipProcess = spawn(
      resolveZipExecutable(),
      ["-r", zipPath, "."],
      {
        cwd,
        stdio: "inherit",
        env: createSafeEnv(),
      }
    );

    zipProcess.on("error", (error) => reject(error));
    zipProcess.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const exitCode = code === null ? "null" : code.toString();
        reject(new Error(`zip command exited with code ${exitCode}`));
      }
    });
  });
}

packageLambda().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

function resolveZipExecutable(): string {
  const customZip = process.env.ZIP_PATH;
  if (customZip !== undefined) {
    if (!path.isAbsolute(customZip)) {
      throw new Error("ZIP_PATH must be an absolute path");
    }

    return customZip;
  }

  return "zip";
}

function createSafeEnv(): NodeJS.ProcessEnv {
  if (process.env.ZIP_PATH !== undefined) {
    return process.env;
  }

  if (process.platform === "win32") {
    throw new Error(
      "Set ZIP_PATH to the absolute path of the zip executable on Windows"
    );
  }

  return {
    ...process.env,
    PATH: POSIX_SAFE_PATH_ENTRIES.join(path.delimiter),
  };
}
