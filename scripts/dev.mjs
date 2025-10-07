#!/usr/bin/env node
/**
 * Thin wrapper around `next dev` that gracefully handles sandboxed environments.
 * In this coding environment TCP listeners are not allowed, so binding fails with EPERM.
 * We detect that case, print a helpful message, and exit cleanly so CI tasks don't blow up.
 * On a normal developer machine the server starts exactly as `next dev`.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const host = process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

if (Number.isNaN(port) || port <= 0) {
  console.error(`Invalid PORT value "${process.env.PORT}". Provide a positive integer.`);
  process.exit(1);
}

const probe = net.createServer();

const handlePermissionOrAccessError = (error) => {
  if (error.code === "EACCES" || error.code === "EPERM") {
    console.warn(
      `⚠️  Unable to bind dev server to ${host}:${port} (${error.code}). This sandbox blocks listening sockets.`,
    );
    console.warn("   Run `npm run dev` on your local machine to start the Next.js dev server.");
    process.exit(0);
  }

  if (error.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${port} is already in use. Set PORT to a free port before running the dev server.`,
    );
    process.exit(1);
  }

  throw error;
};

probe.once("error", handlePermissionOrAccessError);

probe.listen({ host, port }, () => {
  probe.close(() => {
    const child = spawn(process.execPath, [nextBin, "dev", "--hostname", host, "--port", String(port)], {
      stdio: "inherit",
      env: {
        ...process.env,
        HOST: host,
        PORT: String(port),
      },
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
      } else {
        process.exit(code ?? 0);
      }
    });

    child.on("error", (error) => {
      console.error("Failed to start Next.js dev server:", error);
      process.exit(1);
    });
  });
});
