# Agent Note: Desktop 与 dsh-v0.2.1-alpha.5 的同步

Status: implemented

[English](2026-10-16-desktop-sync-dsh-0.2.1-alpha.5.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.1-alpha.3` 发布了 `0.2.4`。随后上游发布了 `dsh-v0.2.1-alpha.5`：125 个提交、1,045 个变更文件。

增量不大，但在要紧的地方并非空无一物。承载本 fork 各项适配的文件这次一个都没有移动——`browser-auth.ts`、webserver 监听器、profile 解析服务、设置服务、sidecar 与运行时清单在这段区间内均未被上游改动——因此四个轮次以来第一次，唯一共享的浏览器会话 cookie 名称无需重新施加。不过豁免工作流依赖的一个文件确实变了：`packages/boot/app-boot/src/plugin-compatibility.ts` 增加了对引擎的支持，除 dsh peer 之外还会评估声明的 `engines.dsh` 范围，把上报字段从 `peers` 改名为 `requirements`，并新增了一个能识别 `includePrerelease` 的 `satisfies()` 辅助函数。

## Decision

从 fork 顶点 `24c5c6d157` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.1-alpha.5`（`1517a4dbca0a2789ff1d41ba439600f8547d23fa`）。

- 手工集成：`0aad33a233`（`integrate/dsh-v0.2.1-alpha.5`），树 `88121de898`；**无冲突**。
- 上游为根的候选：`2230ad2252`，树相同，落后目标 `0` 个提交。
- master 落地：`aa0b113791`，第一父提交是此前的 fork 顶点 `24c5c6d157`，第二父提交是候选，树与候选相等；落地合并出现分歧的十个路径全部解析为候选。

无需干预即得以保留（因为合并没有需要解析的内容）：Desktop 打包与品牌、`settings.update` 席位、WebSocket 1006 传输分类、完整标题的头部规则、唯一共享的 `dsh-auth` cookie 名称、`maxHeaderSize` 上限、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体、更新席位的 semver 优先级，以及 sidecar 中的 `linkDesktopPackages`——最后一项已在重建的部署中确认存在。

## Alternatives considered

本轮无需任何解析决策，而这本身就是重点：本 fork 的适配之所以存活，是因为它们所在的文件上游没有触碰，而不是因为有人重新推导了它们。采用上游更窄的上报字段名（`requirements`）被推迟，而不是在同步过程中顺手做掉——豁免工作流以 peer 为准，在这里改动会把一次工具迁移混进一次同步。

## Consequences

Desktop 在此基线上推进独立的 `0.2.5` 发行。第三方插件包需要为 `0.2.1-alpha.5` 重新授予豁免；没有豁免时用量配套插件仍会加载。

有两项遗留值得点名。已记录的上游误报没有变化：`verify-repository-references` 仍把 `python/sdk/uv.lock:113` 判定为提交哈希，而该文件与上游逐字节相同，被标记的记号是包 URL 中的 PyPI 文件摘要。另外，保存在本仓库之外的 `plugin-compat` 辅助脚本仍实现「仅 peer」的规则，而上游现在也把 `engines.dsh` 视为要求，因此该脚本可能少报真实门禁会跳过的插件；应当予以更新以保持一致。

## Testing

`pnpm run doc-sync` 通过 43 项门禁中的 42 项，例外即上述误报；文档预算无需压缩即通过。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.2.5` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 的无头启动可正常就绪，没有任何 `failed to import` 行，也没有用量配套插件的 pending 行；兼容性检查报告运行时为 `0.2.1-alpha.5`，提供方按预期被跳过。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行可通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败。

## Environment note: the build sequence held

上一轮在两次失败之后确立了流程：先清理 workspace，再运行一次门禁编排器，然后准备 bundle。本轮它一次成功——移除 353 条陈旧路径，编排器给出 `9 passed, 0 failed`，随后得到 29,352 个文件、版本戳为 `0.2.5` 的部署，并带有本 fork 的 sidecar 标记且不含父线载体。

这条流程的价值在于它消除了一种顺序依赖，而不是绕过它。编排器的门禁会生成诸如 `lib/types/apply-injections.js` 这样的入口文件；更早到达的 tsdown 步骤无法解析它们，而由此产生的错误会报出树中根本不存在的入口模块名，从而把读者引向一个缺失的文件，而不是一个缺失的步骤。
