# Agent Note: Desktop 与 dsh-v0.2.1-rc.3 的同步

Status: implemented

[English](2026-10-24-desktop-sync-dsh-0.2.1-rc.3.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.1-rc.2` 发布了 `0.2.6`。随后上游发布了 `dsh-v0.2.1-rc.3`：六个提交，但涉及 640 个变更文件，因为增量主要由「导航自定义」这一功能占据。

它重写的文件中有两个是本 fork 修改过的：`packages/client/ui-settings-general/tests/apply.client.spec.ts` 与会话骨架样式表。没有任何承载本 fork 适配本身的文件移动——`browser-auth.ts`、webserver 监听器、插件兼容门禁、profile 解析服务、设置服务、sidecar 与运行时清单在这段区间内均未被上游改动。

## Decision

从 fork 顶点 `657a0527e4` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）。

- 手工集成：`0a660974f6`（`integrate/dsh-v0.2.1-rc.3`），树 `f109e1d072`；一个冲突。
- 上游为根的候选：`999a5040ca`，树相同，落后目标 `0` 个提交。
- master 落地：`ff76db7953`，第一父提交是此前的 fork 顶点 `657a0527e4`，第二父提交是候选，树与候选相等；落地合并出现分歧的十一个路径全部解析为候选。

唯一的冲突 `ui-settings-general/tests/apply.client.spec.ts` 通过**两边都保留**来解决。上游的分析埋点工作（`675164957a`）把行访问重构为 `developerToolsRowOf(c)` 辅助函数；本 fork 在同一位置断言 Desktop 更新席位由 Desktop 客户端注册、绝不由此插件注册。两个主张并不冲突——一个讲测试如何取得某一行，另一个讲哪个插件可以拥有某个席位——因此解析保留本 fork 的断言，同时采纳上游的辅助函数。设置套件 88/88 通过。

无需干预即得以保留：Desktop 打包与品牌、`settings.update` 席位、WebSocket 1006 传输分类、完整标题的头部规则、唯一共享的 `dsh-auth` cookie 名称、`maxHeaderSize` 上限、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体、更新席位的 semver 优先级，以及 sidecar 中的 `linkDesktopPackages`——已在重建的部署中确认存在。

## Alternatives considered

测试冲突中任选一边都被否决：取上游版本会悄悄丢掉本 fork 关于席位归属的保证，取本 fork 版本则会丢弃上游在同文件其他位置已依赖的重构。按意图合并是唯一能同时保持两种陈述为真的做法。

## Consequences

Desktop 在此基线上推进独立的 `0.2.7` 发行。第三方插件包需要为运行时 `0.2.1-rc.3` 重新授予豁免；没有豁免时用量配套插件仍会加载。

已记录的上游误报没有变化：`verify-repository-references` 仍把 `python/sdk/uv.lock:113` 判定为提交哈希，而该文件与上游逐字节相同，被标记的记号是包 URL 中的 PyPI 文件摘要。保存在本仓库之外的 `plugin-compat` 辅助脚本同样仍实现「仅 peer」规则，而上游的门禁现在还会读取声明的 `engines.dsh` 范围。

## Testing

`pnpm run doc-sync` 通过 43 项门禁中的 42 项，例外即上述误报；文档预算无需压缩即通过。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.2.7` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项；设置包 88/88 通过——这正是冲突解析的验收测试。对默认 `web` profile 的无头启动可正常就绪，没有任何 `failed to import` 行，也没有用量配套插件的 pending 行；兼容性检查报告运行时为 `0.2.1-rc.3`，提供方按预期被跳过。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行可通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败。

## Environment note: a false alarm about indentation

我的冲突解析最初在假定为两空格缩进的文件里用了四空格缩进，而随后那次「归一化」尝试静默地什么都没做，因为替换字符串用了 CRLF，而文件是 LF。直接检查文件后发现假定正好反了：整个文件就是四空格缩进、LF 换行，因此该代码块本来就是一致的。

教训很小，但与本系列其余部分一致：一个什么都没改变的「修复」并不能证明本来就没有问题——它可能只证明那次检查根本没有运行。看一眼产物就把它定论了。
