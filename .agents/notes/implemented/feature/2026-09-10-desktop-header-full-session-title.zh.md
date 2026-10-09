# Agent Note: Desktop 会话标题在对话头部完整显示

Status: implemented

[English](2026-09-10-desktop-header-full-session-title.md) | 中文

## Problem

对话头部从 `ConversationRoot.module.css` 渲染会话面包屑，而其中每个 crumb 都被限制为 `max-width: 220px`。当前会话自身的标题也是一个 crumb，因此即使标题完全放得下，它仍会以截断形式出现，而头部中段的空白却保持空闲：43 个字符的标题 `Audit CPU Undervolting Automation Project (9)` 在用户那里显示为 `Audit CPU Undervolting Auto…`。DeepDive 用户依靠标题来辨认和切换会话，而被截断的标题与一个恰好在那里结束的更短标题无法区分。

## Decision

当前 crumb 不再沿用祖先 crumb 的宽度上限，且每个 crumb 现在都能在这个 flex 行内收缩到内容宽度以下：在 `packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css` 中，`.crumbCurrent` 设置 `max-width: none`，`.crumb` 增加 `min-width: 0`。

- 当前标题占用祖先 crumb 与尾部头部控件让出的宽度。这些控件（`.headerActions`、`.headerUtilities`、`.headerCorner`）都是 `flex: none`，因此标题只扩展到没有其他元素占用的空间。
- 祖先 crumb 保留 220px 上限，使父会话与子代理的链条保持紧凑，并把当前标题需要的空间留给它。
- `overflow: hidden`、`text-overflow: ellipsis` 与 `white-space: nowrap` 保持不变，因此窗口确实过窄时仍显示一行截断文本，而不会覆盖头部控件或标签栏。

这是 fork 在上游文件中的自有差异，因此同步时若上游改动了 `.crumb` 必须合并而不是覆盖，集成审查也要重新确认当前 crumb 没有宽度上限。

## Alternatives considered

**保留上游上限，改从别处读取标题。** 窗口标题栏与侧边栏悬浮卡都带有完整标题，头部本可以完全保持上游原样。不采用：头部正是工作时阅读标题的位置，需要悬浮或窗口管理器提示才能读到的标题，比不上直接放得下的标题。

**把标题折成两行。** 不采用：头部是最小高度 30px 的一行，标签栏紧随其后，再往下是对话滚动区，因此过长的标题会把标签栏和对话区整体推移。

**给 crumb 增加悬浮展开。** 作为显示标题的替代方案不采用：它为一个头部本就有空间直接解决的问题重复了侧边栏的悬浮卡，而且对放得下的标题毫无作用。

**去掉省略号，让标题溢出。** 不采用：没有 `text-overflow` 的 nowrap 行在窄窗口下会把标题画到模式标签和头部控件之上。

## Consequences

只要窗口有空间，头部就完整显示会话标题；没有空间时保持上游的单行省略行为；祖先 crumb、模式标签与尾部控件都不受影响。DeepDive 因此在上游自有的样式表中多了一处差异，下一次同步必须保留它。

## Testing

没有测试固定这一几何结果：所属客户端测试运行在 jsdom 中，而 jsdom 不计算布局；Playwright 的 web 测试通道（`apps/web/tests/*.e2e.ts`）在 Windows 上跳过。改动改为针对构建后的 Desktop 应用验证：检查打包后的客户端样式表是否包含该规则，并阅读标题长度超过祖先上限的会话头部。
