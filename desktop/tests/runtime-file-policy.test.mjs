import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { pruneRuntime, runtimeFileExclusion, runtimeTarget } from '../scripts/runtime-file-policy.mjs'

const windows = { platform: 'win32', arch: 'x64' }
const mac = { platform: 'darwin', arch: 'arm64' }

test('omits maps, declarations and unused native files on Windows x64', () => {
  const omitted = [
    'example/index.d.ts', 'example/index.d.mts', 'example/index.d.cts',
    'example/index.js.map', 'example/index.mjs.map', 'example/index.cjs.map',
    'example/style.css.map', 'example/index.d.ts.map', 'example/tsconfig.tsbuildinfo',
    'example\\lib\\index.js.map',
    'node-pty/prebuilds/win32-arm64/conpty.node', 'node-pty/prebuilds/darwin-arm64/pty.node',
    'node-pty/prebuilds/win32-x64/conpty.pdb', 'outer/node_modules/node-pty/prebuilds/linux-x64/pty.node',
    '@koromix/koffi-win32-x64/win32_x64/koffi.lib',
    '@mixmark-io/domino/test/entities.html', '@mixmark-io/domino/.yarn/releases/yarn.cjs',
    '@deepseek-ai/libreoffice-kit-wasm/assets/dsoffice.wasm',
    '@deepseek-ai/libreoffice-kit-wasm/package.json',
    '@deepseek-ai/libreoffice-kit-darwin-arm64/prebuilds.json',
  ]
  for (const path of omitted) {
    assert.notEqual(runtimeFileExclusion(path, windows, 'win32-x64'), undefined, path)
  }
})

test('keeps runtime code, assets, sources, documentation and package-manager metadata', () => {
  const kept = [
    'example/index.js', 'example/index.mjs', 'example/data.map', 'example/module.wasm',
    'example/package.json', 'example/LICENSE', 'example/README.md',
    '@deepseek-ai/dsh/src/bin.ts', '@deepseek-ai/dsh/docs/user/index.md',
    '@deepseek-ai/dsh-session/src/index.ts',
    '.bin/tsx', '.pnpm/lock.yaml', '.modules.yaml', '.pnpm-workspace-state-v1.json',
    'node-pty/prebuilds/win32-x64/conpty.node', 'node-pty/third_party/conpty/win10-x64/OpenConsole.exe',
    '@deepseek-ai/libreoffice-kit/lib/index.js',
    '@deepseek-ai/libreoffice-kit-win32-x64/bin/dsoffice.exe',
    '@deepseek-ai/libreoffice-kit-win32-x64/prebuilds.json',
  ]
  for (const path of kept) {
    assert.equal(runtimeFileExclusion(path, windows, 'win32-x64'), undefined, path)
  }
})

test('keeps only the macOS Apple Silicon native files on macOS', () => {
  assert.equal(runtimeFileExclusion('node-pty/prebuilds/darwin-arm64/spawn-helper', mac, 'darwin-arm64'), undefined)
  assert.equal(runtimeFileExclusion('@deepseek-ai/libreoffice-kit-darwin-arm64/bin/dsoffice', mac, 'darwin-arm64'), undefined)
  for (const path of [
    'node-pty/prebuilds/win32-x64/conpty.node',
    'node-pty/prebuilds/darwin-x64/pty.node',
    'node-pty/third_party/conpty/win10-x64/OpenConsole.exe',
    '@deepseek-ai/libreoffice-kit-wasm/assets/dsoffice.wasm',
    '@deepseek-ai/libreoffice-kit-win32-x64/bin/dsoffice.exe',
  ]) {
    assert.notEqual(runtimeFileExclusion(path, mac, 'darwin-arm64'), undefined, path)
  }
})

test('maps the Tauri target triple to the Node runtime it bundles', () => {
  assert.deepEqual(runtimeTarget('x86_64-pc-windows-msvc'), windows)
  assert.deepEqual(runtimeTarget('aarch64-apple-darwin'), mac)
  assert.deepEqual(runtimeTarget(''), { platform: process.platform, arch: process.arch })
  assert.throws(() => runtimeTarget('riscv64gc-unknown-linux-gnu'), /unsupported target/)
})

