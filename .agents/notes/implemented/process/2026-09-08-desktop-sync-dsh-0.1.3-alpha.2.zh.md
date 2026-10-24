# Agent Note：Desktop 同步 dsh-v0.1.3-alpha.2

Status: implemented

[English](2026-09-08-desktop-sync-dsh-0.1.3-alpha.2.md) | 中文

## 问题

分支包含 pi-ai 0.84.2 的 Astra 目录回移补丁和 Codex WebSocket 重试修复。升级 Harness 必须逐项核对上游变更，避免保留过时的依赖补丁。

## 决策

从分支提交 `14f453e95d700dabb839d70d3db8501fa634de3a` 手动合并 `dsh-v0.1.3-alpha.2`，其提交为 `82a5fd61a7cf5c293cec4bdff68f455398d685e9`，审查后生成以该上游提交为根且文件树相同的候选分支。保留 Desktop 打包、原生导出、更新插槽、英文 README 和独立 Desktop 版本。

采用上游 pi-ai 0.85.1 及其适配器变更。移除 pi-ai 0.84.2 目录补丁和锁文件注册，因为新目录直接提供 Astra。保留 alpha.2 尚未包含的 `WebSocket closed 1006` 传输错误分类及测试。调用方取消、认证、配额和无效请求错误继续优先分类。

## 考虑过的替代方案

保留回移补丁会留下针对旧版本的冗余补丁。删除重试修复会导致 Codex WebSocket 异常关闭后的恢复能力退化。用上游覆盖分支文件树则会丢失 Desktop 集成和可审查的祖先关系。

## 影响

安装后的目录必须通过已认证的 Desktop 模型发现端点提供 Astra 和现有 Codex 模型。验证 pi-ai 适配器、Desktop 配置与界面、构建后运行时的启动和关闭以及锁文件。目录可见性不证明推理权限。额度伴随插件继续独立安装，不在本次同步中捆绑。
