/**
 * Runs the API and the front end together from the repo root.
 *
 * Deliberately dependency-free. Bun can already spawn and stream processes, so
 * pulling in a task runner just to prefix two log streams would mean a root
 * node_modules and an install step before anyone can type `bun dev`.
 *
 * If one side dies (the API cannot reach MongoDB, say) the other is left
 * running: the front end is still worth looking at, and its error states are
 * built for exactly that. Ctrl-C stops both.
 */

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'

interface Service {
  name: string
  colour: string
  cwd: string
  script: string
}

const SERVICES: Service[] = [
  { name: 'api', colour: '\x1b[35m', cwd: 'server', script: 'dev' },
  { name: 'web', colour: '\x1b[36m', cwd: 'client', script: 'dev' },
]

const width = Math.max(...SERVICES.map((service) => service.name.length))

function label(service: Service): string {
  return `${service.colour}${service.name.padEnd(width)}${RESET} ${DIM}│${RESET} `
}

/** Streams a child's output, prefixing every line so two logs stay readable. */
async function pipe(stream: ReadableStream<Uint8Array>, service: Service, to: 'out' | 'err') {
  const decoder = new TextDecoder()
  let carry = ''

  for await (const chunk of stream) {
    const lines = (carry + decoder.decode(chunk, { stream: true })).split('\n')
    // The last element is whatever came through mid-line; hold it for next time.
    carry = lines.pop() ?? ''

    for (const line of lines) {
      const text = label(service) + line
      if (to === 'err') process.stderr.write(text + '\n')
      else process.stdout.write(text + '\n')
    }
  }

  if (carry) process.stdout.write(label(service) + carry + '\n')
}

const children = SERVICES.map((service) => {
  const child = Bun.spawn(['bun', 'run', service.script], {
    cwd: new URL(`../${service.cwd}/`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, FORCE_COLOR: '1' },
  })

  void pipe(child.stdout, service, 'out')
  void pipe(child.stderr, service, 'err')

  void child.exited.then((code) => {
    const note = code === 0 ? 'stopped' : `exited with code ${code}`
    process.stdout.write(`${label(service)}${DIM}${note}${RESET}\n`)
  })

  return child
})

/**
 * Kills a child *and everything it spawned*.
 *
 * `bun run dev` is a shim that spawns the real process (`bun --watch`, `vite`),
 * so killing the child alone leaves the grandchild holding the port. Windows
 * has no process groups, hence taskkill /T; POSIX gets a group signal with a
 * direct kill as the fallback.
 */
function killTree(pid: number) {
  if (process.platform === 'win32') {
    Bun.spawnSync(['taskkill', '/PID', String(pid), '/T', '/F'], {
      stdout: 'ignore',
      stderr: 'ignore',
    })
    return
  }

  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // Already gone.
    }
  }
}

let stopping = false

function stop() {
  if (stopping) return
  stopping = true

  process.stdout.write(`\n${DIM}Stopping…${RESET}\n`)
  for (const child of children) killTree(child.pid)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
process.on('SIGHUP', stop)
// Last line of defence: if this process falls over for any other reason, the
// dev servers should not be left holding ports 4000 and 5173.
process.on('exit', stop)
process.on('uncaughtException', (error) => {
  console.error(error)
  stop()
  process.exit(1)
})

await Promise.all(children.map((child) => child.exited))
