# Agent Note: Desktop 与 dsh-v0.1.6-alpha.1 的同步

Status: implemented

[English](2026-09-15-desktop-sync-dsh-0.1.6-alpha.1.md) | 中文

## Problem

本 fork 在 `dsh-v0.1.5-rc.2` 上发布了 `0.1.15-astra.1`。随后上游发布了 `dsh-v0.1.6-alpha.1`，这是一个远大于前两次的版本：800 个提交、3942 个改动文件，其中包括重命名的代码执行接缝（`@deepseek-ai/dsh-code-runtime` 变为 `@deepseek-ai/dsh-ptc-runtime`）、`e2b` 包族被 `ssh` 包族取代、上游自有的 Desktop 打包工作（`run runtime host from asar`、在 `pkg` 构建中强制运行时解析、profile 解析模式）、若干新的生成目录与检查（`verify-repository-references`、`verify-concrete-terms`、`verify-default-product-isolation`、`web-product-bundle-isolation`），以及文档站点的 Mermaid 查看器。本次更新必须在不清空 fork 线的前提下，把这一切与 fork 自有的 Desktop 打包、完整标题的头部规则、`settings.update` 席位以及 fork 的同步记录调和起来。

## Decision

从 fork tip `8d57c84fdb4ebdb6092553a486802ea5bf882ed8` 出发，通过经过审查的手工 merge 与等树的、以上游为根的候选分支，接入 `dsh-v0.1.6-alpha.1`（`0a15e36e7f82b6ed45af6fa9759f29b40dcd965d`）。

- 手工集成：`9a365ca3b1178a190cb45160b1467436ea3947b8`（`integrate/dsh-0.1.6-alpha.1`），tree `aa5da2b23da7436b3717cec65bbba837ce3d0e63`；3929 个文件自动合并，10 个冲突按职责逐一解决。
- 以上游为根的候选分支：`ed4d17a17c8176c1bed3a4cf7db004bd5d837376`（`candidate/dsh-0.1.6-alpha.1`），建立在已验证的 tag 提交之上，树相同，落后目标 `0` 个提交。
- master 落地：`fd27641f784910ac64aa8c7480bcf677f046470c`，第一父提交为上一 fork tip，第二父提交为候选分支，树与候选分支相同。落地时冲突的 19 个文件全部取候选分支一侧，因为落地结果必须复现该候选产物。

解决与适配：

- 根 README 保留 fork 的结构，并加入上游的 `## Citation` 段落，`README.en.md` 与 `README.zh-CN.md` 同步；fork 已删除的 `README.zh.md` 保持删除，上游的中文新增内容并入 `README.zh-CN.md`。
- `packages/client/ui-settings-general/tests/apply.client.spec.ts` 采用上游重写后的 fixture 与辅助函数，并以该写法表达 fork 的更新席位断言。席位本身未变：slot 契约、shell 声明、`SettingsRoot.tsx` 以及重新生成的 slot catalog 都保留它。
- `packages/session-query/session-log-export/README.md` 及其中文对应文件保留 fork 的保存载体段落，并保留上游自动合并的正文，因为合并后的客户端代码仍然实现该载体。
- `desktop/runtime/package.json` 跟随上游重命名为 `@deepseek-ai/dsh-ptc-runtime`。
- 上游新增的 `verify-repository-references` 检查会拒绝受维护文件中的 commit id，而 fork 的同步记录必须包含它们：现在该检查只豁免 Desktop 同步笔记，`AGENTS.md` 与 ancestry 笔记则改用发布 tag，不再写原始 commit。
- `packages/client/ui-settings/README.md` 及其中文对应文件被压缩到上游新的 100 词概述上限，且未丢失更新席位的内容。
- 锁文件、`THIRD_PARTY_NOTICES.md`、客户端 slot catalog 与双语配对记录均重新生成，而不是手工合并。

保留：Desktop 打包与品牌、`settings.update` 席位、fork 的 WebSocket 1006 传输分类，以及记录在[对话头部完整显示会话标题](../feature/2026-09-10-desktop-header-full-session-title.zh.md)中的完整标题头部规则。

## Alternatives considered

停留在 `0.1.5-rc.2` 会让 fork 落后于上游正在积极改动的一条线两个版本，仅接缝重命名一项就会让 fork 的依赖清单腐坏。用上游整树替换 fork 会丢掉 Desktop 打包、品牌与头部标题差异。把新检查对所有受维护文件一律豁免，等于取消检查而不是限定范围，因此只豁免同步笔记。再次手工解决落地冲突被否决，因为落地树必须等于已验证的候选产物：在那里重新决定内容会让本次同步必须落地的产物失效。

## Consequences

需要验证 Desktop 配置与 UI、构建后运行时的启动与关闭、包括更新席位在内的设置界面、会话头部、重做后的客户端与终端界面、同步后的锁文件，以及重新生成的目录文件。Desktop 在此基线上通过仓库的发布工作流推进到独立的 `0.1.16` 发布。多窗口功能仍为 fork 本地，不属于本次同步。

## Testing

`pnpm run doc-sync` 的 41 项检查全部通过；`pnpm run typecheck` 与 `pnpm run lint` 无问题（0 warning、0 error）；Desktop 套件 30 项 Node 测试与 8 项 Rust 测试全部通过；client 与 host 通道 5583 项测试通过；scripts 通道 1539 项中通过 1538 项，唯一失败是 `client-build-environment.client.spec.ts` 中的 5 秒超时，它只会在完全并行负载下出现，单独运行可稳定通过。已解决冲突的索引检查过没有冲突标记，并已验证落地提交精确复现候选分支的树。
