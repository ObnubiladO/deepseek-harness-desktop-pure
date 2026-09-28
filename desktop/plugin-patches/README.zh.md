# 固定版本的插件补丁

[English](README.md) | 中文

这些补丁用于 DeepDive 的 profile 所安装的第三方 DSH 插件。它们不属于本仓库自己的 `patches/` 集合（那些补丁绑定到本仓库的 `patchedDependencies`）；这里每个补丁都由*该 profile* 的 pnpm install 应用。

## dsh-codex-provider@0.1.0.patch

把 `dsh-codex-provider` 0.1.0 固定在 DSH 0.1.6-alpha.2 及更新的版本上。

上游 `dsh-v0.1.6-alpha.2`（“perf(typert): materialize generated schemas on first use”）把严格编解码器改为惰性：`TypertCodec` 现在提供 `create(): TypertSchema`，而不再提供 0.1.6-alpha.1 所接受的即时 `schema` 成员。客户端注册表会拒绝没有 `create` 工厂的编解码器，因此该插件手写的客户端贡献让 `ctx.remote.$mount()` 在 `apply()` 内部被拒绝，条目从未激活，启动页显示 “Failed to load plugins” 并给出 `web boot: N entries did not activate`。

该补丁为较旧的 harness 保留 `schema`，并让两个成员指向同一个对象，因此不会重复构建 schema 实例：

    const schema = resultSchema(method)
    return { ... result: { mode: "strict", typeSymbol, schema, create: () => schema } }

`dsh-codex-usage` 不需要补丁：它的源码（以及其自有仓库 `dist/` 下随包提交的 tarball）已经同时输出这两个成员。

### 在 profile 中应用

1. 把补丁复制到 `<profile>/patches/dsh-codex-provider@0.1.0.patch`。
2. 在 `<profile>/pnpm-workspace.yaml` 中登记：

       patchedDependencies:
         dsh-codex-provider@0.1.0: patches/dsh-codex-provider@0.1.0.patch

3. 在 profile 目录中运行 `pnpm install`。

目前带有该补丁的 profile：`~/.dsh-deepdive-b/profiles/web` 与 `~/.dsh/profiles/web`。

## 移除该固定

当已发布的 `dsh-codex-provider` 自身输出 `create` 工厂后，删除 `patchedDependencies` 条目（以及本补丁）。
