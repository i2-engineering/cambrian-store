import { PHASE_PRODUCTION_BUILD } from "next/constants"

export function getMedusaBackendUrl() {
  const publicUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  // Browsers and build workers cannot reach Railway's private network.
  if (
    typeof window !== "undefined" ||
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
  ) {
    return publicUrl
  }

  return process.env.MEDUSA_INTERNAL_BACKEND_URL || publicUrl
}
