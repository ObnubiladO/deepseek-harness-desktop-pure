# Agent Note: 基于 dsh-v0.1.3-alpha.1 的 Desktop Astra 构建

Status: implemented

[English](2026-09-05-desktop-astra-dsh-0.1.3-alpha.1.md) | 中文

## Problem

`dsh-v0.1.3-alpha.1` 内置的 Codex 模型目录缺少 `gpt-6-astra`。导入官方 Codex 凭据不会更新这个静态列表，因此拥有 Astra 访问权限的账户无法通过默认目录选择该模型。

## Decision

Desktop 候选版本从分叉提交 `0f32029dbf044dfcb6a0ee46ae97ac8c46e01856` 出发，通过经过审查的手动合并集成上游 `dsh-v0.1.3-alpha.1`，其提交为 `d347e703908d0406b7a7ef80e3a0e594d86b2215`。Desktop 使用独立测试版本 `0.1.12-astra.1`。合并保留 Desktop 原生会话保存和更新入口，同时采用上游基于句柄的会话导出与规范日志文件名。

[依赖补丁](../../../../patches/@earendil-works__pi-ai@0.84.2.patch) 只将 `@earendil-works/pi-ai@0.84.2` 中的 Codex 目录 JSON 替换为 `0.85.1` 发布的对应原始文件。原有七个条目保持不变，唯一新增项是 Astra。pnpm 锁文件记录补丁哈希。源压缩包的 npm 完整性值为 `sha512-+VgVIJDkDO2efYJKEEqvPTH4zmnIaXdAppGbO+vKFA9qy5PdhFiAenuFAkU+oiCSfOC4dMHDyrjdQeL4ZoC5CQ==`。

## Alternatives considered

**将完整 pi-ai 依赖升级至 0.85.1。** 新增的必需思考与兼容性字段使 alpha 适配器无法通过编译。仅修改目录的补丁无需变更适配器或其他供应商行为。

**在用户设置中声明 Astra。** 非空自定义模型列表会替换供应商目录，并要求用户维护元数据。内置目录让现有 Codex 供应商配置直接获得 Astra。

## Consequences

[Desktop sidecar 冒烟测试](../../../../desktop/tests/sidecar-smoke.test.mjs) 对部署后的运行时调用经过身份验证的模型发现端点，要求返回 Astra、正数容量元数据以及现有 Sol 条目。针对目录、模型发现和会话导出的测试覆盖继承的适配器与导出集成。模型推理与账户权限仍由服务端决定；列出 Astra 不代表推理请求已成功。

当兼容的上游 pi-ai 更新包含 Astra 时可以移除此补丁。原有全局目录生成时间戳保持不变，因为补丁只更新一个供应商文件。测试构建是本地产物；本变更不发布版本，也不修改已安装的凭据或设置。
