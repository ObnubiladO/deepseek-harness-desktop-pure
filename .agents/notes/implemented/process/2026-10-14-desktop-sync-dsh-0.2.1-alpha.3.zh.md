# Agent Note: Desktop 与 dsh-v0.2.1-alpha.3 的同步

Status: implemented

[English](2026-10-14-desktop-sync-dsh-0.2.1-alpha.3.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.1-alpha.2` 发布了 `0.2.3`。随后上游发布了 `dsh-v0.2.1-alpha.3`：852 个提交、3,311 个变更文件，再次重写了本 fork 的一个适配点，并且这一次还替换了整个仓库的构建方式。

- `packages/client/connection/src/browser-auth.ts` 在 `0f7ac58213 feat(connection): isolate API operators without changing browser identity` 中新增了 `authenticateApi`、抽取出的私有 `authenticate` 与 v2 cookie 载荷——同时仍然按 authority 派生 cookie 名称，而这正是本 fork 用唯一共享名称替换掉的行为。
- 根构建被替换为门禁编排器（`scripts/build.ts`），其步骤调用 `tsdown --config-loader native --env.DSH_BUILD_FACE host`。

## Decision

从 fork 顶点 `c7b2e44762` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.1-alpha.3`（`2fbf4359b82fb94c03dcce0b831660d87f12ea5c`）。

- 手工集成：`16a1fc834b`（`integrate/dsh-0.2.1-alpha.3`），树 `d676a4896e`；六个冲突。
- 上游为根的候选：`aa0a00f555`，树相同，落后目标 `0` 个提交。
- master 落地：`2153662f37`，第一父提交是此前的 fork 顶点 `c7b2e44762`，第二父提交是候选，树与候选相等；落地合并出现分歧的十八个路径全部解析为候选。

解析：

- **`browser-auth.ts`** 采纳上游的操作者隔离重写，并在他们使用 `cookieName(authority)` 之处重新施加本 fork 的唯一共享 `dsh-auth` cookie 名称。connection 套件 189/189 通过——包含上游新增的隔离测试——即他们的新功能与本 fork 的修复共存。移除他们的 `cookieName` 再次留下与上一轮相同的 `createHash` 悬空导入，本轮同样一并移除。
- **llm-pi-ai README 三件套与锁文件** 取自上游。
- **`scripts/doc-budgets.manifest.json`** 合并上游的重构（新增 `docs/AGENTS.md`、提高 `packages/AGENTS.md`、移除 `docs/defensive-patterns.md` 条目）与本 fork 自己的 `AGENTS.md` 上限，超出的部分通过压缩本 fork 自有的文字削除——一处重复的候选句，以及「raw」「manual」「continuous」这类修饰词——而不是提高上限。

保留不变：Desktop 打包与品牌、`settings.update` 席位、WebSocket 1006 传输分类、完整标题的头部规则、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体、更新席位的 semver 优先级，以及 sidecar 中的 `linkDesktopPackages`——已在重建的部署中确认存在。

## Alternatives considered

面对构建失败，回退 `pnpm run clean` 这一步很诱人，但那会掩盖一个真实缺陷：该失败在已经构建过的workspace 上同样复现。为了让锁文件通过而修改上游的 `verify-repository-references` 门禁被否决，因为那属于改变 Harness 行为、超出本 fork 的范围；本 fork 改为记录这个误报。整体采用上游的 `browser-auth.ts` 连续第三轮被否决，因为本 fork 自己的测试编码的正是相反的 cookie 行为。

## Consequences

Desktop 在此基线上推进独立的 `0.2.4` 发行。第三方插件包需要为 `0.2.1-alpha.3` 重新授予豁免；没有豁免时用量配套插件仍会加载。有一项上游状况是被明知地带着走的：`doc-sync` 报告 43 项门禁中的 42 项通过，因为 `verify-repository-references` 把 `python/sdk/uv.lock:113` 判定为提交哈希。该文件与上游逐字节相同，而被标记的记号是包 URL 中的 PyPI 文件摘要，因此这是门禁在本 fork 并不拥有的文件上产生的误报；该门禁没有提供豁免清单。

## Testing

`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误），两者现在都经由上游新的编排器 scope 运行。Desktop 套件针对重建的 `0.2.4` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 的无头启动可正常就绪，没有任何 `failed to import` 行，也没有用量配套插件的 pending 行。connection 包 189/189 通过。`doc-sync` 通过 43 项中的 42 项，例外即上述误报。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行可通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败。

## Environment note: npm silently drops build flags

上游新的编排器会调用 `tsdown --config-loader native --env.DSH_BUILD_FACE host`。本 fork 的 `build:harness` 通过 `pnpm dlx npm@11.18.0 --prefix .. run build` 抵达根构建，而 npm 11 不再转发这些标志：它会警告 `Unknown cli config "--env.DSH_BUILD_FACE"` 并将其丢弃，于是 tsdown 把 `native`（来自配置加载器）与 `host`（来自环境变量赋值）当作**位置参数式的入口模块**，并以 `[UNRESOLVED_ENTRY] Cannot resolve entry module native` / `host` 失败。

定位根因所依据的矛盾是：同一个门禁在直接运行编排器时通过——`pnpm run build` 报告 `9 passed, 0 failed`，而 bundle 路径在同一棵树上失败。同样的代码、同样的树、不同的包装层。`build:harness` 现在调用 `pnpm --dir .. run build`，且 `desktop/tests/config.test.mjs` 断言新的包装方式。

记下两条教训。包装层是构建契约的一部分：当它改变了由谁解析参数时，它可以在不触碰任何构建代码的情况下弄坏构建。以及，当某个步骤在某个入口之下失败、在另一个入口之下通过时，要检查的差异是入口，而不是那个步骤。

第三条是本轮加入本 fork 同步流程的顺序要求：在 `pnpm run clean` 之后，先运行一次编排器（`pnpm run build`），再准备 bundle。编排器的门禁会生成诸如 `lib/types/apply-injections.js` 这样的入口文件，而经由 bundle 路径更早到达的 tsdown 步骤无法解析它们。
