# Agent Note: Desktop 与 dsh-v0.1.7-rc.2 的同步

Status: implemented

[English](2026-09-22-desktop-sync-dsh-0.1.7-rc.2.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.1.7-alpha.2` 发布了 `0.1.19`。随后上游发布了 `dsh-v0.1.7-rc.2`：502 个提交、3,771 个变更文件，其中 27 个文件两边都改过——这是本 fork 建立以来规模最大的一次同步。两处上游改动落在本 fork 适配过的代码上：设置外壳新增了 shell 存储与可注册的 `settings.open` 快捷键命令，并把触发器行重做为围绕 `Tooltip` 与 `actions.open` 的结构；双语一致性记录则从整文件 git blob 哈希改为逐小节的 16 位十六进制摘要。

## Decision

从 fork 顶点 `de32a2f9a7` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.1.7-rc.2`（`477b4f420553e8a52c2fbccc464d7561b239c443`）。

- 手工集成：`da51b80419`（`integrate/dsh-0.1.7-rc.2`），树 `086ecab2ef`；十一个冲突，其中两个是源文件。
- 上游为根的候选：`a2abfb3dfe`，位于已验证的标签提交之上，树相同，落后目标 `0` 个提交。
- master 落地：`ba6cfa93c5`，第一父提交是此前的 fork 顶点 `de32a2f9a7`，第二父提交是候选，树与候选相等；落地合并出现分歧的四十九个路径全部解析为候选。

解析与适配：

- `packages/client/ui-settings-general/src/client/index.ts` 采用上游代码块：shell 存储、实例级存储垫片、带默认按键绑定与模态处理的 `settings.open` 快捷键命令，以及同时拆除两者的 disposer。本 fork 的 `settings.update` 席位被重新加回外壳的 children 映射中原先的位置，Desktop 更新行的注册正依赖于此。
- `packages/client/ui-settings-general/src/client/SettingsRoot.tsx` 采用上游重做后的触发器行——`Tooltip` 回退、`actions.open`、`shortcut` 提示、`settingsOpen`——并包在本 fork 的 `triggerColumn` 容器内，使更新席位仍渲染在触发器下方。该 CSS 类已由 fork 一侧保留，因此无需改动样式。
- 全部 26 份 fork 自有双语记录都用 `pnpm run verify-translation-pairing --write --all` 以新的逐小节格式重新记录，这正是配对工具提供的迁移方式；合并期间冲突的九份记录也包含在该次批量写入中。

保留不变：Desktop 打包与品牌、`settings.update` 席位、本 fork 的 WebSocket 1006 传输分类、完整标题的头部规则、固定的 `dsh-auth` cookie 名称及其启动清理、部署中的 DeepSeek 账户包，以及插件补丁载体。其余适配点在 alpha.2 与 rc.2 之间均未变动：cookie 名称、`maxHeaderSize` 选项、profile 解析服务、设置控制器与 typert 协议完全一致。

## Alternatives considered

为原样采用上游外壳而放弃本 fork 的 `settings.update` 席位被否决：该席位就是 Desktop 更新行，本次解析的全部意义正是在采纳上游存储、快捷键与 tooltip 工作的同时保留它。反过来，保留本 fork 较旧的触发器行而忽略上游重做同样被否决——那会放弃快捷键提示与 `aria-keyshortcuts` 接线。手工迁移 26 份记录被否决，改用工具自带的批量写入，它从当前内容推导摘要。再次手工解析落地冲突也被否决，因为落地树必须与已验证的候选完全相等。

## Consequences

Desktop 在此基线上推进独立的 `0.1.20` 发行。两个解析后的文件位于上游正在积极重做的区域，下一次同步必须重新检查它们；外壳现在持有存储与命令注册，比此前的纯 slot 注册有更多可供上游改动的表面。多窗口特性仍是 fork 本地特性，不属于本次同步；它单独变基到该基线上。

## Testing

`pnpm run doc-sync` 通过 42 项门禁中的 42 项。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.1.20` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。解析后的设置外壳包在 7 个文件中通过 76 项测试中的 76 项，正是断言该席位与外壳契约的套件。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行时 8/8 通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 余额断言，它们在本机此前就已失败（9,202 项中通过 9,198 项）。

配对迁移由门禁本身验证：批量重录之前门禁报告 23 份记录格式错误，之后无任何违规并通过。
