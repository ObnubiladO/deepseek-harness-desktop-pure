# Agent Note: Desktop 与 dsh-v0.2.2-rc.1 的同步

Status: implemented

[English](2026-11-04-desktop-sync-dsh-0.2.2-rc.1.md) | 中文

## Problem

本 fork 此前基于 `dsh-v0.2.1-rc.5` 发布了 `0.2.8`。随后上游发布了 `dsh-v0.2.2-rc.1`，这是一个**新的次版本线**：2,623 个提交、8,120 个变更文件，净删除约 32.4 万行。这是本 fork 迄今吸收的最大、也最具结构性的增量，也是第一次改变上游的次版本而非补丁号。

这次有三个适配点落在影响范围内。`packages/host/webserver/src/index.ts` 被重写（+197/−43）。设置外壳及其注册被重构。而本 fork 自己的 `session-log-export` 本地化补丁被证明是不完整的。

合并之前，工作区里还存在与本轮无关的改动：五个未提交的 `llm-pi-ai` 文件，实现了 `requestImageMaxDimension`。它被用 `git stash` 保存下来，既未提交也未丢弃，因为那不是本轮该落地的内容。

## Decision

从 fork 顶点 `e0b98b517b` 出发，以经过审阅的手工合并与树相等的上游为根候选，集成 `dsh-v0.2.2-rc.1`（`66491b05e3f05ad35bcdd4f6cd7ed26041d9e3db`），并以 Desktop **0.3.0** 发布——次版本号提升，由仓库所有者选择，因为上游次版本变更且删掉近三分之一代码树，不属于补丁级事件。

- 手工集成：`9c988732f4`（`integrate/dsh-0.2.2-rc.1`），树 `51cfb85ba0`；七个冲突。
- 上游为根的候选：`1e55cb7b9c`，树相同，落后目标 `0` 个提交。
- master 落地：`343a3e2871`，第一父提交是此前的 fork 顶点 `e0b98b517b`，第二父提交是候选，树与候选相等；落地合并出现分歧的二十三个路径全部解析为候选。

解析全部通过阅读两边意图完成：

- **请求头上限无需干预即存活。** 上游重写了监听器；本 fork 的 `createServer({ maxHeaderSize: 64 * 1024 }, listener)` 插入被自动合并，仍位于第 566 行，无需重新推导。
- **设置注册**保留了两边：本 fork 的 `settings.update` 席位被重新插入上游重构后的 `ctx.slots.register`，后者现在还声明了 `settings.section.icon`。`SettingsRoot.tsx` 的冲突仅在文档注释层，上游关于响应式布局的说明现已写在那里。
- **`session-log-export` 本地化补丁被补全，而不是被放宽。** 本 fork 只给 `zh` 和 `en` 添加了 `dialog.savedTitle` 与 `dialog.savedDescription`。在其他字典尚未被类型化时这个缺口不可见；上游的重构会按模式逐字典检查类型，于是构建以 `TS2741`/`TS2739` 精确报出这两个键。修复方式是为 `ja`、`es`、`fr`、`de`、`ru`、`pt` 补上真正的译文——没有用 `any` 断言，也没有削弱类型。

保留不变：Desktop 打包与品牌、`settings.update` 席位、WebSocket 1006 传输分类、完整标题的头部规则、唯一共享的 `dsh-auth` cookie 名称、`maxHeaderSize` 上限、部署中的 DeepSeek 账户包与 LLM 基础包、插件补丁载体、更新席位的 semver 优先级，以及 sidecar 中的 `linkDesktopPackages`——已在重建的 31,972 文件部署中确认存在。

## Alternatives considered

放宽本地化类型被否决：类型检查发现的是本 fork 自己补丁中的真实不一致，压制它会让七种语言缺少 Desktop 保存对话框流程实际渲染的两个键。把这批 `llm-pi-ai` 改动混进本次同步被否决，理由与两个轮次前停放父项目 Desktop 差异相同——一次同步应当只承载一条变更线，别人尚未完成的功能不属于它。`SettingsRoot.tsx` 的文档注释整体采用上游版本被接受，因为本 fork 追加的那句话与上游重写后的段落不兼容，而该席位本身由 slot 注册记录。

## Consequences

Desktop 在此基线上推进独立的 `0.3.0` 发行。第三方插件包需要为运行时 `0.2.2-rc.1` 重新授予豁免；没有豁免时用量配套插件仍会加载。

一个长期存在的小麻烦消失了：`verify-repository-references` 不再把 `python/sdk/uv.lock` 判定为提交哈希，也就是说 `0.2.4` 到 `0.2.8` 各轮记录的误报已被上游修复。文档门禁在本系列中首次全部通过 43/43。

`llm-pi-ai` 的改动仍保存在 `git stash@{0}`，应当被有意识地恢复，并在此之前判断它是否仍适用于重构后的包。

## Testing

`pnpm run doc-sync` 通过 **43/43** 项门禁，其中包括在修正了上一轮笔记中两个指向不存在文件名的语言切换链接之后的配对检查。`pnpm run typecheck` 与 `pnpm run lint` 在重构后的代码树上均干净（0 警告、0 错误）。构建编排器报告 `10 passed, 0 failed`，Desktop 套件针对重建的 `0.3.0` 包通过 30 项 Node 测试中的 30 项，并通过 9 项 Rust 测试中的 9 项。对默认 `web` profile 的无头启动可正常就绪，没有任何 `failed to import` 行，也没有用量配套插件的 pending 行；兼容性检查报告运行时为 `0.2.2-rc.1`。`scripts` 泳道有一项负载敏感的 spec 失败，单独运行可通过；`gui` 泳道保留三项依赖语言环境的 `ui-settings-account` 断言，它们在本机此前就已失败。

## Environment note: three self-inflicted errors, and the measuring problem behind two of them

本轮犯的错误比以往任何一轮都多，而其中只有一个是代码问题。

**一次 cp1252 写入损坏了 `AGENTS.md`。** PowerShell 的 `Set-Content` 在未指定 `-Encoding` 时按系统代码页写入，于是文件里的破折号变成单字节，不再是合法 UTF-8。读取工具通过拒绝该文件发现了它。修复方式是从索引恢复合并后的 blob，并用显式 UTF-8 写入器重新施加编辑；中文 README 经逐字节验证未受影响。

**一次替换删掉了本应保留的行。** 第一次本地化插入把每行 `dialog.successDescription` 替换掉了，而不是在其后追加，结果删除了类型随后报告缺失的那个键。类型检查器的报错精确且正确。

**非 ASCII 字面量无法穿过 `pwsh` 命令字符串。** 它们到达时已经是乱码（`Ã©tÃ©`），于是译文被移入一个以 UTF-8 文件形式写出的 Node 脚本，之后一次即落地正确。

而在其中两个错误背后，一个**测量问题**造成的伤害比缺陷本身更大：`Get-Content` 在未指定 `-Encoding` 时按 ANSI 读取，因此**合法的 UTF-8 中文会显示成乱码**，我早先的诊断已经因此产生过一次误报。本轮我有两项检查正是这样错的——那次「所有已暂存文件都非法」的警报，其原因是用 `git show > file` 重定向写出了 UTF-16；以及让正确笔记看起来被损坏的显示。前几轮的教训同样适用于调查本身：当一个检查报出骇人的结论时，先验证那个检查器，再相信警报。
