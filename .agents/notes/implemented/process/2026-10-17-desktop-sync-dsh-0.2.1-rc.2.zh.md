# Agent Note: Desktop 与 dsh-v0.2.1-rc.2 的同步

Status: implemented

[English](2026-10-17-desktop-sync-dsh-0.2.1-rc.2.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.1-alpha.5` 发布了 `0.2.5`。随后上游发布了 `dsh-v0.2.1-rc.2`：13 个提交、465 个变更文件，这是本系列中最小的一次增量，也是本 fork 首次同步候选发行版标签。

变更集没有触碰任何承载本 fork 适配的文件。`browser-auth.ts`、webserver 监听器、插件兼容门禁、profile 解析服务、设置服务、sidecar 与运行时清单在这段区间内均未被上游改动，因此唯一共享的浏览器会话 cookie 名称、`maxHeaderSize` 上限与 `linkDesktopPackages` 都无需重新施加——连续第二个轮次处于这种状态。

## Decision

从 fork 顶点 `5a4a2cde33` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.1-rc.2`（`687f282e8625c6b8d11ff58211a90524be2e4317`）。

- 手工集成：`ec857f4783`（`integrate/dsh-0.2.1-rc.2`），树 `72fa21f457`；**无冲突**。
- 上游为根的候选：`ce5ea8d40e`，树相同，落后目标 `0` 个提交。
- master 落地：`089c4ce84f`，第一父提交是此前的 fork 顶点 `5a4a2cde33`，第二父提交是候选，树与候选相等；落地合并出现分歧的十个路径全部解析为候选。

无需干预即得以保留：Desktop 打包与品牌、`settings.update` 席位、WebSocket 1006 传输分类、完整标题的头部规则、共享的 cookie 名称、请求头上限、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体、更新席位的 semver 优先级，以及 sidecar 中的 `linkDesktopPackages`——已在重建的部署中确认存在。

## Alternatives considered

连续第二轮无需任何解析决策——而这种「无需」本身就是有用的信号。一个增量平缓、且适配点不在影响范围内的候选发行版标签，意味着本 fork 可以不再重新推导它那五处刻意偏离，这正是记录下来的流程本应产生的结果，而不是碰运气。

## Consequences

Desktop 在此基线上推进独立的 `0.2.6` 发行。运行时的预发布标识现在是 `rc.2` 而不再是 `alpha`，因此第三方插件豁免必须为这个运行时版本重新授予；没有豁免时用量配套插件仍会加载。

已记录的上游误报没有变化：`verify-repository-references` 仍把 `python/sdk/uv.lock:113` 判定为提交哈希，而该文件与上游逐字节相同，被标记的记号是包 URL 中的 PyPI 文件摘要。保存在本仓库之外的 `plugin-compat` 辅助脚本同样仍实现「仅 peer」规则，而上游的门禁现在还会读取声明的 `engines.dsh` 范围。

## Testing

`pnpm run doc-sync` 通过 43 项门禁中的 42 项，例外即上述误报；文档预算无需压缩即通过。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.2.6` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 的无头启动可正常就绪，没有任何 `failed to import` 行，也没有用量配套插件的 pending 行；兼容性检查报告运行时为 `0.2.1-rc.2`，提供方按预期被跳过。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行可通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败。

## Environment note: a correction made before publishing

落地提交的信息最初断言上游不存在 `dsh-v0.2.1-rc.1` 标签等价物。该断言从未被验证，而我用来支持它的检查本身也是错的——把空的 PowerShell 结果与 `-ne $null` 比较会得到 true，于是该检查报告了它并未找到的存在性。由于还没有推送，这条信息被修订以删除该断言，而不是替它辩护；修订保留了两个父提交与树，而这正是落地所依赖的不变量。

教训窄小但值得记住：提交信息里的一句话仍然是一个断言，对它适用的标准与对门禁结论的标准相同——要么对照产物去验证，要么就不要写。
