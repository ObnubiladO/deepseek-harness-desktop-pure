# Agent Note: Desktop 与 dsh-v0.2.1-alpha.1 的同步

Status: implemented

[English](2026-10-08-desktop-sync-dsh-0.2.1-alpha.1.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.0-rc.2` 发布了 `0.2.1`。随后上游发布了 `dsh-v0.2.1-alpha.1`：266 个提交、4,188 个变更文件。该发行版还移动了本 fork 的一个适配点——profile 解析服务新增了 `ProfileRuntimeResolution` 类与 `refresh()` 方法，并改写了保留规则——而回环 cookie 名称、请求头上限、插件兼容门禁、设置控制器、设置外壳与 typert 协议保持不变。

本轮一开始还指向了错误的来源：先被指定的是父项目 Desktop 的 `v0.1.20` 发行版，而非上游。该发行版位于同一个 harness 标签之上，因此其 harness 内容与本次同步完全一致，但它自带一份 Desktop 差异。这部分工作已经集成，随后在来源被更正时被刻意拆出，现在停留在 `parked/parent-desktop-delta-0.2.2` 分支上，等待属于它自己的一轮。

## Decision

从 fork 顶点 `ef06ef1546` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.1-alpha.1`（`5badb15009ae1756c3afe0ae0cef1faafc290ccc`）。

- 手工集成：`31c6ff592a`（`integrate/dsh-0.2.1-alpha.1`），树 `7614934a65`；两个冲突，都是可再生成的产物——客户端 slot 目录与一份配对记录。
- 发行线：集成本身加上 `d9d0ef58f5`（Desktop `0.2.2`、README 三件套、`UPSTREAM_COMMIT`、周期行）、`98a9f26c06`（部署修复）与 `5147058c5d`（`AGENTS.md` 压缩），树 `e36fcb9cb9`。
- 上游为根的候选：`88d9a775d6`，位于已验证的标签提交之上，树相同，落后目标 `0` 个提交。
- master 落地：`43cc4b52d0`，第一父提交是此前的 fork 顶点 `ef06ef1546`，第二父提交是候选，树与候选相等；落地合并出现分歧的十二个路径全部解析为候选。

合并之外唯一的代码改动 `98a9f26c06` 从 `desktop/runtime/package.json` 中移除了 `@deepseek-ai/dsh-invariants`。该代际同时删除了这个包与其工作区路径，于是这条声明指向了不存在的东西，lockfile 保留了一条指向缺失目录的 `link:` 边，`pnpm deploy` 以 `ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY` 拒绝执行，部署后的运行时只剩十五个文件、完全没有 `node_modules`。

保留不变：Desktop 打包与品牌、`settings.update` 席位、本 fork 的 WebSocket 1006 传输分类、完整标题的头部规则、固定的 `dsh-auth` cookie 名称及其启动清理、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体、更新席位的 semver 优先级，以及 sidecar 中的 `linkDesktopPackages`——那个适配属于本线，本就应该留在这里。

## Alternatives considered

在来源被更正后，把父项目的 Desktop 差异一并放进本次发行被否决：那是第二条开发线，它用他们的 sidecar 载体替换我们的，把它混进一次同步会让本 fork 自己的两条测试断言针对它们已不再描述的实现而失败。整体采用父项目的载体——那对那个文件而言是正确的终点——应当属于采纳其余载体工作的那一轮。与以往一样，提高 `AGENTS.md` 上限而不压缩被否决：标准要求先搬迁或压缩。

## Consequences

Desktop 在此基线上推进独立的 `0.2.2` 发行。第三方插件包的使用者必须为 `0.2.1-alpha.1` 重新授予豁免，因为门禁被限定为一个插件版本加一个运行时版本；配套插件无论如何都会继续加载，这正是其优雅降级所为之编写的。多窗口线已退役：不再需要，其安装包已删除，其分支不再维护。父项目 Desktop 差异继续停放，等待后续轮次。

## Testing

`pnpm run doc-sync` 在把 `AGENTS.md` 压回本 fork 的 3400 词上限之内后通过 43 项门禁中的 43 项，双语配对记录依据解析后的内容重新录制。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 的无头启动可正常就绪，没有任何 `failed to import` 行，并且在这一代际上也没有用量配套插件的 pending 行。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行时 8/8 通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败；`scripts/project-doc-site.spec.ts` 则在其自身的准备步骤失败，因为 Windows 在没有开发者模式或提权时拒绝它创建的符号链接（`EPERM: operation not permitted, symlink`）。这三者都不是本次同步的性质。

## Environment note: a partial deploy can pass a stamp check

从版本戳的角度看，部署步骤是静默失败的：`bundle:prepare` 返回非零，部署只写了一部分，而 `rt/package.json` 已经显示 `0.2.2`，因为版本戳先于部署写入。于是一个只检查版本戳的守卫认证了一个由两代文件混合而成的运行时，随后冒烟泳道以 `ReferenceError: createServer is not defined` 失败——那个符号属于父线的载体，而不属于本线。先删除 `rt/` 再重建得到了完整的部署（28,462 个文件，对比残缺时的 14,478），同一条泳道未作改动即通过。

教训比「检查产物」更窄：检查与论断**具体对应**的那个产物，并且要在它确定已经写完的时刻检查。版本字符串不是关于文件内容的证据，包装脚本的退出码也不是关于它所包装的构建的证据——除非前者的状态确实由后者推导而来。
