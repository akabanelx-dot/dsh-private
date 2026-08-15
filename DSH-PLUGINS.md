# DSH 现有插件清单

> 生成时间：2026-08-15
> 数据来源：`dev_plugin_status`、`~/.dsh/profiles/web/package.json`、`cordis.patch.yml`、profile `node_modules` 链接关系、`.plugins` 与工作区根目录的 git remote / package.json。
> 本清单只做现状整理，未修改任何现有文件。

---

## 1. 当前 web profile 已装配的第三方 / 社区插件

以下插件在 `dsh web` 的 `web` profile 中处于 active 状态（或作为聚合包的一部分生效）。

| 包名 | 版本 | 安装来源 | 状态 | 作用 |
|---|---|---|---|---|
| `dsh-auto-approve` | 0.1.0 | 本地 bundle（源码在 `F:\WorkSpace\DSH\dsh-auto-approve`） | active | Codex 风格自动批准：检测到沙箱提权时自动放行，附审计 |
| `dsh-better-sidebar` | 0.11.0 | npm | active | VSCode 风格右侧边栏（explorer/editor/terminal/git/browser） |
| `@nanmicoder/dsh-agent-teams` | 0.1.2 | npm | active | 多 Agent 团队协作（captain/member/task） |
| `@tt-a1i/archify-dsh` | 0.1.0 | npm | active | Archify 架构图 Skill-only bundle |
| `dsh-custom-tool` | 0.1.1 | GitHub tarball（omdsh-dev） | active | 自定义工具管理（Monaco 编辑器 + `custom_tool_*`） |
| `dsh-notification` | 0.1.1 | GitHub tarball（omdsh-dev） | active | 回合结束桌面通知，支持关键词过滤 |
| `@omdsh-dev/dsh-genui` | 0.8.1 | GitHub（omdsh-dev/dsh-genui） | active | `dsh-ui` 交互式 UI 渲染（图表/表单/Mermaid/3D） |
| `@dsh-external/workflow` | 0.1.2 | git（dsh-external/dsh_workflow） | active | KodaX 对齐的动态 workflow harness |
| `@dsh-external/turn-rewind` | 0.1.0 | link → `.plugins/dsh-turn-rewind` | active | 回合级对话 + 工作区回退 |
| `@liustack/modsearch` | 5.4.1 | npm | active | 网页搜索 / X 搜索 / 页面抓取，带引用证据 |
| `dsh-at-file` | 0.4.0 | GitHub tarball（omdsh-dev） | active | 输入框 `@` 引用工作区文件 |
| `@liustack/modlens` | 3.16.1 | npm | active | 纯文本模型的视觉理解（图片转结构化证据） |
| `@dsh-external/dsh-super-injector` | 0.3.3 | link → `.plugins/dsh-super-injector` | active | 超级模组注入器：`dev_*` 热重载 / 注入 / 卸载 / 自愈 |
| `dsh-memory-evolve` | 0.1.0 | link → `.plugins/dsh-memory-evolve` + patch | active | 分层记忆、自我进化、技能/待办/外部 CLI 调度 |
| `dsh-plugin-marketplace` | 1.3.6 | node_modules 副本（源码在 `.plugins/DSH-Plugins-Marketplace`）+ patch | active | DSH 插件市场 UI |
| `@dsh-external/dsh-client-ui-skin-maid-atelier` | 0.0.1 | patch | active | 女仆装皮肤 |
| `@linxin666/dsh-web-ui-all` | 0.1.10 | npm（聚合包） | active | Web UI 全家桶聚合 |

`@linxin666/dsh-web-ui-all` 聚合的子插件（均为 0.1.10）：

| 子插件 | 状态 |
|---|---|
| `@linxin666/dsh-client-ui-task-board`（任务面板） | active |
| `@linxin666/dsh-client-ui-git-graph`（Git 图） | active |
| `@linxin666/dsh-client-ui-web-ui-settings`（Web UI 设置） | active |
| `@linxin666/dsh-remote-web-ui`（远程 Web UI） | active |
| `@linxin666/dsh-live-stats`（实时统计） | active |
| `@linxin666/dsh-ssh`（SSH） | active |
| `@linxin666/dsh-client-ui-skin-center`（皮肤中心） | active |
| `@linxin666/dsh-skins`（皮肤资产） | 依赖/资源 |
| `ui-web-ui-compat`（兼容 shim，来自聚合包） | active |
| `@linxin666/dsh-pet`（桌面宠物） | disabled |
| `@linxin666/dsh-client-ui-aionui-panel` | disabled |

---

## 2. `.plugins` 目录源码仓库

`.plugins` 里不全是当前直接 link 的插件，也包含上游源码、Skill 仓库、插件目录等。