async function fixture(t, files, directories = []) {
  const root = await mkdtemp(join(tmpdir(), 'desktop-runtime-prune-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const modules = join(root, 'node_modules')
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(modules, path)), { recursive: true })
    await writeFile(join(modules, path), content)
  }
  for (const path of directories) await mkdir(join(modules, path), { recursive: true })
  return modules
}

const kit = JSON.stringify({
  name: '@deepseek-ai/libreoffice-kit',
  optionalDependencies: {
    '@deepseek-ai/libreoffice-kit-darwin-arm64': '0.2.3',
    '@deepseek-ai/libreoffice-kit-wasm': '0.2.3',
    '@deepseek-ai/libreoffice-kit-win32-x64': '0.2.3',
  },
})

test('prunes in place and removes the directories it empties', async (t) => {
  const modules = await fixture(t, {
    '@deepseek-ai/libreoffice-kit/package.json': kit,
    '@deepseek-ai/libreoffice-kit-win32-x64/package.json': '{}',
    '@deepseek-ai/libreoffice-kit-win32-x64/prebuilds.json': '{}',
    '@deepseek-ai/libreoffice-kit-wasm/package.json': '{}',
    '@deepseek-ai/libreoffice-kit-wasm/assets/dsoffice.wasm': 'w'.repeat(1000),
    '@deepseek-ai/dsh/lib/index.js': 'code',
    '@deepseek-ai/dsh/lib/index.js.map': 'm'.repeat(10),
    '@deepseek-ai/dsh/lib/types/index.d.ts': 'd',
    '@deepseek-ai/dsh/src/index.ts': 'source',
    'node-pty/prebuilds/win32-x64/conpty.node': 'n',
    'node-pty/prebuilds/win32-arm64/conpty.node': 'n',
    '.pnpm/lock.yaml': 'lock',
  }, ['example/intentionally-empty'])

  const { officeEngine, omitted } = await pruneRuntime(modules, windows)

  assert.equal(officeEngine, 'win32-x64')
  assert.equal(existsSync(join(modules, '@deepseek-ai/libreoffice-kit-wasm')), false)
  assert.equal(existsSync(join(modules, 'node-pty/prebuilds/win32-arm64')), false)
  assert.equal(existsSync(join(modules, '@deepseek-ai/dsh/lib/types')), false)
  for (const path of [
    '@deepseek-ai/libreoffice-kit-win32-x64/prebuilds.json', '@deepseek-ai/dsh/lib/index.js',
    '@deepseek-ai/dsh/src/index.ts', 'node-pty/prebuilds/win32-x64/conpty.node', '.pnpm/lock.yaml',
  ]) {
    assert.equal(existsSync(join(modules, path)), true, path)
  }
  assert.deepEqual(await readdir(join(modules, 'example/intentionally-empty')), [])
  assert.deepEqual(omitted.get('LibreOffice engine for another target'), { files: 2, bytes: 1002 })
  assert.deepEqual(omitted.get('source map'), { files: 1, bytes: 10 })
})

test('refuses to prune when the selected LibreOffice engine is not deployed', async (t) => {
  const modules = await fixture(t, {
    '@deepseek-ai/libreoffice-kit/package.json': kit,
    '@deepseek-ai/libreoffice-kit-win32-x64/prebuilds.json': '{}',
    '@deepseek-ai/libreoffice-kit-wasm/prebuilds.json': '{}',
    'example/index.js.map': 'map',
  })
  await assert.rejects(pruneRuntime(modules, mac), /missing LibreOffice engine darwin-arm64/)
  assert.equal(existsSync(join(modules, 'example/index.js.map')), true)
  assert.equal(existsSync(join(modules, '@deepseek-ai/libreoffice-kit-wasm/prebuilds.json')), true)
})

test('applies the file rules without a LibreOffice Kit', async (t) => {
  const modules = await fixture(t, {
    'example/index.js': 'code',
    'example/index.js.map': 'map',
  })
  const { officeEngine } = await pruneRuntime(modules, windows)
  assert.equal(officeEngine, undefined)
  assert.equal(existsSync(join(modules, 'example/index.js.map')), false)
  assert.equal(existsSync(join(modules, 'example/index.js')), true)
})
