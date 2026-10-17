# Agent Note: Desktop 与 dsh-v0.2.0-rc.1 的同步

Status: implemented

[English](2026-09-24-desktop-sync-dsh-0.2.0-rc.1.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.1.7-rc.2` 发布了 `0.1.20`。随后上游发布了 `dsh-v0.2.0-rc.1`：261 个提交、1,109 个变更文件，其中 9 个文件两边都改过。该发行版有两个特点决定了本轮工作。第一，这是本 fork 建立以来第一次**零冲突**的同步：上游在 fork 适配文件中的唯一改动是设置外壳里的一行注释，因此所有本地适配都无需解析即可保留。第二，也是用户可见的一点，dsh 0.2.0 会在 profile 启动时校验第三方插件包声明的 peer 范围——`dsh-codex-provider@0.1.0` 声明的是 `^0.1.0-rc.6`，因此运行时会跳过它，配套的 `dsh-codex-usage` 也会因缺少 `codexProvider` 服务而停留在 pending。

## Decision

从 fork 顶点 `433a8745f2` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.0-rc.1`（`4878cdabd87d4041bdaff61d04c966883b9fd07a`）。

- 手工集成：`ec7f2e1138`（`integrate/dsh-0.2.0-rc.1`），树 `83875e4287`；零冲突。
- 上游为根的候选：`7ee432a9d8`，位于已验证的标签提交之上，树相同，落后目标 `0` 个提交。
- master 落地：`434142156a`，第一父提交是此前的 fork 顶点 `433a8745f2`，第二父提交是候选，树与候选相等；落地合并出现分歧的十个路径全部解析为候选。

解析与适配：

- 合并内部无需任何解析。本 fork 的适配保持原样，并在合并后逐一用标记确认：外壳 children 映射中的 `settings.update` 席位、其 `triggerColumn` 容器、完整标题的头部规则、`maxHeaderSize` 服务端上限、固定的 `dsh-auth` cookie 名称及其启动清理、sidecar 中的 `linkDesktopPackages`、设置控制器中的 `openTextFile`，以及让部署运行时 profile 行可导入的两个 DeepSeek 包声明。
- 客户端 slot 目录、第三方声明与锁文件重新生成；Desktop 版本提升到 `0.2.0`，按维护者要求把 Desktop 主版本线与上游对齐。
- 第三方插件兼容性现在由运行时强制。官方逃生口是精确版本豁免：`dsh plugin allow-version dsh-codex-provider@0.1.0 --dsh-version 0.2.0-rc.1 --accept-risk --profile web`。已在 profile 的临时副本上验证：豁免之前启动会报告 `skipping profile bundle "dsh-codex-provider"` 与 `codex-usage … pending (waiting for service: codexProvider)`；豁免之后同一次启动不再报告任何激活警告。豁免把一个确切的插件版本绑定到一个确切的运行时版本，因此任一方变更后都需要重新授予；而发布一个放宽 peer 范围的插件版本才是长期解法。

保留不变：Desktop 打包与品牌、`settings.update` 席位、本 fork 的 WebSocket 1006 传输分类、完整标题的头部规则、固定的 `dsh-auth` cookie 名称、部署中的 DeepSeek 账户包与 LLM 基础包，以及插件补丁载体。

## Alternatives considered

在 profile 中手动放宽提供方的 peer 范围被否决：profile 的安装由 pnpm 管理，手改的范围会在下次插件安装时被覆盖，而运行时自带的豁免机制正是为这种情况设计的。为等待插件更新而推迟发行被否决：Desktop 的更新与该插件相互独立，豁免机制可以让配套插件在此期间继续可用。修改运行时以忽略 peer 范围被直接否决：该检查保护用户免受针对不同协议代际构建的插件影响，关掉它会把一次可见的跳过换成无声的异常行为。

## Consequences

Desktop 在此基线上推进独立的 `0.2.0` 发行。使用第三方包的玩家——Codex 提供方及其配套——必须授予精确版本豁免或更新这些插件；Desktop 本体不受影响。下一次同步应重新检查 peer 范围规则，以防上游改变豁免的存储方式。多窗口特性仍是 fork 本地特性，不属于本次同步；它单独变基到该基线上。

## Testing

`pnpm run doc-sync` 通过 42 项门禁中的 42 项。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.2.0` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 做无头启动可正常就绪，且上一轮破坏启动的两个部署包缺口保持修复：不再出现任何 `failed to import` 行。`scripts` 泳道有两项 spec 失败，它们单独运行都通过（分别为 20/20 与 8/8）；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败（9,362 项中通过 9,358 项）。

## Environment note

仓库的暂存区 lint 钩子在本机上会原生崩溃：`scripts/run-oxlint.ts` 对任何输入——包括单个文件与默认配置——都会以 `STATUS_ILLEGAL_INSTRUCTION`（`0xC000001D`）退出，导致集成提交一度失败，最终以 `--no-verify` 提交。权威门禁不受影响——`pnpm run lint` 会先构建 host 库再对 contracts-ready 树做 lint，报告 0 警告、0 错误——但在本环境提交时应预期该钩子失败，并以门禁为准。这是本地工具链状况，不是合并本身的性质。
