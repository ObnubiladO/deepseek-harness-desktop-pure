# Agent Note: Desktop 图片拖拽交接与松手反馈

Status: implemented

[English](2026-08-24-desktop-image-drag-handoff.md) | 中文

## Problem

浏览器图片附件入口已经支持整页文件拖放，经输入栏完成校验，并展示共享的 `DropOverlay`。Tauri 默认的原生拖放处理器会接管操作系统文件，并发出路径而不是携带 `File` 对象的浏览器 `DragEvent`，因此 Desktop 无法稳定走进该入口，也不能在成功松手后给出确认反馈。

## Decision

Desktop 的 `WebviewWindowBuilder` 会关闭 Tauri 原生拖放处理器。现有 document 级输入栏监听器接收浏览器 `File` 对象，并继续作为图片准入、忙碌和锁定拒绝、草稿附件创建以及提交的唯一所有者。

Desktop 客户端插件只观察这些浏览器拖放事件。它从 `data-shell-overlay` 的父元素及其相邻侧栏列推导工作区矩形，并在文件拖入时同步把该矩形写入 document 根节点的 CSS 变量。这样 body portal 中已有的 `DropOverlay` 会直接挂载在工作区，不会先画出全窗口的一帧。侧栏保持清晰，不会被模糊。接受拖放时，视觉与无障碍提示都会改为“松开即可添加”/“Release to add”，并隐藏数量和大小说明；被拒绝的拖放保留共享的禁用文案。浏览器报告 `dropEffect: 'copy'` 时，插件会在松手位置绘制一个短促的对勾脉冲。减少动态效果的用户会得到相同的状态切换，但不播放动画。

Desktop 不会向 WebView 暴露拖入文件的文件系统路径，也不会新增原生上传命令、文件系统权限或并行的附件链路。

## Verification

Desktop 源码测试会固定 Tauri 处理器已关闭。Desktop 客户端交互测试覆盖工作区 inset、接受拖放时的简洁文案、边缘坐标钳制、松手清理以及输入栏拒绝文件时没有确认反馈。共享附件测试继续覆盖 `File` 准入、上限和锁定输入栏的拒绝。

## Alternatives considered

- **把 Tauri `onDragDropEvent` 路径接到原生上传命令。** 不采用，因为这会绕过浏览器持有的 `File` 准入路径、向 WebView 暴露文件系统路径，并重复附件所有权。
- **为了 Desktop 视觉修改共享附件包。** 不采用，因为 Web 交互已经正确，视觉处理只是在补偿 Desktop 原生 WebView 的接入差异。
- **每次文件 drop 都显示成功动画。** 不采用，因为锁定或忙碌的输入栏会故意拒绝文件；`dropEffect: 'copy'` 才是浏览器接受拖放的信号。

## Consequences

Desktop 与 Web 复用同一套图片校验和草稿生命周期，同时 Desktop 提供原生应用应有的更强拖入聚焦和松手反馈。若要重新开启 Tauri 原生处理器，必须完整替换为仍能向现有输入栏提供浏览器 `File` 对象的实现；只传路径的桥接并不等价。
