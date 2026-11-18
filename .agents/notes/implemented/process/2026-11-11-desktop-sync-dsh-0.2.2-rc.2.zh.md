# Agent Note: Desktop 与 dsh-v0.2.2-rc.2 的同步

Status: implemented

[English](2026-11-11-desktop-sync-dsh-0.2.2-rc.2.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.2-rc.1` 发布了 `0.3.0`。随后上游在同一次版本线上发布了 `dsh-v0.2.2-rc.2`：1,568 个提交、4,645 个变更文件（+160,844/−58,399）。

有三处变更触及本 fork 自有的行为。Session 导出对话框变成了根层浮层，按发起顺序一次只显示一个导出；这为每个发布的状态增加了 `order` 字段，并加入了「已销毁的控制器不再开始保存」的守卫。设置启动器的 `openSettings` 增加了按分区定位的能力。CLI 启动器也不再直接导入 `profile-boot` 门面，而本 fork 的运行时构建脚本此前正是通过解析这一导入来找到它的。

部署本身也不完整。本版本引入的 `@deepseek-ai/dsh-error` 是十个已部署包的 peer，另有两个更早的 peer 自 `rc.1` 起就一直缺失：被 `dsh-api-session-controller` 导入的 `dsh-util-workspace-path`，以及被 `dsh-sdk-jsonrpc-server` 导入的 `dsh-sdk-protocol`。三者都是真实的运行时导入，从部署中加载时都会以 `ERR_MODULE_NOT_FOUND` 失败；其中只有 `dsh-error` 会在启动时被触及。

## Decision

从 fork 顶点 `1c589188d5` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.2-rc.2`（`ddac96760b6edf8fa0fe17cbdcf0b512f4c12b2c`），并以 Desktop **0.3.1** 发布：补丁号提升，因为 Desktop 的次版本号只随上游版本线变化。

- 手工集成：`c5d166da7f`，树 `6aae8b2406`；六个冲突。
- 上游为根的候选：`185146e86c`，树相同，落后目标 `0` 个提交。
- master 落地：`19a3214dc6`，第一父提交是此前的 fork 顶点 `1c589188d5`，第二父提交是候选，树与候选相等；落地合并出现分歧的十九个路径全部解析为候选。fork 领先上游 127 个提交，落后 0 个。

各项解析都调和了两边的意图：

- **`SettingsRoot.tsx`** 采纳上游支持分区定位的 `openSettings`，并保留本 fork 的 `triggerColumn` 包裹层及其 `settings.update` 渲染，即 Desktop 更新席位。
- **`session-log-export`** 采纳上游的 FIFO 浮层与按操作的 `order`，并保留本 fork 可等待的原生保存载体、`cancelled` 状态与 `successMode`。上游「销毁后不再保存」的守卫被延伸到可等待的原生保存之后：原生对话框可能比销毁存活得更久，此后控制器不得再发布任何状态；这一 await 之后的检查沿用了上游自己的 lint 写法，用来说明 TypeScript 无法跨越 `await` 看到的收窄。
- **两份导出测试** 均以上游重写后的测试套件为基础（包括其八个新测试），再加入本 fork 的原生保存测试、一个针对延伸后守卫的销毁测试（移除守卫时它会失败），以及一个测试：被取消的原生保存不会在上游 FIFO 中留下模态框。
- **`desktop/runtime/package.json`** 声明了全部三个缺失的 peer；`desktop/scripts/finalize-runtime.mjs` 现在会在任一已部署的 `@deepseek-ai` 包无法在部署内解析其非可选的 `@deepseek-ai` 依赖或 peer 时让部署失败。它报告 339 个包全部可解析；隐藏 `dsh-error` 时，它会点名该包及其十个依赖方。
- **`desktop/scripts/build-runtime.mjs`** 改为读取稳定的 `lib/profile-boot.js` 门面，并在其不再导出 `runProfile` 时立即失败。
- **`desktop/scripts/verify-merge-survival.mjs`** 是新增脚本：针对两边都修改过的文件，列出任一方新增、但已不在工作区中的行。同步技能现在要求在提交集成之前运行它。

`AGENTS.md` 中的完成检查被原样迁入同步技能，以保持在文档预算之内；其余规则保留原有措辞。

## Alternatives considered

整体采用冲突文件某一边的做法被否决——本轮就已经这样做过一次，结果两边的工作都有丢失。为 await 之后的检查放宽 lint 规则、或改写检查来绕开 TypeScript 的收窄，均被否决，改用上游在同样情形下已经使用的禁用注释。把两个更早缺失的 peer 留待以后处理被否决，因为在已知缺口存在时无法强制执行闭包门禁。把本 fork 的 `@deepseek-ai/dsh-desktop` 包改名以消除它与上游 `apps/desktop` 的冲突一事被推迟：这个问题早已存在，没有影响过任何一次发布，而且会涉及根脚本与 CI，应当单独决定。

## Consequences

Desktop 在此基线上推进独立的 `0.3.1` 发行。若第三方插件包自身的范围不覆盖运行时 `0.2.2-rc.2`，需要为其重新授予豁免。

发布工作流的 macOS 任务从 `macos-14` 改为 `macos-latest`，即上游自己用于 Apple 芯片的标签：GitHub 在本轮期间停用了 `macos-14` 镜像，第一次发布运行在分配运行器之前就被拒绝了。

`0.3.0` 的用户潜在地带着那两个更早的 peer 缺口。两者在正常使用中都不会被触及：会话控制器的浏览器包已内联该导入，而 DeepDive 的 `web` profile 不会启动 SDK JSON-RPC 服务器。`0.3.1` 补上了这两个缺口，新门禁也让无法解析的 peer 不会再次被发布。

`@deepseek-ai/dsh-desktop` 的名称冲突仍然存在：`desktop/` 与上游的 `apps/desktop` 同名，因此 `pnpm --filter @deepseek-ai/dsh-desktop` 会同时匹配两个包，`scripts/local-bundle-registry.spec.ts` 也因重复的包名而失败。

## Testing

构建编排器通过 10/10 项门禁。部署包含 40,748 个文件，版本戳为 `0.3.1`，内核与本 fork 的 sidecar 标记均存在。Desktop 套件通过 31/31 项 Node 测试（其中包括会实际走过 `profile-boot` 桥接的 sidecar 冒烟测试）以及 9/9 项 Rust 测试。`pnpm run doc-sync` 通过 43/43 项门禁，`pnpm run typecheck` 通过 5/5 项，`pnpm run lint` 没有错误，只有一个警告，位于上游未经修改的 `client-ui-cot-translation` 中。两个受影响的包通过 245/245 项测试。对默认 `web` profile 的无头启动可正常就绪，兼容性检查报告运行时为 `0.2.2-rc.2`。

`gui` 泳道通过 13,622 项测试，失败的恰好是已知的三项依赖语言环境的 `ui-settings-account` 断言。`scripts` 泳道通过 3,773 项测试，在三个文件中失败六项，它们在 `0.3.0` 中同样失败：三项需要本机所没有的 PowerShell 7（`pwsh`）；两项期望未加引号的 Node 路径，而本机的 Node 位于 `C:\Program Files` 之下；一项即上文所述的名称冲突。

## Environment note: losses that tests written by one side cannot see

第一轮解析中，六个冲突文件里有三个是整体采用了某一边。`SettingsRoot.tsx` 采用了上游版本，悄无声息地丢掉了 Desktop 更新席位；两份导出测试采用了本 fork 的版本，悄无声息地丢掉了上游的八个新测试。随后该包的测试以 123/123 通过，但这一结果对上游的新行为毫无说明力，因为上游的新测试已经一个都不在测试套件里了。

本应发现问题的检查被概括了，而不是被阅读。`gui` 泳道报告的失败是五项而非已知的三项，多出的两项正是断言更新席位的 `SettingsRoot trigger` 测试；它们却凭退出码被归入了已知失败。一次 lint 失败被解释为合并后控制器中 rejection 路径的问题，而它的日志显示的是十一处缩进错误和两个多余的可选链。`0.3.0` 的 `scripts` 泳道有分布在六个文件中的十一项失败，报告里却只描述了一个不稳定的 spec。

有三项改动防止这种情况再次发生：`verify-merge-survival.mjs` 能在几秒内暴露被丢掉的一边，其反向对照恰好标出了更新席位丢失的那两行；同步技能要求按失败清单来判断带有已知失败的泳道；部署门禁则把缺失的 peer 变成一次会点明自身修复方式的构建失败。这一门禁覆盖的失败与 `0.2.2`、`0.2.3` 的部署故障不同：那两次是本 fork 仍在声明上游已删除的包，pnpm 本身就会大声拒绝；而缺失的 peer 会一直静默失败，直到有代码导入它。
