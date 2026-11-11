import { execFile } from 'node:child_process'
import { access, readdir, readFile, realpath } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pruneRuntime, runtimeTarget } from './runtime-file-policy.mjs'

const desktop = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const modules = resolve(desktop, 'src-tauri/rt/node_modules')

await validateRuntimeLayout(modules)
// The closure check runs after pruning so it also proves the policy removed nothing a package needs.
await reportPrune(await pruneRuntime(modules, runtimeTarget()))
await validatePeerClosure(modules)

const helper = await findFile(modules, 'ensure-spawn-helper.mjs')
if (helper !== undefined) {
  await new Promise((resolvePromise, reject) => {
    execFile(process.execPath, [helper], { cwd: dirname(helper) }, (error, stdout, stderr) => {
      process.stdout.write(stdout)
      process.stderr.write(stderr)
      if (error === null) resolvePromise()
      else reject(error)
    })
  })
}

async function reportPrune({ officeEngine, omitted }) {
  const mebibytes = bytes => `${(bytes / 1048576).toFixed(1)} MiB`
  const rows = [...omitted].sort((a, b) => b[1].bytes - a[1].bytes)
  const files = rows.reduce((sum, [, total]) => sum + total.files, 0)
  const bytes = rows.reduce((sum, [, total]) => sum + total.bytes, 0)
  const detail = rows.map(([reason, total]) => `${reason} ${total.files} (${mebibytes(total.bytes)})`).join(', ')
  process.stdout.write(`Desktop runtime omits ${files} files (${mebibytes(bytes)})${detail === '' ? '' : `: ${detail}`}.\n`)
  process.stdout.write(`Desktop runtime keeps the LibreOffice engine ${officeEngine ?? '(no kit deployed)'}.\n`)
}

async function findFile(directory, name) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isFile() && entry.name === name) return path
    if (entry.isDirectory()) {
      const nested = await findFile(path, name)
      if (nested !== undefined) return nested
    }
  }
  return undefined
}

async function validateRuntimeLayout(directory) {
  const links = await findLinks(directory)
  const packageLinks = links.filter((path) => {
    return !path.replaceAll('\\', '/').includes('/node_modules/.bin/')
  })
  if (packageLinks.length > 0) {
    throw new Error(`desktop runtime contains package symlinks:\n${packageLinks.join('\n')}`)
  }
  process.stdout.write(`Desktop runtime uses a hoisted package tree (${links.length} executable links).\n`)
}

/**
 * Fail when a deployed @deepseek-ai package cannot resolve one of its
 * non-optional @deepseek-ai dependencies or peers. Upstream packages declare
 * their collaborators as peers, and `pnpm deploy` only provides the peers that
 * desktop/runtime/package.json lists, so a peer upstream introduces is
 * otherwise left out silently and fails only when something first imports it,
 * which a boot check cannot see when that import is lazy.
 * @param directory - the deployed runtime's node_modules directory.
 */
async function validatePeerClosure(directory) {
  const root = dirname(directory)
  const packages = new Map()
  for (const scope of await scopeDirectories(directory)) {
    for (const name of await readdir(scope).catch(() => [])) {
      const manifest = await readFile(resolve(scope, name, 'package.json'), 'utf8').catch(() => undefined)
      if (manifest !== undefined) packages.set(await realpath(resolve(scope, name)), JSON.parse(manifest))
    }
  }
  const missing = []
  for (const [location, manifest] of packages) {
    const optional = manifest.peerDependenciesMeta ?? {}
    const wanted = new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}).filter(name => optional[name]?.optional !== true),
    ].filter(name => name.startsWith('@deepseek-ai/')))
    for (const name of wanted) {
      if (!await resolvableWithin(root, location, name)) missing.push(`${manifest.name} -> ${name}`)
    }
  }
  if (missing.length > 0) {
    throw new Error(`desktop runtime cannot resolve declared @deepseek-ai dependencies; add each target to desktop/runtime/package.json:\n${missing.join('\n')}`)
  }
  process.stdout.write(`Desktop runtime resolves every @deepseek-ai dependency of ${packages.size} packages.\n`)
}

async function scopeDirectories(directory) {
  const stores = await readdir(resolve(directory, '.pnpm')).catch(() => [])
  return [
    resolve(directory, '@deepseek-ai'),
    ...stores.map(entry => resolve(directory, '.pnpm', entry, 'node_modules', '@deepseek-ai')),
  ]
}

/** Node's bare-specifier lookup, stopped at the deploy root so a dev checkout cannot mask a gap. */
async function resolvableWithin(root, location, name) {
  for (let current = location; ; current = dirname(current)) {
    if (basename(current) !== 'node_modules') {
      const found = await access(resolve(current, 'node_modules', name, 'package.json')).then(() => true, () => false)
      if (found) return true
    }
    if (current === root || dirname(current) === current) return false
  }
}

async function findLinks(directory) {
  const links = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isSymbolicLink()) {
      links.push(path)
    } else if (entry.isDirectory()) {
      links.push(...await findLinks(path))
    }
  }
  return links
}
