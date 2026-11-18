/**
 * Files the Desktop runtime deploy omits.
 *
 * Mirrors upstream's Desktop policy, apps/desktop/scripts/runtime-file-policy.ts, for
 * files that no runtime path reads: JavaScript and declaration maps, TypeScript
 * declarations and build caches, LibreOffice engines the target never selects, and
 * other-platform or debug-only native files. Like upstream it keeps package sources and
 * documentation, which the bundled dsh-doc skill reads. Unlike upstream it keeps
 * package-manager metadata (`.bin`, `.pnpm`, `.modules.yaml`): DeepDive runs from this
 * deploy itself rather than from a copied tree, profile resolution and spawned tools
 * consult that layout, and the metadata is under 1 MiB.
 */
import { access, lstat, readdir, readFile, rm, rmdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { selectOfficeEngine } from '../../scripts/libreoffice-packages.mjs'

/**
 * Classify one deployed file.
 * @param {string} path - Path relative to the deployed node_modules directory, with either separator.
 * @param {{ platform: string, arch: string }} target - Platform and CPU of the bundled Node runtime.
 * @param {string | undefined} officeEngine - LibreOffice engine package suffix the target selects;
 * undefined when no LibreOffice Kit is deployed.
 * @returns {string | undefined} Omission reason, or undefined when the file ships.
 */
export function runtimeFileExclusion(path, target, officeEngine) {
  const parts = path.split(/[\\/]/u)
  const file = parts.at(-1) ?? ''
  if (/\.(?:[cm]?[jt]s|css)\.map$/u.test(file)) return 'source map'
  if (/\.d\.[cm]?ts$/u.test(file)) return 'TypeScript declaration'
  if (/\.tsbuildinfo$/u.test(file)) return 'TypeScript build cache'
  const packageParts = parts.slice(parts.lastIndexOf('node_modules') + 1)
  const nameParts = packageParts[0]?.startsWith('@') ? 2 : 1
  const name = packageParts.slice(0, nameParts).join('/')
  const entry = packageParts.slice(nameParts).join('/')
  if (officeEngine !== undefined && name.startsWith('@deepseek-ai/libreoffice-kit-')
    && name !== `@deepseek-ai/libreoffice-kit-${officeEngine}`) {
    return 'LibreOffice engine for another target'
  }
  if (name === 'fs-ext' && /^build\/(?:Release|Debug)\/(?:obj(?:\/|$)|fs_ext\.(?:exp|lib|pdb|iobj|ipdb)$)/u.test(entry)) {
    return 'fs-ext compiler output'
  }
  if (name === 'fs-ext' && /^build\/(?:binding\.sln|config\.gypi|fs_ext\.vcxproj(?:\.filters)?)$/u.test(entry)) {
    return 'fs-ext build configuration'
  }
  if (name === '@mixmark-io/domino' && (entry === 'test' || entry.startsWith('test/'))) return 'Domino test fixtures'
  if (name === '@mixmark-io/domino' && (entry === '.yarn' || entry.startsWith('.yarn/'))) return 'Domino development tooling'
  if (name === 'node-pty' && target.platform !== 'win32' && /^third_party\/conpty(?:\/|$)/u.test(entry)) {
    return 'node-pty Windows ConPTY sources'
  }
  if (name === 'node-pty' && entry.startsWith('prebuilds/')) {
    const platform = packageParts[nameParts + 1]
    if (platform !== undefined && platform !== `${target.platform}-${target.arch}`) return 'node-pty other platform'
    if (file.endsWith('.pdb')) return 'node-pty debug symbols'
  }
  if (name === '@koromix/koffi-win32-x64' && entry === 'win32_x64/koffi.lib') return 'Koffi import library'
  return undefined
}

/**
 * Platform and CPU of the bundled Node runtime: the Tauri target when one is set, as
 * prepare-node.mjs downloads that runtime, otherwise this host.
 * @param {string | undefined} triple - Rust target triple, normally TAURI_ENV_TARGET_TRIPLE.
 * @returns {{ platform: string, arch: string }} Node platform and CPU names.
 */
export function runtimeTarget(triple = process.env.TAURI_ENV_TARGET_TRIPLE) {
  if (triple === undefined || triple === '') return { platform: process.platform, arch: process.arch }
  const arch = triple.startsWith('aarch64-') ? 'arm64' : triple.startsWith('x86_64-') ? 'x64' : undefined
  const platform = triple.includes('-windows-') ? 'win32' : triple.includes('-apple-darwin') ? 'darwin' : undefined
  if (arch === undefined || platform === undefined) throw new Error(`desktop runtime: unsupported target ${triple}`)
  return { platform, arch }
}

/**
 * Delete every file the policy omits, then each directory the deletion emptied, so an
 * omitted package leaves no directory that LibreOffice Kit would report as an incomplete
 * installation. Directories that were already empty stay.
 * @param {string} modules - The deployed node_modules directory.
 * @param {{ platform: string, arch: string }} target - Platform and CPU of the bundled Node runtime.
 * @returns {Promise<{ officeEngine: string | undefined, omitted: Map<string, { files: number, bytes: number }> }>}
 * The selected LibreOffice engine and the omitted files and bytes per reason.
 * @throws Error when the selected LibreOffice engine is not deployed.
 */
export async function pruneRuntime(modules, target) {
  const kit = await readFile(resolve(modules, '@deepseek-ai', 'libreoffice-kit', 'package.json'), 'utf8')
    .catch(error => error.code === 'ENOENT' ? undefined : Promise.reject(error))
  const officeEngine = kit === undefined ? undefined : selectOfficeEngine(JSON.parse(kit), target)
  if (officeEngine !== undefined) {
    const prebuilds = resolve(modules, '@deepseek-ai', `libreoffice-kit-${officeEngine}`, 'prebuilds.json')
    if (!await access(prebuilds).then(() => true, () => false)) {
      throw new Error(`desktop runtime: missing LibreOffice engine ${officeEngine} for ${target.platform}-${target.arch}`)
    }
  }
  const omitted = new Map()
  await pruneDirectory(modules, '', target, officeEngine, omitted)
  return { officeEngine, omitted }
}

/** @returns {Promise<boolean>} whether pruning emptied this directory. */
async function pruneDirectory(directory, relativePath, target, officeEngine, omitted) {
  let kept = false
  let removed = false
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    const child = relativePath === '' ? entry.name : `${relativePath}/${entry.name}`
    if (entry.isDirectory()) {
      if (await pruneDirectory(path, child, target, officeEngine, omitted)) {
        await rmdir(path)
        removed = true
      } else {
        kept = true
      }
      continue
    }
    const reason = runtimeFileExclusion(child, target, officeEngine)
    if (reason === undefined) {
      kept = true
      continue
    }
    const { size } = await lstat(path)
    await rm(path)
    const total = omitted.get(reason) ?? { files: 0, bytes: 0 }
    total.files += 1
    total.bytes += size
    omitted.set(reason, total)
    removed = true
  }
  return removed && !kept
}
