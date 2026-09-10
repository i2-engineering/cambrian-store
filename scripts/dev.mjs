import { spawn } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"

const packageManager = process.env.npm_execpath

if (!packageManager) {
  throw new Error("Run this script through pnpm so the workspace package manager is available.")
}

const children = new Set()
let shuttingDown = false

function runWorkspaceScript(workspace, script) {
  const child = spawn(
    packageManager,
    ["--filter", workspace, script],
    { stdio: "inherit", env: process.env }
  )

  children.add(child)
  child.once("exit", (code, signal) => {
    children.delete(child)
    if (!shuttingDown) {
      console.error(`${workspace} stopped unexpectedly (${signal ?? code ?? "unknown"}).`)
      shutdown(code || 1)
    }
  })

  return child
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  for (const child of children) {
    child.kill("SIGTERM")
  }

  setTimeout(() => process.exit(code), 250).unref()
}

async function waitForBackend() {
  const deadline = Date.now() + 60_000

  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://localhost:9000/health")
      if (response.ok) {
        return
      }
    } catch {}

    await delay(500)
  }

  throw new Error("Medusa did not become healthy within 60 seconds.")
}

process.once("SIGINT", () => shutdown(0))
process.once("SIGTERM", () => shutdown(0))

try {
  runWorkspaceScript("@dtc/backend", "dev")
  await waitForBackend()
  console.log("Medusa is ready. Starting the storefront...")
  runWorkspaceScript("@dtc/storefront", "dev")
} catch (error) {
  console.error(error)
  shutdown(1)
}
