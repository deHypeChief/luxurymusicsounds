/**
 * Frees the development ports.
 *
 * Ctrl-C in the terminal running `bun dev` shuts both servers down cleanly.
 * This is for when that did not happen: the terminal was closed, the window
 * crashed, or a process was killed outright without its handlers running, and
 * something is still holding 4000 or 5173.
 *
 *   bun run stop
 */

const PORTS = [
  { port: 4000, name: 'api' },
  { port: 5173, name: 'web' },
]

function pidsOnPort(port: number): number[] {
  if (process.platform === 'win32') {
    const result = Bun.spawnSync([
      'powershell',
      '-NoProfile',
      '-Command',
      `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue |` +
        ' Select-Object -ExpandProperty OwningProcess -Unique',
    ])
    return parsePids(result.stdout.toString())
  }

  const result = Bun.spawnSync(['lsof', '-ti', `:${port}`], { stderr: 'ignore' })
  return parsePids(result.stdout.toString())
}

function parsePids(output: string): number[] {
  return [
    ...new Set(
      output
        .split(/\s+/)
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ]
}

/** Kills the process and everything it spawned, the shim layers included. */
function killTree(pid: number) {
  if (process.platform === 'win32') {
    Bun.spawnSync(['taskkill', '/PID', String(pid), '/T', '/F'], {
      stdout: 'ignore',
      stderr: 'ignore',
    })
    return
  }

  Bun.spawnSync(['kill', '-9', String(pid)], { stdout: 'ignore', stderr: 'ignore' })
}

let stopped = 0

for (const { port, name } of PORTS) {
  const pids = pidsOnPort(port)

  if (pids.length === 0) {
    console.log(`${name.padEnd(3)} :${port}  nothing listening`)
    continue
  }

  for (const pid of pids) killTree(pid)
  stopped += pids.length
  console.log(`${name.padEnd(3)} :${port}  stopped ${pids.map((pid) => `PID ${pid}`).join(', ')}`)
}

if (stopped > 0) {
  // Sockets take a moment to be released after the process goes.
  await Bun.sleep(1200)

  const stubborn = PORTS.filter(({ port }) => pidsOnPort(port).length > 0)
  if (stubborn.length > 0) {
    console.error(
      `\nStill in use: ${stubborn.map(({ port }) => port).join(', ')}. Something outside this project may own them.`,
    )
    process.exit(1)
  }
}

console.log('\nPorts 4000 and 5173 are free.')
