# Agent Note: Desktop 与 dsh-v0.1.6-alpha.2 的同步

Status: implemented

[English](2026-09-17-desktop-sync-dsh-0.1.6-alpha.2.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.1.6-alpha.1` 发布了 `0.1.16`。随后上游发布了 `dsh-v0.1.6-alpha.2`：887 个提交、2,622 个变更文件，其中 185 个文件两边都改过。该发行版重做了 profile 启动与模块解析——`runProfile` 对纯 Node 调用方现在默认使用 `resolutionMode: 'runtime'`，即挂载一个由上游 `dsh` 安装锚点计算并强制执行的模块 generation，同时新增了通过 `resolvedProfile` 走应用自有 profile 的路径——把 HMR 包改名为 `@deepseek-ai/dsh-hmr`，围绕新的 primary-runtime、update-task 与 office 接缝重做了 `apps/desktop-host`，并在 `verify-repository-references` 中放行了 `kitRepositoryUrl`。本次更新必须把这一切与 fork 自有的 Desktop 打包、完整标题规则、`settings.update` 席位以及“关于/更新检查”所用的仓库取值调和起来，而不是重置 fork 分支线。

## Decision

从 fork 顶点 `4816af87c6dda05e766ba0441f311d92f42a942e` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.1.6-alpha.2`（`ddefc45fbc7f8e46dd73185e68295696d1297887`）。

- 手工集成：`829e739c48b8544d61ba05fc6ad5bd06b9339fbb`（`integrate/dsh-0.1.6-alpha.2`），树 `d32f5b43ff0569de9f576164b0577d72a8947bd7`；本次合并没有出现文本冲突，两边都触及的路径按职责逐一复核。
- 上游为根候选：`fa49a9454191750c9f7dfb6eb9dce4fd3182753b`（`candidate/dsh-v0.1.6-alpha.2`）建立在已验证的 tag 提交之上，树相同，落后目标 `0` 个提交，携带 185 个文件经过审阅的 fork 增量。
- master 落地：`6db9eeb62dbf3a66ed466e60ef3dd1b9e6a7255a`，第一父提交为原 fork 顶点，第二父提交为该候选，树与候选相等。落地时冲突的十四个路径全部解析为候选内容，因为落地必须复现的正是该产物。

解析与适配：

- `desktop/runtime/src/sidecar.ts` 固定使用 `resolutionMode: 'link'`。新的 `runtime` 默认值会强制执行一个由上游 `dsh` 安装锚点计算的模块 generation，而它看不到 overlay 自有的、对 loader 可见的包（`@deepseek-ai/dsh-desktop-runtime/*`、`@deepseek-ai/dsh-desktop-client-ui`），于是四行 overlay 全部导入失败，Desktop surface 也就从未作用到实际提供的索引文档上。磁盘链接会经由本 sidecar 从自身部署根播种的 profile fallback 解析，这也正是上游自家 desktop host 出于同样原因所选择的模式。
- `desktop/scripts/build-runtime.mjs` 在重写 profile boot 桥接时接受上游现在写出的 facade 形式（`import("./profile-boot.js")`，此前是带后缀的 chunk 名）。
- `desktop/runtime/package.json` 指向 fork 仓库，使“关于”面板的 Repository 一行与更新检查都读取 `https://github.com/ObnubiladO/deepseek-harness-desktop-pure`；该改动记录在[Desktop 的“关于”与更新检查指向 fork 仓库](../bug-fix/2026-09-10-desktop-about-repository-follows-the-fork.zh.md)。
- 版本镜像提升到 `0.1.17`，`desktop/UPSTREAM_COMMIT` 记录新目标；lockfile、第三方声明与客户端插槽目录均为重新生成，而不是合并。
- 落地时 README 配对记录的冲突是重命名交叉重命名：上游把 `README.i18n.yaml` 移到 `docs/subsystems/boot.i18n.yaml`，而 fork 自己保留了一份在 `desktop/assets/README.i18n.yaml`，因此两个文件都以候选内容落地，根目录不再保留 `README.i18n.yaml`。

保留项：Desktop 打包与品牌、`settings.update` 席位、fork 的 WebSocket 1006 传输分类，以及记录在[Desktop 会话头显示完整标题](../feature/2026-09-10-desktop-header-full-session-title.zh.md)中的完整标题规则。

## Alternatives considered

停留在 `0.1.6-alpha.1` 会让 fork 留在一条上游已经替换掉 profile 启动方式的分支线上，而 Desktop sidecar 正依赖那一接缝。用上游树替换 fork 树会丢掉 Desktop 打包、品牌、“关于”仓库取值与标题增量。改用 `resolvedProfile` 而不固定 `resolutionMode` 在本次被否决：它会绕过具名 profile 的初始化，而 Desktop 有意启动与 CLI 相同的 `web` profile，因此固定磁盘链接模式能让两个界面共用同一份 profile 定义。把 overlay 重构为 profile 本地的插件包可以满足 runtime generation，但那会改变部署模型，并非发布本次同步所必需。

## Consequences

Desktop 能以同步后的 runtime 启动并激活 overlay，“关于”面板与更新检查都指向 fork；fork 因此在上游自有的调用点（`resolutionMode`）上多了一处适配，下一次同步必须重新检查。Desktop 在该基线上通过仓库的发布工作流独立发布 `0.1.17`。多窗口功能仍属 fork 本地特性，不属于本次同步。

## Testing

`pnpm run doc-sync` 通过 41/41 个门禁；`pnpm run typecheck` 与 `pnpm run lint` 干净（0 警告、0 错误）；Desktop 套件通过 30/30 个 Node 测试与 8/8 个 Rust 测试；客户端与 host 通道在 433 个文件中通过 6,182 个测试，另有 1 个跳过；scripts 通道通过 1,594 个测试、22 个跳过且无失败，上一轮记录的 `client-build-environment.client.spec.ts` 受负载影响的 5 秒超时本次没有复现。Desktop 冒烟测试会针对全新的 `DSH_HOME` 启动已部署的 sidecar，并断言所提供的索引文档带有 desktop bridge 与 overscroll 样式，正是这项检查发现了上面的 overlay 导入失败。
