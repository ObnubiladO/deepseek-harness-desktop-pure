// Merge-resolution survival report for an upstream synchronization.
//
// A conflicted file resolved by taking one side wholesale silently drops the
// other side's work, and tests written against either side alone keep passing.
// For every file BOTH sides changed since their merge base (the only files a
// merge can resolve wrongly; one-sided changes are applied verbatim by git),
// this lists lines each side added that no longer appear anywhere in the
// working tree. A listed line is not automatically a bug: the other side may
// have rewritten it, or the resolution may have adapted it. Every listed line
// must be either restored or explained before the integration is committed.
//
// Usage, from the repository root while the integration merge is in progress:
//   node desktop/scripts/verify-merge-survival.mjs [<fork-ref> <upstream-ref>]
// Defaults: <fork-ref> = HEAD, <upstream-ref> = MERGE_HEAD.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repo = process.cwd()
const [ours = 'HEAD', theirs = 'MERGE_HEAD'] = process.argv.slice(2)
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 })

// Regenerated or append-only files are checked by their own generators and gates.
const skipped = [
  /^\.agents\/notes\//,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)THIRD_PARTY_NOTICES\.md$/,
  /\.i18n\.yaml$/,
  /slot-catalog\.ts$/,
]

const base = git('merge-base', ours, theirs).trim()
const changed = ref => new Set(git('diff', '--name-only', base, ref).split('\n').filter(Boolean))
const fork = changed(ours)
const upstream = changed(theirs)
const shared = [...fork].filter(file => upstream.has(file) && !skipped.some(pattern => pattern.test(file))).sort()

let absentTotal = 0
for (const [label, ref] of [['fork', ours], ['upstream', theirs]]) {
  console.log(`\n== lines the ${label} side (${ref}) added that are absent from the working tree ==`)
  let reported = 0
  for (const file of shared) {
    const path = join(repo, file)
    if (!existsSync(path)) {
      console.log(`  ${file}: file absent from the working tree`)
      reported += 1
      continue
    }
    const present = new Set(readFileSync(path, 'utf8').split(/\r?\n/).map(line => line.trim()))
    const absent = git('diff', '-U0', base, ref, '--', file)
      .split('\n')
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))
      .map(line => line.slice(1).trim())
      .filter(line => line.length > 3 && !present.has(line))
    if (absent.length === 0) continue
    reported += 1
    absentTotal += absent.length
    console.log(`  ${file}: ${absent.length} line(s)`)
    for (const line of absent.slice(0, 8)) console.log(`      ${line.slice(0, 140)}`)
    if (absent.length > 8) console.log(`      ... ${absent.length - 8} more`)
  }
  if (reported === 0) console.log('  none')
}
console.log(`\nmerge base ${base.slice(0, 10)}; files changed by both sides: ${shared.length}; absent lines to explain: ${absentTotal}`)
