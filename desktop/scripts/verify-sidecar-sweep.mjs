/**
 * Post-build guard for the packaged Desktop binary.
 *
 * `0.1.17` was published from a build whose executable was older than its own
 * `lib.rs` and carried no cookie-sweep code at all, so the release looked
 * correct in source while the shipped application never cleaned up its stale
 * loopback logins. This guard reads the built executable, proves the sweep
 * string is inside it, and reports both mtimes so a stale artifact is visible
 * instead of inferred.
 *
 * Usage: node ./scripts/verify-sidecar-sweep.mjs [path-to-executable]
 * The default path is the Windows release binary; pass the platform's own
 * release executable on macOS.
 */
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const desktop = resolve(import.meta.dirname, '..')
const executable = resolve(
  process.argv[2] ?? resolve(desktop, 'src-tauri/target/x86_64-pc-windows-msvc/release/deepseek-harness-desktop.exe'),
)
const source = resolve(desktop, 'src-tauri/src/lib.rs')
/**
 * String literals the sweep compiles into the binary. Function names do not
 * survive a release build's optimization, and the legacy prefix is a substring
 * of the bare name, so the cookie name itself is the one reliable marker.
 */
const markers = ['dsh-auth']

const binary = readFileSync(executable)
const text = binary.toString('latin1')
const missing = markers.filter(marker => !text.includes(marker))
const executableTime = statSync(executable).mtime
const sourceTime = statSync(source).mtime

console.log(`binary:        ${executable}`)
console.log(`binary mtime:  ${executableTime.toISOString()}`)
console.log(`lib.rs mtime:  ${sourceTime.toISOString()}`)
console.log(`binary newer:  ${executableTime.getTime() >= sourceTime.getTime() ? 'yes' : 'NO — rebuild before shipping'}`)
for (const marker of markers) {
  console.log(`contains ${JSON.stringify(marker)}: ${missing.includes(marker) ? 'NO' : 'yes'}`)
}

if (missing.length > 0) {
  console.error(`\nverify-sidecar-sweep: the built binary does not carry ${missing.map(m => JSON.stringify(m)).join(', ')}`)
  process.exitCode = 1
} else if (executableTime.getTime() < sourceTime.getTime()) {
  console.error('\nverify-sidecar-sweep: the built binary is older than its source; rebuild before shipping')
  process.exitCode = 1
} else {
  console.log('\nverify-sidecar-sweep: the packaged binary carries the loopback cookie sweep')
}
