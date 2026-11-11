# Agent Note: Desktop 与 dsh-v0.2.1-rc.5 的同步

Status: implemented

[English](2026-10-30-desktop-sync-dsh-0.2.1-rc.5.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.1-rc.3` 发布了 `0.2.7`。随后上游发布了 `dsh-v0.2.1-rc.5`，其中也包含 `rc.4`：13 个提交、388 个变更文件，删除多于新增。

内容以修复为主而非新功能——思考块的渲染、标签溢出时的提示行为，以及把账户目录与 MCP 资源列表的诊断输出移出 ACP stdout，以免污染协议流。这段区间内没有任何承载本 fork 适配的文件移动。

## Decision

从 fork 顶点 `4a7ade3b9e` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.1-rc.5`（`b830ec950faba0a46dda564be3e2d854afed94f1`）。

- 手工集成：`b17fec93ce`（`integrate/dsh-v0.2.1-rc.5`），树 `96d4cad46a`；**无冲突**。
- 上游为根的候选：`e89ec5d0a4`，树相同，落后目标 `0` 个提交。
- master 落地：`995eafe3bc`，第一父提交是此前的 fork 顶点 `4a7ade3b9e`，第二父提交是候选，树与候选相等；落地合并出现分歧的十个路径全部解析为候选。

连续第三个轮次无需干预即得以保留：Desktop 打包与品牌、`settings.update` 席位、WebSocket 1006 传输分类、完整标题的头部规则、唯一共享的 `dsh-auth` cookie 名称、`maxHeaderSize` 上限、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体、更新席位的 semver 优先级，以及 sidecar 中的 `linkDesktopPackages`——已在重建的部署中确认存在。

## Alternatives considered

无需任何决策。由诊断类修复构成、且位于本 fork 未适配文件中的增量，只需要一次正确的合并，不需要别的——这是本流程所追求的稳态，而不是它的退步。

## Consequences

Desktop 在此基线上推进独立的 `0.2.8` 发行。第三方插件包需要为运行时 `0.2.1-rc.5` 重新授予豁免；没有豁免时用量配套插件仍会加载。

一项关于本地环境而非代码树的观察：本轮兼容性检查的摘要从「2 个插件、2 个 home」变成「1 个插件、1 个 home」，追查后发现 `.dsh` 这个 home 现在携带 `dsh-codex-provider` v0.2.2，其 peer 范围本身就满足该运行时，而 `.dsh-deepdive-b` 仍携带 v0.1.0、peer 固定为 `^0.1.0-rc.6`。两个 home 都没有豁免文件，因此差异来自已安装的提供方版本。记录此事是因为门禁摘要的变化通常是回归的第一信号，而这次它是环境更新。

已记录的上游误报没有变化：`verify-repository-references` 仍把 `python/sdk/uv.lock:113` 判定为提交哈希，而该文件与上游逐字节相同，被标记的记号是包 URL 中的 PyPI 文件摘要。保存在本仓库之外的 `plugin-compat` 辅助脚本同样仍实现「仅 peer」规则，而上游的门禁还会读取声明的 `engines.dsh` 范围。

## Testing

`pnpm run doc-sync` 通过 43 项门禁中的 42 项，例外即上述误报；文档预算无需压缩即通过。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.2.8` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 的无头启动可正常就绪，没有任何 `failed to import` 行，也没有用量配套插件的 pending 行；兼容性检查报告运行时为 `0.2.1-rc.5`。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行可通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败。

## Environment note: the build sequence held a fourth time

清理（361 条路径）、门禁编排器（`9 passed, 0 failed`）、随后是 bundle：29,392 个文件、版本戳 `0.2.8`，本 fork 的 sidecar 标记存在而停放的父线载体不存在——全部在第一次尝试时完成。

这条流程现在是整个过程中最不有趣的部分，而这正是重点。它之所以存在，是因为在编排器的产物门禁之前到达的 tsdown 步骤无法解析生成出来的入口文件，也因为上一代的增量产物会把上一代的导入当作新代码中的错误来报告。两者都是关于本仓库构建的顺序事实，而不是关于它应当如何工作的意见。
