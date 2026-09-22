# Agent Note: Desktop 与 dsh-v0.1.7-alpha.2 的同步

Status: implemented

[English](2026-09-22-desktop-sync-dsh-0.1.7-alpha.2.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.1.7-alpha.1` 发布了 `0.1.18`。随后上游发布了 `dsh-v0.1.7-alpha.2`：162 个提交、869 个变更文件，其中只有 8 个文件两边都改过。该发行版没有改动本 fork 适配的任何调用点——`packages/client/connection/src/browser-auth.ts` 中的回环 cookie 名称、`maxHeaderSize` 服务选项、profile 解析服务、设置控制器以及 typert 协议在两个标签之间完全一致——因此本轮的工作就是合并本身、版本提升，以及本 fork 欠自己用户的一项交付：部署运行时无法导入的 DeepSeek 账户行。

## Decision

从 fork 顶点 `324398d833` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.1.7-alpha.2`（`00102833dfaee1da9f48a3a8eae9d34005a75218`）。

- 手工集成：`bf1fb9fdd1`（`integrate/dsh-v0.1.7-alpha.2`），树 `47d2ce4030`；合并**零冲突**，fork 与上游共有的八个文件同时保留了两边的意图。
- 上游为根的候选：`a6c6abaea9`，位于已验证的标签提交之上，树相同，落后目标 `0` 个提交。
- master 落地：`80ba7a2db1`，第一父提交是此前的 fork 顶点 `324398d833`，第二父提交是候选，树与候选相等；落地合并出现分歧的十个路径全部解析为候选。

解析与适配：

- 合并内部无需任何冲突解析。落地时的十个冲突（AGENTS.md、README 三件套、`desktop/UPSTREAM_COMMIT`、三个 Desktop 清单、Tauri 的 Cargo 清单与锁文件、以及锁文件）只是落地上游为根候选的常规结果——该候选的树本就包含 fork 的版本。
- `desktop/runtime/package.json` 现在声明 `@deepseek-ai/dsh-deepseek-account`。web profile 会挂载 `@deepseek-ai/dsh-deepseek-account-platform`，而该包正是它的 peer；部署闭包中没有任何其他包声明它，因此 `pnpm deploy` 没有把它放进 `rt/node_modules`，该行导入失败，`account-controller` 因缺少 `deepseekAccount` 服务而一直 pending，`0.1.18` 的账户设置页因此无法渲染。
- 根 README 三件套、`desktop/UPSTREAM_COMMIT` 与 AGENTS.md 的周期行更新到新标签与 `0.1.19` 版本，客户端 slot 目录、第三方声明与锁文件重新生成。

保留不变：Desktop 打包与品牌、`settings.update` 席位、本 fork 的 WebSocket 1006 传输分类、完整标题的头部规则、固定的 `dsh-auth` cookie 名称及其启动清理，以及插件补丁载体。

## Alternatives considered

停留在 `0.1.7-alpha.1` 会让账户页在整个发行版中保持损坏，而上游在自己的线上已经修好。用上游树替换 fork 会丢掉 Desktop 打包、品牌、更新席位与头部差异。只把账户修复摘取到旧基线上被否决：本轮同步成本很低——合并无冲突且没有任何适配点变动——跳过它只会白白推迟一次合并。在 profile 层修补缺失的 peer 也被否决：缺口位于部署闭包中，因此应当由构建该闭包的清单来关闭。

## Consequences

Desktop 在此基线上推进独立的 `0.1.19` 发行，默认 web profile 组合的每一行现在都能激活：针对重建后的运行时对 profile 做无头启动时，完全不打印任何激活警告。多窗口特性仍是 fork 本地特性，不属于本次同步；它单独变基到该基线上，其逐窗口 WebView 数据目录承载了共享 cookie 存储那条线无法提供的隔离。

## Testing

`pnpm run doc-sync` 通过 42 项门禁中的 42 项。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.1.19` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。账户修复经过端到端验证：重建后的运行时部署了 `@deepseek-ai/dsh-deepseek-account`，此前报告 `deepseek-account … failed to import` 与 `account-controller … pending (waiting for service: deepseekAccount)` 的无头 `web` profile 启动，现在不再报告任何激活警告。

`scripts` 泳道报告 5 个文件中的 6 项失败，`gui` 泳道报告 2 个文件中的 3 项失败；两者都取决于环境而非回归：scripts 的失败中有五项是负载敏感的 5 秒超时，单独运行这些文件即可通过；第六项是 `scripts/oxlint-contract.spec.ts` 与 `scripts/persistence-schema.spec.ts` 之间的竞态——前者会在 `packages/core/session/src` 中写入临时 TypeScript 文件，后者会对该目录做类型检查——两个 spec 单独运行都通过，其中 schema spec 为 85/85；三项 `ui-settings-account` 失败是依赖语言环境的余额断言，在合并之前就已在本机失败（7,511 项中通过 7,507 项）。
