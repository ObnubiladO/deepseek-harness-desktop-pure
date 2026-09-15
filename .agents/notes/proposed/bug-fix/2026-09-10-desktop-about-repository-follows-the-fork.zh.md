# Agent Note: Desktop 的“关于”与更新检查指向 fork 仓库

Status: proposed

[English](2026-09-10-desktop-about-repository-follows-the-fork.md) | 中文

## Problem

“关于”面板的 Repository 一行与 Desktop 的更新检查读取同一个值：已部署 runtime 清单（`desktop/runtime/package.json`）里的 `repository` 字段，由 `desktop/runtime/src/surface.ts` 作为 `DesktopInfo.repository` 提供。该值目前仍是 `https://github.com/cipherTing/deepseek-harness-desktop-pure`，即上游 Desktop 项目，因此“关于”面板会把用户带到一个并不承载本发行版构建产物的仓库。

同一个字符串还决定去哪里查找更新。`desktop/client-ui/src/client.js` 中的 `releasesUrl()` 从中匹配出 `github.com/<owner>/<repo>`，并拼出 `https://api.github.com/repos/<owner>/<repo>/releases/latest`，再由 `fetchLatest()` 读取其中的 tag、发行说明与平台资源。指向上游仓库时，更新徽标与“关于”页的检查都在比较上游项目的发行版：它们看不到发布在 fork 上的 Astra 版本；如果上游仓库某天发布了更新的 tag，还会提供上游的安装包。fork 的发行版已经使用检查逻辑所期望的资源命名（`deepdive-windows-x64-<version>.exe`、`deepdive-macos-arm64-<version>.dmg`）。

Author 一行是另一个值，当前已显示 `ObnubiladO, forked from cipherTing`，因此署名并不依赖这个字段。

## Proposal

在下一次 Desktop 构建中，把 runtime 清单的 `repository` 指向 `https://github.com/ObnubiladO/deepseek-harness-desktop-pure`。一个值即可同时修正可见链接与更新来源，因为两者本来就读它。Author 一行保持不变，署名并不是这个字段的职责。

## Alternatives considered

**只改 `client.js` 中渲染出来的链接。** 不采用，因为更新检查读取同一字段：面板会链到 fork，而徽标仍在比较上游发行版，这比今天单一来源的一致状态更糟。

**为更新来源新增第二个清单字段。** 不采用，没有必要：fork 既承载源码也发布发行版，一个仓库即可满足两种读取；新增字段还要再定义优先级规则。

**保留上游仓库并取消更新检查。** 不采用，因为更新路径已经实现并有测试覆盖，而它是已安装的 Desktop 获知更新 Astra 版本的唯一途径。

**同时改掉 README 中的问题反馈链接。** 超出本次范围，而且不是改一行的事：本 fork 关闭了 Issues，而上游项目开启了 Issues，因此 README 里的“反馈 Desktop 问题”链接是今天唯一可以提交 Desktop 报告的去处。要改指向，就得先在这里开启 Issues 或指定其他跟踪系统，那是另一个决定。README 的“Desktop build”徽标属于同类问题但没有这层约束，因为它渲染的是上游仓库的工作流状态，而不是本 fork 的运行结果。

## Acceptance criteria

- 改动之后构建的 Desktop 在“关于”面板的 Repository 一行显示 `https://github.com/ObnubiladO/deepseek-harness-desktop-pure`。
- “关于”页的检查与更新徽标请求 `https://api.github.com/repos/ObnubiladO/deepseek-harness-desktop-pure/releases/latest`，且对话框的下载动作解析到该发行版的 `deepdive-<platform>-<version>` 资源，而不是发行版页面。
- 只改动 `desktop/runtime/package.json` 这一处来源；Author 一行与 README 保持不变。
- `pnpm --filter @deepseek-ai/dsh-desktop test` 与 `cargo test --manifest-path desktop/src-tauri/Cargo.toml` 仍然通过。

## Risks

- GitHub API 对每个地址每小时只允许 60 次未认证请求。该检查由徽标或用户操作触发，并且在请求失败时本就不报告任何内容，因此触发限流只会让徽标消失，而不会报错。
- 若 `repository` 指向没有发行版的仓库，检查会静默地找不到更新，因此只有在那个仓库承载发布线时该改动才成立；fork 正是如此。
- 该值位于 `desktop/scripts/sync-version.mjs` 每次版本提升都会重写的清单中。该脚本展开解析后的清单并只替换 `version`，因此新值能在版本提升中保留；但未来的同步不得用上游清单覆盖它。
