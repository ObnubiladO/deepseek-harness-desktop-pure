# Agent Note: Desktop 与 dsh-v0.2.2-rc.5 的同步

Status: implemented

[English](2026-11-18-desktop-sync-dsh-0.2.2-rc.5.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.2-rc.2` 发布了 `0.3.2`。随后上游在同一条版本线上发布了 `rc.3`、`rc.4` 与 `rc.5`：19 个提交、580 个文件（+11,724/−932），包含 DeepSeek 内容安全审查及其拒绝处理、DeepSeek 对话导出导入包、一个网页搜索模型默认值，以及一处 liveshare 隧道工作进程修复。

有两个问题决定了本轮的做法。`0.3.2` 引入的 `pi-ai` 例外是否仍然成立：上游在 `rc.5` 仍然固定 `@earendil-works/pi-ai` `^1.3.0`，因此成立。新的 `@deepseek-ai/dsh-deepseek-chat-import` 包是否会进入部署：它是 `apps/cli` 的常规依赖，因此部署闭包会自动包含它，无需在运行时清单中新增条目。

## Decision

从 fork 顶点 `1b18e237ea` 集成 `dsh-v0.2.2-rc.5`（`9c2670d3bce5275e0d1610272958121af87787bb`），并以 Desktop **0.3.3** 发布：补丁号，因为上游版本线没有变化。保留 `0.3.2` 先于上游交付的 `pi-ai` 1.5.2 升级，以及随之而来的 Claude Fable 5.2。

- 手工集成：`968d90cae80ada4c37096744a0a35a6d654781f9`，树 `9af5456a04`；没有文本冲突。
- 上游为根的候选：`b0c89d41fef1eba53a185eaf1e5d37d73a9d31ad`，树相同，落后目标 `0` 个提交。
- master 落地：`54b1ef41f6c0ae0e24a2384f3092a40e8ff016bf`，第一父提交是此前的 fork 顶点 `1b18e237ea`，第二父提交是候选，树与候选相等。fork 领先上游 134 个提交，落后 0 个。

没有需要解析的冲突，而存活报告证明没有任何内容被丢弃：对于两边都修改过的文件，任一方新增的每一行都存在于树中。

以下四点经过核实，而非假定：

- **`pi-ai` 例外成立。** 适配器仍声明 `^1.5.2`，两个补丁仍注册在案，工作区保留其 1.5.2 的发布时长豁免，部署中只有一份带 Gemini 补丁的 `pi-ai` 1.5.2，目录也仍能解析 `claude-fable-5-2`。该例外及其撤销步骤持续有效，直到上游固定 1.5.2 或更高版本。
- **Desktop 的接入点未受上游影响。** fork 适配的文件一个都没有变，因此导出对话框、原生保存载体、设置启动器与更新席位都无需解析；重新生成的客户端目录把 `settings.update` 与上游新增的 `sidebar.session.action` 和 `workspace.picker.directoryFlow` 一并保留。
- **新包属于部署的一部分。** `@deepseek-ai/dsh-deepseek-chat-import` 通过 CLI 依赖进入，部署的依赖闭包闸门解析了全部 339 个包。
- **运行时版本发生了变化。** 部署现在报告内核 `0.2.2-rc.5`，因此在更早运行时上获得豁免的第三方包需要重新授予；此处的解释器把次要 home 中的 `0.1.0` 提供方报告为运行时将跳过的包，与之前一致。

合并后重新生成：客户端、cordis、配置、依赖与官方 bundle 目录，插件包，提供方数据与第三方声明。Desktop `0.3.3` 覆盖其所有版本镜像、README 三件套、`AGENTS.md` 的轮次行以及 `desktop/UPSTREAM_COMMIT`。

## Alternatives considered

等待更晚的标签被否决：`rc.5` 是这条版本线上最新的，而且所有者指名了它。为跟随上游的 `1.3.0` 固定而放弃 `pi-ai` 例外被否决，因为那会把 Claude Fable 5.2 从正在发行的版本中移除。把新 bundle 加入运行时清单没有必要，因为 CLI 已经依赖它，而闭包闸门会点名任何部署无法解析的包。

## Consequences

Desktop 推进到 `0.3.3`，功能集与 `0.3.2` 相同，另加上游的变更，内核为 `0.2.2-rc.5`。`pi-ai` 例外仍是本 fork 唯一有意的偏离，记录在 [pi-ai 笔记](2026-11-12-desktop-pi-ai-ahead-of-upstream.zh.md) 中。

新的对话导入功能会出现在插件管理器的按需 bundle 列表中。DeepDive 的部署已包含该包，因此安装该 bundle 无需从 npm 下载。

## Testing

构建编排器通过 10/10 项门禁。部署包含 19,268 个文件（423.3 MiB），版本戳为 `0.3.3`，内核为 `0.2.2-rc.5`，其中只有一份带 Gemini 改动的 `pi-ai` 1.5.2，且不含 WebAssembly Office 引擎。按适配器自身的目录路径解析，`claude-fable-5-2` 保持其 1,000,000 token 上下文、128,000 输出 token、自适应思考、逐消息 effort 与对话中更新。适配器包通过 496/496 项测试，Electron 补丁策略通过 16/16 项；Desktop 套件通过 38/38 项，Rust 通过 9/9 项；`pnpm run typecheck` 通过 5/5 项，`pnpm run doc-sync` 通过 43/43 项，`pnpm run lint` 无错误。Office 引擎仍以原生方式渲染转换样例，`web` profile 的无头启动可正常就绪，且没有导入失败。`scripts` 与 `gui` 泳道只失败已知的、依赖主机与语言环境的测试：与上一轮相同的六项与三项断言。

本地 Windows 安装包内嵌运行时 `0.3.3`、内核 `0.2.2-rc.5` 与 `pi-ai` 1.5.2，带有 cookie 清理标记并通过清理校验。发布的产物在发布运行完成后以下载得到的文件单独检查。
