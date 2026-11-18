# Agent Note：与 dsh-v0.1.5-alpha.2 的桌面同步

Status: implemented

[English](2026-09-09-desktop-sync-dsh-0.1.5-alpha.2.md) | 中文

## 问题

本 fork 此前基于 `dsh-v0.1.3-alpha.2` 发布了 `0.1.13-astra.1`。此后上游推进到 `dsh-v0.1.5-alpha.2`：原生辅助布局并入 `native/system`，pi-ai 转换改为把领先的 `system` 历史消息提升为 `systemPrompt`，设置写入时提供方校验更严格，设置触发按钮的无障碍名称改为使用外壳 locale 的 `aria-label`。本次更新必须在 fork 自有的 Desktop 打包、品牌与受认可的 `settings.update` 槽位之间调和这些变化，而不是重置 fork 主线。

## 决策

从 fork 顶端 `c711d0c914f2f4cbf7a09325fe4e65faaa1c0247` 出发，经评审的手动合并与等树的上游根候选，集成位于 `b2e3b2a0125854567a4a5fcba75782e42fe84901` 的 `dsh-v0.1.5-alpha.2`。

- 手动集成：`23dbf33bbba5b2bfe11d597ab0fa3e1fad6f9bf4`（`integrate/dsh-0.1.5-alpha.2`），树 `cb555ea2995878db748e41b1abf080e80e020853`。
- 上游根候选：`ac8572285bc82524ca09fd5e3d63976b9a77c5a2`（`candidate/dsh-0.1.5-alpha.2`），位于已验证的标签提交之上，树相同，落后目标 `0`。
- 主线落地：`publish/dsh-alpha2` 上的 `7f89402d853f061a4b5181fd07f3c2f88364d040`，第一父提交为原 fork 顶端，第二父提交为候选，树与候选相等。

采纳上游的 `native/system`（取代 `native/landlock-run`）、上游依赖锁定（fork 自身的锁文件此前已把 website 传递依赖漂移到更新版本）、pi-ai 的 `systemPrompt` 语义与保存时提供方校验、设置触发按钮的 `aria-label` 行为，以及会话导出的下载菜单呈现。保留 Desktop 打包、品牌与触发按钮下方的 `settings.update` 槽位（采用上游无障碍命名模型渲染），并保留 `0.1.5-alpha.2` 尚未包含的 `WebSocket closed 1006` 传输分类及其测试。

## 备选方案

保留漂移会让依赖锁定不再对应任何已评审的上游状态。去掉 fork 缝会让 Desktop 更新投递与原生会话保存退化。用上游整树替换 fork 会丢失 Desktop 集成与可评审的祖先关系。

## 影响

按上游 pi-ai 行为，已安装目录必须通过认证的 Desktop 发现端点暴露 Astra 与既有 Codex 模型。需要验证 pi-ai 适配器、Desktop 配置与 UI、构建后运行时的启动与关闭以及锁文件。Desktop 将在此基线上进入独立的 `0.1.14-astra` 版本。用量伴随程序保持独立安装，不随本次同步打包。
