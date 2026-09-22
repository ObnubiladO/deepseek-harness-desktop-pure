# Agent Note: Desktop 与 dsh-v0.1.5-rc.2 的同步

Status: implemented

[English](2026-09-10-desktop-sync-dsh-0.1.5-rc.2.md) | 中文

## Problem

本 fork 在 `dsh-v0.1.5-rc.1` 上发布了 `0.1.15-astra`。随后上游发布了 `dsh-v0.1.5-rc.2`，这是一个范围很窄的后续版本：回合内消息反馈的对称提交流程、共享文件类型图标的美术资源与其清单被回移到 0.1.5 线，反馈对话框与产出文件界面也做了细化。DeepDive 同时还带有一处上游没有的头部标题修复。本次更新必须在不清空 fork 线的前提下，把这些回移改动与 fork 自有的 Desktop 打包、头部标题差异以及 `settings.update` 席位调和起来。

## Decision

从 fork tip `583a780401` 出发，通过经过审查的手工 merge 与等树的、以上游为根的候选分支，接入 `dsh-v0.1.5-rc.2`（`fb2c4b9e698e30edb738bca4cf0618587db7d203`）。

- fork tip：`583a780401`（`fix(desktop): show the full session title in the conversation header`），其父提交为 `0.1.15-astra` 发布提交 `40f82da071`。
- 手工集成：`9f67f191e0f6e0abb0ded8ae10dc2b74c61f5026`（`integrate/dsh-0.1.5-rc.2`），tree `d0de9b15ff9a15ae227c97a7ffb77777ccc14201`。
- 以上游为根的候选分支：`abdd2adece8abbfe8e687e731efe5f10e8207eb0`（`candidate/dsh-0.1.5-rc.2`），建立在已验证的 tag 提交之上，树相同，落后目标 `0` 个提交。
- master 落地：`96176314073801efe4366f09b5cf90611606ab9d`，第一父提交为上一 fork tip，第二父提交为候选分支，树与候选分支相同。

本次 merge 无冲突。双方都只改动了同一个文件 `package.json`：fork 增加了 `desktop`、`desktop/runtime`、`desktop/client-ui` 三个 workspace 条目以及 `desktop:*` 脚本，上游把根版本提升到 `0.1.5-rc.2`。自动 merge 保留了双方改动，因此合并后的根清单同时带有 fork 的 workspace 与脚本新增项和上游版本号，审查后的树与已验证目标之间的差异恰好就是 fork 差异。采纳消息反馈回移、文件类型图标美术资源与清单、产出文件与回合尾部细化，以及重新生成的文档。保留 Desktop 打包、品牌、`settings.update` 席位，以及记录在[对话头部完整显示会话标题](../feature/2026-09-10-desktop-header-full-session-title.zh.md)中的头部标题差异。

## Alternatives considered

停留在 `0.1.5-rc.1` 会让 Desktop 发布缺少经过审查的反馈与文件卡片回移，并使 fork 声明的上游基线落后于最新的候选发布。用上游整树替换 fork 会丢掉 Desktop 集成、头部标题差异以及可审查的祖先关系。把多窗口工作带上这条线会发布未经审查的原生改动；它继续留在 fork 本地分支上。

## Consequences

需要验证反馈对话框及其提交状态、文件类型图标、产出文件界面、Desktop 配置与 UI、构建后运行时的启动与关闭，以及同步后的锁文件。Desktop 在此基线上通过仓库的发布工作流推进到独立的 `0.1.15-astra.1` 发布。多窗口功能仍为 fork 本地，不属于本次同步。
