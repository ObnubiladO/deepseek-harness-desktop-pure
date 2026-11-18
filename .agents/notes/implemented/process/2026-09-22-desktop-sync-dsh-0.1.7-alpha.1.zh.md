# Agent Note: Desktop 与 dsh-v0.1.7-alpha.1 的同步

Status: implemented

[English](2026-09-22-desktop-sync-dsh-0.1.7-alpha.1.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.1.6-alpha.2` 发布了 `0.1.17`。随后上游发布了 `dsh-v0.1.7-alpha.1`：1,299 个提交、4,754 个变更文件，其中 39 个文件两边都改过。该发行版用“计算出的运行时解析 + 投影到共享 profile 目录”取代了 profile fallback API，把客户端路由改为文档相对形式，围绕 `settings.launcher` slot 重做了设置外壳，把设置控制器缩减为单一可替换的文本编辑器打开钩子，重命名了 agent-preset 包，并新增了一个文档门禁。本次更新还必须一并交付本 fork 欠自己用户的回环 cookie 修复，而不是重置 fork 分支线。

## Decision

从 fork 顶点 `ed8c6ee0ec4b8544b7b7a05c39677363890f084b` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.1.7-alpha.1`（`c36a83ff6bb95e3f82cf79f9be7c724270a8aa61`），并在生成候选之前把回环 cookie 修复与版本提升叠加在其上。

- 手工集成：`5623df97889ee7532814be6dd2a086e6e4805621`（`integrate/dsh-0.1.7-alpha.1`），树 `25d02fb3d404ccf44c4e3bee043820eb24afad86`；十九个冲突按职责解析，随后 cookie 修复与运行时适配分别作为独立提交落地。
- 回环 cookie 修复：`d3750e30045fcfb0727553853e59244a10929f04`。
- 版本提升到 `0.1.18`：`c4c82626ef0fb705a9d825296ddef5414b599837`；插件补丁说明的引用修正：`c583fa11db6a8a68fb7e6a7353f12038eb0542bf`。
- 上游为根候选：`4dd62532bc832899b34b26d2de2cfd91d04eb205`，建立在已验证的 tag 提交之上，树相同，落后目标 `0` 个提交。
- master 落地：`6c8e2dad6eac68399a11ebcb8ded319f38e916a8`，第一父提交为原 fork 顶点，第二父提交为该候选，树与候选相等；冲突的三十三个路径全部解析为候选内容。

解析与适配：

- 根 README 保留 fork 的结构，并加入上游的 `## Development` 章节及其 `pnpm run dev:web` / `make help` 一句，同时镜像进 `README.en.md` 与 `README.zh-CN.md`；fork 删除的 `README.zh.md` 保持删除，上游对应的中文句子并入 `README.zh-CN.md`。
- 设置外壳在承载上游 `settings.launcher` slot 的列中保留 Desktop 可选的 `settings.update` 席位，两个测试同时服务该席位与 launcher fallback。
- 各包 README 围绕上游改写保留 fork 段落：带 `ctx.configForms.describe()` 的 `settings.update` 席位说明、WebSocket 1006 分类，以及在上游文档相对导出路由之上的保存载体段落。Desktop 下载载体在交给原生导出命令（其校验绝对同源 URL）之前，把该相对路由解析为绝对地址。
- `desktop/runtime/src/sidecar.ts` 用 `linkDesktopPackages` 取代被移除的 `healProfilesModuleFallback` 播种与被取消的 `resolutionMode` 选项：alpha.7 会把它计算出的解析投影进 `<home>/profiles/node_modules`，Desktop 自有的插件包必须占据该层，否则每一行 overlay 都会导入失败。
- `desktop/runtime/src/settings-controller.ts` 改为传入唯一保留的集成点 `openTextFile`，不再使用已被移除的 `openPath`/`canOpenPath`/`nativeOpen` 钩子。
- `scripts/rescope-vendor.ts` 采用上游的登记表（其中的条目已迁往其他包），lockfile、客户端 slot 目录与配对记录均为重新生成。

保留项：Desktop 打包与品牌、`settings.update` 席位、fork 的 WebSocket 1006 传输分类，以及完整标题规则。

## 回环 cookie 修复（0.1.18）

浏览器会话 cookie 的名称此前由请求 authority 推导，因此每次随机端口启动都会铸出一个新的持久 cookie，且互不覆盖；累积的 `Cookie` 头最终越过 Node 默认的 16 KiB 上限，所有请求都返回 431。现在 cookie 使用固定名称 `dsh-auth`，authority 仍绑定在签名载荷内并逐请求校验。Desktop 启动清理同时接受裸名与此前的 `dsh-auth-<43 base64url>` 旧形式，因此 0.1.18 首次启动即可删除早前 0.1.x 累积的 cookie；webserver 另把 `maxHeaderSize` 提高到 64 KiB 作为影响范围上限。已有安装无需手动清理。这是一处树内改动，每次上游同步都必须重新应用：harness 各包是 `file:` 链接，pnpm `patchedDependencies` 无法承载它；它也被有意排除在本地多窗口分支之外——那里两个并发的已认证 sidecar 会互相覆盖 cookie，隔离手段只能是按窗口划分的 WebView 数据目录。

## Alternatives considered

停留在 `0.1.6-alpha.2` 会让 Desktop 依赖一个已被移除的启动 API，并留下未修复的 cookie 缺陷。用上游树替换 fork 树会丢掉 Desktop 打包、品牌、更新席位与标题增量。逐字重实现被移除的 heal 函数不如直接占据上游现在投影所用的那一层，因为那才是 profile 启动真正查询的机制。本次不改用 `resolvedProfile` 载入 profile，因为那会绕过具名 profile 初始化，而该 profile 必须继续与 CLI 共用。再次手工裁定落地冲突也被否决：落地树必须与已校验的候选完全一致。

## Consequences

Desktop 能以同步后的 runtime 启动且全部 overlay 行均激活；两处新适配位于上游自有的调用点，下一次同步必须重新检查。Desktop 在该基线上独立发布 `0.1.18`。多窗口功能仍属 fork 本地特性，不属于本次同步。

## Testing

`pnpm run doc-sync` 通过 42/42 个门禁（上游新增一个）。`pnpm run typecheck` 与 `pnpm run lint` 干净（0 警告、0 错误）。Desktop 套件通过 30/30 个 Node 测试与 9/9 个 Rust 测试。`pnpm exec vitest run packages/client/connection` 通过 165 个测试，其中包括“为两个 authority 铸造、断言只有一个共享 cookie 名且跨 authority 被拒绝”的回归；`cargo test --manifest-path desktop/src-tauri/Cargo.toml sidecar_auth` 通过清理选择测试（仅删除裸名与旧式回环登录 cookie）。客户端与 host 通道通过 7,333/7,337，scripts 通道通过 2,116/2,143，其中三个受负载影响的 5 秒超时在单独运行那两个 spec 时 33/33 全部通过。客户端与 host 的四个失败是环境相关：上游新增的 `ui-settings-account` 包通过 `Number.prototype.toLocaleString()` 格式化余额，而本机默认区域为 `es-ES`，不会给 `1234` 加逗号分组，因此期望 `¥1,234.56` 的断言在此失败，在英文默认区域下通过。

Desktop 冒烟测试针对全新的 `DSH_HOME` 启动已部署 sidecar，并断言所提供的索引文档带有 desktop bridge 与 overscroll 样式；正是这项检查先后发现了缺失的解析层与被替换的设置控制器钩子。

## Environment note

工作区中累积了十二个来自早前上游重命名的孤儿包目录（`packages/e2b/*`、`packages/code-runtime/*`、`packages/settings/settings-file`、`packages/preset/agent-presets` 等）：Git 不跟踪它们，但 tsdown 的 `packages/*/*` 工作区 glob 仍会发现它们。它们残留的构建产物两次导致 host 构建失败——先是缺失的 `SettingsProvider` 导出，后是归因于 `@deepseek-ai/dsh-root` 的 `Cannot find entry`——直到这些目录被删除。同步中若移除或重命名了包，之后应检查此类目录。
