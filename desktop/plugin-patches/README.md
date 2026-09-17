# Pinned plugin patches

Patches for third-party DSH plugins that a DeepDive profile installs. They are
not part of this repository's own `patches/` set (those are wired to the repo's
`patchedDependencies`); each one is applied by the *profile's* pnpm install.

## dsh-codex-provider@0.1.0.patch

Pins `dsh-codex-provider` 0.1.0 on DSH 0.1.6-alpha.2 and newer.

Upstream e459e32637 ("perf(typert): materialize generated schemas on first use")
made the strict codec lazy: `TypertCodec` now carries `create(): TypertSchema`
instead of the eager `schema` member that 0.1.6-alpha.1 accepted. The client
registry rejects a codec without a `create` factory, so the plugin's
hand-written client contribution made `ctx.remote.$mount()` reject inside
`apply()`, the entry never activated, and the boot page rendered
"Failed to load plugins" with `web boot: N entries did not activate`.

The patch keeps `schema` for older harnesses and hands both members the same
object, so no schema instance is built twice:

    const schema = resultSchema(method)
    return { ... result: { mode: "strict", typeSymbol, schema, create: () => schema } }

`dsh-codex-usage` needs no patch: its source (and the tarball checked into its
own repository under `dist/`) already emits both members.

### Applying it to a profile

1. Copy the patch to `<profile>/patches/dsh-codex-provider@0.1.0.patch`.
2. Register it in `<profile>/pnpm-workspace.yaml`:

       patchedDependencies:
         dsh-codex-provider@0.1.0: patches/dsh-codex-provider@0.1.0.patch

3. Run `pnpm install` in the profile directory.

Profiles currently carrying it: `~/.dsh-deepdive-b/profiles/web` and
`~/.dsh/profiles/web`.

## Removing the pin

Drop the `patchedDependencies` entry (and this patch) once a published
`dsh-codex-provider` emits the `create` factory itself.
