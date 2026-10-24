# Agent Note: Desktop 与 dsh-v0.2.1-alpha.2 的同步

Status: implemented

[English](2026-10-09-desktop-sync-dsh-0.2.1-alpha.2.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.1-alpha.1` 发布了 `0.2.2`。随后上游发布了 `dsh-v0.2.1-alpha.2`：669 个提交、3,226 个变更文件——这是本 fork 迄今吸收的最大一次上游增量——并且它移动了两个适配点，两者都承载着本 fork 欠自己用户的修复：

- `packages/client/connection/src/browser-auth.ts`：唯一共享的 `dsh-auth` cookie 名称就在这里，而上游为它新增了原生 HTTPS 监听支持（`secure` 标志、按协议划分的 cookie audience），同时保留了按 authority 派生 cookie 名称的做法。
- `packages/host/webserver/src/index.ts`：`maxHeaderSize: 64 * 1024` 上限就在这里，而上游重写了监听器构造（新增 258 行），并且没有加入任何上限。

上游还彻底删除了 `@deepseek-ai/dsh-subagent-in-process-driver`，与上一代删除 `dsh-invariants` 如出一辙。

## Decision

从 fork 顶点 `549fe13acd` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.1-alpha.2`（`d743267388641bc76f17c45ce8b4c231aed1d32c`）。

- 手工集成：`7c294d6eec`（`integrate/dsh-0.2.1-alpha.2`），树 `5aab7dfc4a`；三个冲突。
- 上游为根的候选：`40bdc9044a`，树相同，落后目标 `0` 个提交。
- master 落地：`cdd149ea16`，第一父提交是此前的 fork 顶点 `549fe13acd`，第二父提交是候选，树与候选相等；落地合并出现分歧的十三个路径全部解析为候选。
- 发行线：Desktop 版本 `0.2.3` 及其 README 三件套、`UPSTREAM_COMMIT` 与周期行，全部在准备软件包之前完成标记。

解析均按意图完成，而不是整边取用：

- **`browser-auth.ts`** 采纳上游的 HTTPS 工作，并把本 fork 的唯一共享 cookie 名称重新施加于 `cookieName(authority)` 之上；authority 仍然绑定在签名值内并逐请求校验，但不再用于命名 cookie——按 authority 命名会让每次随机端口启动都铸造一个新的持久 cookie，直到累积的 `Cookie` 头越过 Node 的默认上限，所有请求都返回 431。connection 套件 173/173 通过，其中包括本 fork 自己那条「后一次登录替换前一次」的断言；本 fork 的测试文件在合并中原样保留，因此它才是这一决定的仲裁者，而不是合并者本人。
- **`webserver/index.ts`** 采纳上游重写后的监听器，并重新施加 `createServer({ maxHeaderSize: 64 * 1024 }, listener)`。上游没有设置任何上限；他们新增的 secure 监听器同样没有，这一点值得在后续轮次中专门审视，而不是在这里顺手改动。
- **锁文件** 在从运行时清单中移除 `@deepseek-ai/dsh-subagent-in-process-driver` 之后重新生成，因为上游已不存在同名工作区包。

保留不变：Desktop 打包与品牌、`settings.update` 席位、本 fork 的 WebSocket 1006 传输分类、完整标题的头部规则、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体、更新席位的 semver 优先级，以及 sidecar 中的 `linkDesktopPackages`——已在重建的部署中确认存在。

## Alternatives considered

整体采用上游的 `browser-auth.ts` 被否决：那会无声地重新引入按 authority 命名 cookie 的做法，也就是本 fork 修掉的 431 风暴，而本 fork 的测试如今编码的正是相反行为。保留本 fork 较旧的 `webserver` 监听器被以镜像理由否决：上游的重写正是其 HTTPS 支持所需的代码路径，因此上限必须搬到他们的构造之上，而不是让文件停在旧版本。本轮无需提高 `AGENTS.md` 上限——预算门禁首次运行即通过。

## Consequences

Desktop 在此基线上推进独立的 `0.2.3` 发行。第三方插件包再次需要重新授予豁免，因为门禁被限定为一个插件版本加一个运行时版本；配套插件无论如何都会继续加载。有一个结构性细节会影响后续轮次：本次上游发行使用**附注标签**（annotated tag），因此 `git rev-parse <tag>` 得到的是标签对象，必须先解引用到提交才能作为候选的父提交——第一次候选创建正是败在这里。

## Testing

`pnpm run doc-sync` 通过 43 项门禁中的 43 项，双语配对记录重新录制，文档预算首次运行即满足。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.2.3` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 的无头启动可正常就绪，没有任何 `failed to import` 行，也没有用量配套插件的 pending 行。connection 包 173/173 通过，这就是 cookie 解析的验收测试。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行 8/8 通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败。

## Environment note: stale build outputs survive a merge

本轮两次构建失败都源自产物而非代码。第一次是 `MISSING_EXPORT: "registerSessionTitleLlmProvider" is not exported by "../session-title-llm/src/index.ts"`——由合并前构建出的 `lib/` 分块抛出，而源码早已与上游记录的 API 变更一致（他们的升级指南写明该导出已被移除）。清理这三个包的产物后暴露出第二次：`[@deepseek-ai/dsh-root] Cannot find entry: ["lib/types/{index,startup}.js"]`，这是第一次构建中断、代码生成从未完成的连带后果。`pnpm run clean` 加完整重建解决了二者：移除 360 条陈旧路径，随后得到 28,784 个文件、版本戳为 0.2.3 的完整部署。

本 fork 现在遵循的规则是：在一次改变包契约的同步之后，先清理构建产物，再信任增量构建；并且只有在构建接受之后才提交集成。上一代的增量缓存会报出上一代的导入——并且会把它们当作新代码里的错误报出来。
