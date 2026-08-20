/**
 * Bun compatibility shim, must be preloaded before anything imports Mongoose.
 *
 * bson >= 6.8.0 calls `v8.startupSnapshot.isBuildingSnapshot()` at import time
 * as a startup optimisation check. Bun has not implemented that API and throws
 * ERR_NOT_IMPLEMENTED instead of returning false, which takes Mongoose down
 * with it. Node is unaffected.
 *
 * We answer the question honestly (we are never building a V8 snapshot) and
 * only patch when the real implementation is missing, so this quietly stops
 * doing anything once Bun ships it.
 *
 * Tracking: https://github.com/oven-sh/bun/issues/32501
 */
import v8 from 'node:v8'

const snapshot = (v8 as unknown as { startupSnapshot?: Record<string, unknown> }).startupSnapshot

if (snapshot && typeof snapshot.isBuildingSnapshot === 'function') {
  try {
    ;(snapshot.isBuildingSnapshot as () => boolean)()
  } catch {
    snapshot.isBuildingSnapshot = () => false
  }
}
