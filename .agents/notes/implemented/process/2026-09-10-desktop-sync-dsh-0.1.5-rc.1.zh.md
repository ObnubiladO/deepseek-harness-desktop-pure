# Agent Note: Desktop 与 dsh-v0.1.5-rc.1 的同步

Status: implemented

[English](2026-09-10-desktop-sync-dsh-0.1.5-rc.1.md) | 中文

## Problem

本 fork 在 `dsh-v0.1.5-alpha.2` 上发布了 `0.1.14-astra`。随后上游推进到 `dsh-v0.1.5-rc.1`：改进了侧边栏与文档预览界面，新增引导起始页并让输入区统计胶囊更安静，把 Chat Completions 的默认模型改为 DeepSeek V41 Flash，恢复了 V4 Flash Vision 的 catalog 条目，并刷新了生成的客户端 slot catalog。本次更新必须在不清空 fork 线的前提下，把这些改动与 fork 自有的 Desktop 打包和获准的 `settings.update` 席位调和起来。

## Decision

从 fork tip `c50e9ff42ed7d8b7ef1deffdea4eda9211277be5` 出发，通过经过审查的手工 merge 与等树的、以上游为根的候选分支，接入 `dsh-v0.1.5-rc.1`（`183f08e9c6dde7e36cd2318eaee70b0da08fb35e`）。

- 手工集成：`f5cf0b89132241c5663054278120e84b4422b0ed`（`integrate/dsh-0.1.5-rc.1`），树 `1fa304733e2ba2ac01bfcfc984cda31f45c73cc5`。
- 以上游为根的候选：`02afbfd944ab15a136114d91ac654cc60e3cc02b`（`candidate/dsh-0.1.5-rc.1`），建立在已验证的 tag commit 之上，树相同，落后目标 `0` 个提交。
- 落地 master：`b3803fa799c220836a80d7875c1529e0f50d8649`（`publish/dsh-alpha2`），第一父为原 fork tip，第二父为候选分支，树与候选一致。

本次 merge 无冲突；审查覆盖了双方都改动过的六个文件。采纳上游的侧边栏、文档预览、引导起始页与统计胶囊改进，DeepSeek 模型 catalog 变更（Chat Completions 默认 V41 Flash、恢复 V4 Flash Vision），更新后的依赖锁定与 lockfile，以及重新生成的客户端 slot catalog。保留 Desktop 打包、品牌与 `settings.update` 席位，并保留 `0.1.5-rc.1` 尚未包含的 `WebSocket closed 1006` 传输分类。

## Alternatives considered

停留在 `0.1.5-alpha.2` 会让 Desktop 发布落后于已审查的上游候选线，并推迟侧边栏与 catalog 修复。用上游整体替换 fork 树会丢失 Desktop 集成与可审查的祖先关系。把多窗口工作带上这条线会发布未经审查的原生改动；它因此保留为 fork 本地分支。

## Consequences

需要验证 LLM catalog 与路由默认值、Desktop 配置与 UI、打包运行时的启动与退出，以及同步后的 lockfile。Desktop 将在此基线上通过仓库的发布流程产出独立的 `0.1.15-astra` 发布。多窗口功能仍为 fork 本地内容，不属于本次同步。
