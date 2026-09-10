import { mkdir, readlink, symlink } from "node:fs/promises"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"

process.chdir(fileURLToPath(new URL("../apps/backend/.medusa/server", import.meta.url)))

if (process.env.MEDUSA_UPLOADS_PATH) {
  const uploadsPath = path.resolve(process.env.MEDUSA_UPLOADS_PATH)
  const publicPath = path.join(uploadsPath, "public")
  await mkdir(publicPath, { recursive: true })
  await mkdir(path.join(uploadsPath, "private"), { recursive: true })
  try {
    await symlink(publicPath, "static", "dir")
  } catch (error) {
    if (error.code !== "EEXIST" || (await readlink("static")) !== publicPath) {
      throw error
    }
  }
}

const server = spawn("../../node_modules/.bin/medusa", ["start"], {
  stdio: "inherit",
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal))
}

server.on("error", (error) => {
  console.error(error)
  process.exitCode = 1
})
server.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGTERM" || signal === "SIGINT" ? 0 : 1)
})
