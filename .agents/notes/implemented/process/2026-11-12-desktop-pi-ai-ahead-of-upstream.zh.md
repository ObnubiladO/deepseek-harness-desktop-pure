# Agent Note: 为 Claude Fable 5.2 先于上游采用 pi-ai 1.5.2

Status: implemented

[English](2026-11-12-desktop-pi-ai-ahead-of-upstream.md) | 中文

## Problem

Anthropic 于 2026 年 11 月 9 日发布了 Claude Fable 5.2（`claude-fable-5-2`）。DeepDive 0.3.1 搭载 Harness `0.2.2-rc.2`，其 `@deepseek-ai/dsh-llm-pi-ai` 适配器依赖 `@earendil-works/pi-ai` 1.3.0。该目录列出了 Claude Fable 5 与 5.1，但没有 5.2；而目录路由在发现模型时直接读取已安装的目录、不进行网络请求，因此 DeepDive 无法连同目录能力一起提供该模型。11 月 10 日发布的 `pi-ai` 1.5.2 加入了它。上游尚未采用：`upstream/master` 已领先 `dsh-v0.2.2-rc.2` 166 个提交，仍然固定在 1.3.0。

## Decision

仓库所有者批准了对“不得修改 Harness 代码”这一 fork 范围规则的例外。Desktop 0.3.2 先于上游把适配器的 `pi-ai` 升级到 1.5.2，并沿用上游自己升级到 `pi-ai` 1.3.0 时的做法。

- 只有 `packages/llm/llm-pi-ai` 升级到 `^1.5.2`。`@botiverse/oar` 0.67.0 依赖 `pi-ai` 与 `pi-coding-agent` 的 `^1.3.0`，以 `~1.3.0` 作为 peer，且上游以该版本对其做了验证，因此实验性的 OAR 子智能体保留 1.3.0 及其补丁，工作区中同时存在两个版本。OAR 与 `pi-coding-agent` 都不在 DeepDive 的部署中。
- `pnpm-workspace.yaml` 让 `pi-ai`、`pi-schema` 与 `pi-telemetry` 1.5.2 免于发布时长等待，与上游对新 `pi-ai` 版本的做法一致。
- 补丁通过 `pnpm patch` 移植。`pi-ai` 1.5.0 已自行修复了对流式工具参数的逐 delta 重新解析（earendil-works/pi#9265），因此 `patches/@earendil-works__pi-ai@1.5.2.patch` 只保留上游的 Gemini 思考签名改动。上游的 Electron 补丁策略相应增加一条 `shared` 条目和一条精确版本覆盖。
- `pi-ai` 1.5.1 会为每个带 `sessionId` 的请求启用 Anthropic 消息线程（beta）。适配器传入 `disableContinuation: true`，它只影响这一功能，因此请求仍与 1.3 下一样完整发送。
- `DIGEST_SEED` 升级为 `v2`，这是适配器 README 在 `pi-ai` 升级改变 Anthropic 序列化时的要求：1.5.1 会在工具 schema 中保留根级 `$defs`。
- compat 漂移闸门把四个新字段 `requiresNonNullAssistantContent`、`requiresToolsWithToolHistory`、`promptCacheKeyMode` 与 `supportsMessageThreads` 归为 `withhold`，配置界面保持不变。pi-schema 生成的类型把每个可选字段写作 `?: T | undefined`；类型一致性闸门现在在去掉这个 `undefined` 后比较取值类型，chat template 的 schema 也以同样方式标注其可选字段的类型，校验行为不变。
- 原先固定 1.3 行为的测试，现在固定它们所保护的性质：不可变且只增长的参数快照，外加一个数 MB 规模的线性耗时防护；以及 `gpt-6-sol` 上以 `pi-ai` 1.4 的 `additional_tools` 格式进行的 Responses 工具更新，因为 1.5 从 Codex 中移除了 `gpt-5.5`，并且只在顶层声明 GPT-5.4 的工具。

## Alternatives considered

在所有者的路由上手工声明 `claude-fable-5-2` 不需要修改仓库，但 profile 无法设置只有目录才能授予的对话中更新标志。只把目录条目加进 1.3.0 补丁的改动更小，但这会修补生成的目录数据，并错过 1.4 与 1.5 的其余部分。所有者不愿等待上游。

## Consequences

- `anthropic` 路由会连同目录能力一起提供 Claude Fable 5.2：自适应思考、逐消息 effort、对话中更新，以及服务端回退到 Claude Opus 5。
- 所有提供方都会获得 `pi-ai` 1.4 与 1.5 的变化。GPT-5.4 的工具在顶层传递，Responses 与 Codex 的工具更新以 `additional_tools` 条目传递，`openai-codex` 不再列出 `gpt-5.5`。手工声明的 Chat Completions 网关在存在工具历史时不再收到 `tools: []`；需要它的网关（例如位于 Anthropic 前面的旧版 LiteLLM）会拒绝这些请求，而相应的 compat 开关被 withhold。
- 由于 seed 改变，恢复的 Claude 对话会一次性省略其已记录的已签名 thinking。
- 下次同步时，以下文件带有 fork 改动：`packages/llm/llm-pi-ai/package.json`、`src/adapter.ts`、`src/catalog.ts`、`src/config.ts`、`src/prefix-binding.ts`、`src/provider-data.generated.ts`、README 双语文件及其配对记录、三个测试文件、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`patches/@earendil-works__pi-ai@1.5.2.patch`、`apps/desktop/scripts/runtime-patch-policy.ts`、`apps/desktop/tests/prepare-runtime-patches.spec.ts` 以及 `THIRD_PARTY_NOTICES.md`。一旦上游把 `pi-ai` 固定到 1.5.2 或更高版本，就把这些文件全部解析为上游版本并去掉仅属于 fork 的条目；在那之前，保留 fork 的版本，并把上游的改动移植上来。

## Testing

构建编排器通过 10/10 项门禁。部署包含 19,234 个文件（422.9 MiB），版本戳为 `0.3.2`，内核为 `0.2.2-rc.2`，其中只有一份带 Gemini 改动的 `pi-ai` 1.5.2。按适配器目录的解析方式通过 `getBuiltinModels('anthropic')` 解析，`claude-fable-5-2` 报告 1,000,000 token 的上下文窗口、128,000 个输出 token、文本与图片输入、`forceAdaptiveThinking`、逐消息 effort、对话中的系统与工具更新，以及 $8/$40 的价格。适配器包通过 480/480 项测试，上游补丁策略测试通过 16/16 项；Desktop 套件通过 38/38 项，Rust 通过 9/9 项；`pnpm run typecheck` 通过 5/5 项。Office 引擎仍以原生方式渲染转换样例，`web` profile 的无头启动可以就绪。`scripts` 与 `gui` 泳道只失败已知的、依赖主机与语言环境的测试。验证过程中没有任何请求发往 Anthropic。
