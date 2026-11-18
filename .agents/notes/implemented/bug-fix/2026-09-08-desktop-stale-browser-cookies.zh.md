# Agent Note：Desktop 启动时清理过期浏览器登录 Cookie

Status: implemented

[English](2026-09-08-desktop-stale-browser-cookies.md) | 中文

## 问题

每个随机本地端口都会获得一个有效期为三十天的 Harness 浏览器登录 Cookie。嵌入式浏览器会向同一主机发送所有端口的 Cookie。多次重启后，Cookie 加上合并插件 URL 超过 Node 的请求头限制：主页加载成功，但插件请求返回 HTTP 431。

## 决策

在空白页创建 Desktop WebView。在首次导航和 sidecar 重连前，通过阻塞工作线程调用 Tauri Cookie API，仅移除回环主机上以 `dsh-auth-` 开头、后缀为 43 个 base64url 字符的 Cookie。等待清理完成后再导航至带认证信息的就绪 URL。新令牌交换建立当前浏览器会话。单实例桌面应用拥有此 Cookie 存储；提供方 OAuth 凭据、Harness 设置、会话、其他 Cookie 和本地存储保持不变。

## 考虑过的替代方案

手动清理可恢复启动，但问题会再次出现。提高服务器请求头限制只会推迟故障，并改变上游托管行为。清除整个 WebView 配置会丢失其他偏好。对于 Desktop 自己拥有的存储，无需修改上游 Cookie 认证机制。

## 影响

Cookie 筛选测试保留其他名称和域。回归复现向部署后的主页和插件包发送大量旧 Cookie，显示主页 HTTP 200 而插件包 HTTP 431。使用已有的累积 Cookie 存储验证真实 Desktop 启动，并验证后续重启只保留当前登录。Cookie API 失败时停止导航，使用现有启动错误提示，而非加载损坏页面。
