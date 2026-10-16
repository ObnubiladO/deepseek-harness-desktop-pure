# Agent Note: Desktop 与 dsh-v0.2.0-rc.2 的同步

Status: implemented

[English](2026-09-28-desktop-sync-dsh-0.2.0-rc.2.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.0-rc.1` 发布了 `0.2.0`。随后上游发布了 `dsh-v0.2.0-rc.2`：187 个提交、1,022 个变更文件，其中 15 个文件两边都改过。该发行版没有移动本 fork 的任何适配点——回环 cookie 名称、`maxHeaderSize` 上限、profile 解析、设置控制器、设置外壳、插件兼容门禁与 typert 协议都与上一个标签完全一致——但它改动了 `packages/llm/llm-pi-ai`，这一点要紧，因为 `dsh-codex-provider` 会写入该插件的设置条目。它还新增了一个文档门禁，因此门禁总数从 42 变为 43。

## Decision

从 fork 顶点 `b895e35ad2` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.0-rc.2`（`639ed015397290b3745d163aafe02ffee4aa3f84`）。

- 手工集成：`129b8982d5`（`integrate/dsh-0.2.0-rc.2`），树 `9d5d3f571c`；七个冲突，全部是文档记账。
- 上游为根的候选：`182ca05c16`，位于已验证的标签提交之上，树相同，落后目标 `0` 个提交。
- master 落地：`d29c13ffa1`，第一父提交是此前的 fork 顶点 `b895e35ad2`，第二父提交是候选，树与候选相等；落地合并出现分歧的十三个路径全部解析为候选。

解析与适配：

- 本 fork 删除的根 `README.zh.md` 与 `README.i18n.yaml` 保持删除，即使上游修改了两者；该表面由本 fork 自己的 README 三件套及其配对记录覆盖。
- 根 `README.md` 保留本 fork 的版本与发行条目，并把上游的三个社区条目加在其自有的 `## Community and support` 标题下——那正是上游存放它们的位置。
- `packages/llm/llm-pi-ai/README.md` 及其中文对应文件保留本 fork 的 WebSocket 1006 传输分类段落，并采用上游改写后的回放段落。配对记录依据解析后的内容重新录制；第一次尝试留下的陈旧记录直到运行 `verify-translation-pairing --write` 才被修正。
- `scripts/doc-budgets.manifest.json` 保留本 fork 的 `AGENTS.md` 上限，并把合并后的 `AGENTS.md` 压缩回该上限之内——周期行减少了四个词——而不是提高上限，这正是 `docs/AGENTS.md` 所要求的。第一次集成尝试恰好因该门禁失败，说明门禁在正常工作。
- `packages/llm/llm-pi-ai/src` 在本发行版中确有改动，涉及模型兼容门与回放处理。本 fork 欠固定插件 `dsh-codex-provider` 的审计之所以覆盖该包，是因为插件会写入 `llm-pi-ai` 条目：插件写入的 `providers` 配置形状未被改动，而改动的是插件从不读取的模型兼容记账代码。

保留不变：Desktop 打包与品牌、`settings.update` 席位、本 fork 的 WebSocket 1006 传输分类、完整标题的头部规则、固定的 `dsh-auth` cookie 名称及其启动清理、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体，以及更新席位的 semver 优先级。

## Version choice

Desktop 版本采用补丁号递增到 `0.2.1`，而不是 `0.2.0-1` 这样的预发布后缀，因为本 fork 自己的更新席位按 semver 优先级比较版本：`isNewer("0.2.0-1", "0.2.0")` 为 false——预发布版本低于其正式版本——因此 `0.2.0-1` 构建永远不会被提供给已经处于 `0.2.0` 的用户。同一规则也保证 `0.2.1 → 0.2.2` 正常工作。

## Third-party plugin status

`dsh 0.2.0-rc.2` 使先前为 `0.2.0-rc.1` 授予的精确版本豁免失效：门禁被限定为一个插件版本加一个运行时版本，因此在本次运行时上 `dsh-codex-provider@0.1.0` 会再次被跳过，直到重新授予豁免。对随包运行时做无头启动可以确认这一点——`skipping profile bundle "dsh-codex-provider"`——同时也确认了上一轮的配套修复：`dsh-codex-usage@0.1.2-preview.9` 在同一次启动中保持激活，而不再停留在 pending，这正是去掉那个幽灵注入的意义。审计覆盖的四个表面在本次发行版中没有变化，只有上述目录内部改动。

## Alternatives considered

提高 `AGENTS.md` 上限而不压缩被否决：文档标准要求先搬迁或压缩，而超出上限两个词并不构成理由。保留上游对已删除 README 的改动被否决，理由与本 fork 当初删除它们相同。按字面要求发布 `0.2.0-1` 被否决，这是在检查更新席位的比较代码之后：那会让所有已经处于 `0.2.0` 的用户被无声地落在后面。在同步过程中顺带重新授予插件豁免被否决，因为该决定属于检查清单的分阶段流程——先审计、再功能验证、然后按 home 授予。

## Consequences

Desktop 在此基线上推进独立的 `0.2.1` 发行，版本线保持应用内更新器的诚实。第三方插件包的使用者必须为 `0.2.0-rc.2` 重新授予豁免或更新这些插件；配套插件现在会以可见方式降级，而不是直接消失。多窗口特性仍是 fork 本地特性，不属于本次同步。

## Testing

`pnpm run doc-sync` 通过 43 项门禁中的 43 项（上游新增一项，而文档预算门禁在修复前抓住了合并后的 `AGENTS.md`）。`pnpm run typecheck` 与 `pnpm run lint` 均干净（0 警告、0 错误）。Desktop 套件针对重建的 `0.2.1` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 做无头启动可正常就绪，且没有任何 `failed to import` 行。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行即通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败（9,510 项中通过 9,506 项）。

## Environment note: repository recovery

在写入本轮落地提交时机器崩溃。损坏仅限于 Git 自身的记账：`refs/heads/master` 恢复后为零填充，`.git/index` 损坏，工作树部分文件被零填充。所有对象都存活，包括本轮的全部三个提交，因此恢复是机械性的——记录已知良好的 SHA、把 `refs/heads/master` 恢复到落地提交、删除索引、执行 `git reset --hard`。之后 `git fsck --connectivity-only` 干净，`git update-index --really-refresh` 报告没有修改文件。仓库之外没有任何东西受损：两个 harness home、它们的 profile 与豁免记录、会话日志、已安装应用与暂存安装包，都通过首部字节与内容检查确认完好。两条值得记住的教训：不要把耗时的 `git reset --hard` 输出管道接到会提前关闭管道的消费者上；任何崩溃之后都应核实真正幸存的内容，而不是相信最后已知状态。