| 目录 | 上游仓库 | 与已装插件关系 | 备注 |
|---|---|---|---|
| `archify` | `tt-a1i/archify` | `@tt-a1i/archify-dsh` 的上游仓库 | 已装 npm 包，源码 clone 未直接 link |
| `argo` | `taxueseek/argo` | `@taxueseek/argo-dsh` 的上游仓库 | 当前 profile 已移除，node_modules 仍有残留 symlink |
| `awesome-dsh-plugin` | `bruc3van/awesome-dsh-plugin` | 非插件 | DSH 插件目录/榜单仓库 |
| `claude-paper` | `alaliqing/claude-paper` | 非 DSH bundle | 论文研读 Skill 安装源 |
| `dsh-agent-teams` | `NanmiCoder/dsh-agent-teams` | 已装 npm 包的上游 | 源码参考 |
| `dsh-at-file` | `omdsh-dev/dsh-at-file` | 已装 tarball 的上游 | 源码参考 |
| `DSH-better-sidebar` | `omdsh-dev/DSH-better-sidebar` | 已装 npm 包的上游 | 源码参考 |
| `dsh-custom-tool` | `omdsh-dev/dsh-custom-tool` | 已装 tarball 的上游 | 源码参考 |
| `dsh-genui` | `omdsh-dev/dsh-genui` | 已装 github 依赖的上游 | 源码参考 |
| `dsh-memory-evolve` | `csyangwen/dsh-memory-evolve` | 当前直接 link | 本地开发/运行源 |
| `dsh-notification` | `omdsh-dev/dsh-notification` | 已装 tarball 的上游 | 源码参考 |
| `DSH-Plugins-Marketplace` | `bradeGithub/DSH-Plugins-Marketplace` | 已装 marketplace 的上游 | node_modules 为副本，未 link |
| `dsh-super-injector` | 无 git（本地副本） | 当前直接 link | 与 `dsh-routing-suite/injector` 同源 |
| `dsh-turn-rewind` | `Anionex/dsh-turn-rewind` | 当前直接 link | 本地开发/运行源 |
| `dsh_workflow` | `icetomoyo/dsh_workflow` | 已装 `@dsh-external/workflow` 的源码 clone | 安装包来自 `dsh-external/dsh_workflow` git，未 link 本目录 |
| `jacobian` | `morluto/jacobian` | 非 DSH 插件 | 全局 CLI / MCP 数学工具源码 |
| `modlens` | `liustack/modlens` | 已装 npm 包的上游 | 源码参考 |
| `modsearch` | `liustack/modsearch` | 已装 npm 包的上游 | 源码参考 |

---

## 3. 工作区根目录的插件相关项目 / 文件

| 路径 | 类型 | 说明 |
|---|---|---|
| `dsh-anchored-standard/` | preset 源码仓库 | 已安装到 `~/.dsh/.agent-presets/anchored-standard` |
| `dsh-auto-approve/` | 本地插件源码 | 当前 active bundle 的源码目录 |
| `dsh-routing-suite/` | 套装仓库 | 含 `injector/`（= dsh-super-injector）与 `preset/`（router-standard），preset 已安装到 `~/.dsh/.agent-presets/router-standard` |
| `dsh-routing-suite.zip` | 压缩包 | 仅 3.5 KB 的 wrapper（README/.gitmodules/install.ps1 + 空子模块目录），与目录内容重复 |
| `anchored-standard.ts` | OpenCode 插件源码 | 非 DSH 插件 |
| `opencode-minimal.md` | OpenCode agent 配置 | 非 DSH 插件 |
| `probe-tunnels.js` / `scan-ports.js` | 网络工具脚本 | 非插件 |
| `install-dsh-plugins.ps1` | 一键安装脚本 | 覆盖约 16 个插件，部分内容已过时 |
| `g1-*.html / .json / .png` | 生成的架构图产物 | 与插件无关 |

---

## 4. 残留 / 未启用 / 可关注项（仅记录，不处理）

| 项目 | 现状 | 备注 |
|---|---|---|
| `@taxueseek/argo-dsh` | node_modules 中仍有 symlink → `.plugins/argo/packages/dsh-plugin`，但当前 `package.json` 与 bundles 已移除 | 属于未启用的残留 |
| `~/.dsh/profiles/web/package.json.bak-*` | 存在多个备份文件 | 含 `package.json.bak-remove-argo` 等历史版本 |
| `~/.dsh/profiles/web/cordis.patch.yml.bak-*` | 存在备份 | 历史 patch 备份 |
| `.plugins/dsh_workflow` | 未直接 link | 与已安装的 `@dsh-external/workflow` 可能是同源不同 remote，属额外源码 clone |
| `dsh-routing-suite/injector/` | 与 `.plugins/dsh-super-injector` 同源 | 两处存在相同注入器代码 |
| `dsh-routing-suite.zip` | 与 `dsh-routing-suite/` 重复 | 空壳 zip，未包含实际子模块内容 |
| `install-dsh-plugins.ps1` | 仍包含 `argo`、`jacobian` 等安装项 | 与当前 profile 实际装配状态不完全一致 |

---

## 5. 说明

- 本清单只覆盖社区 / 第三方插件；DSH 内置核心插件（`@deepseek-ai/*`、`dsh-*` 官方包）未逐一列出。
- “active / disabled” 以 `dev_plugin_status` 当前运行态为准。
- 如需执行清理（删除残留 symlink、归档未使用源码、更新安装脚本等），可基于本清单逐项确认后再操作。
