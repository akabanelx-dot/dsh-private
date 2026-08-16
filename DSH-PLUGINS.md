# DSH 现有插件清单

> 生成时间：2026-08-16
> 数据来源：`dev_plugin_status`、`~/.dsh/profiles/web/package.json`、`cordis.patch.yml`、profile `node_modules` 链接关系、`~/.dsh/settings.yaml`。
> 本清单只做现状整理，未修改任何现有文件。

---

## 1. 当前 web profile 已装配的第三方 / 社区插件

以下插件在 `dsh web` 的 `web` profile 中处于 active 状态（或作为聚合包的一部分生效）。

| 包名 | 版本 | 安装来源 | 状态 | 作用 |
|---|---|---|---|---|
| `dsh-auto-approve` | 0.1.0 | 本地 bundle（源码在 `F:\WorkSpace\DSH\dsh-auto-approve`，随本仓库 `plugins/` 分发） | active | Codex 风格自动批准：检测到沙箱提权时自动放行，附审计 |
| `dsh-better-sidebar` | 0.12.2 | npm | active | VSCode 风格右侧边栏（explorer/editor/terminal/git/browser） |
| `@nanmicoder/dsh-agent-teams` | 0.1.5 | npm | active | 多 Agent 团队协作（captain/member/task） |
| `@tt-a1i/archify-dsh` | 0.1.0 | npm | active | Archify 架构图 Skill-only bundle |
| `dsh-custom-tool` | 0.1.1 | GitHub tarball（omdsh-dev） | active | 自定义工具管理（Monaco 编辑器 + `custom_tool_*`） |
| `dsh-notification` | 0.1.1 | GitHub tarball（omdsh-dev） | active | 回合结束桌面通知，支持关键词过滤 |
| `@omdsh-dev/dsh-genui` | 0.8.1 | GitHub（omdsh-dev/dsh-genui） | active | `dsh-ui` 交互式 UI 渲染（图表/表单/Mermaid/3D） |
| `@dsh-external/workflow` | 0.1.2 | git（dsh-external/dsh_workflow） | active | KodaX 对齐的动态 workflow harness |
| `@anionex/dsh-turn-rewind` | 0.1.0 | link → `.plugins/dsh-turn-rewind` | active | 回合级对话 + 工作区回退（原 `@dsh-external/turn-rewind` 改名） |
| `@liustack/modsearch` | 5.4.2 | npm | active | 网页搜索 / X 搜索 / 页面抓取，带引用证据 |
| `dsh-at-file` | 0.6.0 | GitHub tarball（omdsh-dev） | active | 输入框 `@` 引用工作区文件 |
| `@liustack/modlens` | 3.16.7 | npm | active | 纯文本模型的视觉理解（图片转结构化证据） |
| `@dsh-external/dsh-super-injector` | 0.3.3 | link → `.plugins/dsh-super-injector` | active | 超级模组注入器：`dev_*` 热重载 / 注入 / 卸载 / 自愈 |
| `dsh-memory-evolve` | 0.1.0 | link → `.plugins/dsh-memory-evolve` + patch | active | 分层记忆、自我进化、技能/待办/外部 CLI 调度 |
| `dsh-sandbox-governance` | — | link → `F:\WorkSpace\DSH\dsh-sandbox-governance`（作者本地插件，无公开 remote） | active | 沙箱治理：规则文件 + 统一审计 + autoApprove 接管 |
| `dsh-plugin-marketplace` | 1.4.9 | GitHub tarball（bradeGithub/DSH-Plugins-Marketplace v1.4.9） | active | DSH 插件市场 UI（8-16 曾加载失败，已修复） |
| `@dsh-external/dsh-client-ui-skin-maid-atelier` | 0.0.1 | patch | active | 女仆装皮肤（随本仓库 `plugins/` 分发） |
| `@linxin666/dsh-web-ui-all` | 0.1.16 | npm（聚合包） | active | Web UI 全家桶聚合 |

`@linxin666/dsh-web-ui-all` 聚合的子插件（均为 0.1.16）：

| 子插件 | 状态 |
|---|---|
| `@linxin666/dsh-client-ui-task-board`（任务面板） | active |
| `@linxin666/dsh-client-ui-git-graph`（Git 图） | active |
| `@linxin666/dsh-client-ui-web-ui-settings`（Web UI 设置） | active |
| `@linxin666/dsh-remote-web-ui`（远程 Web UI） | active |
| `@linxin666/dsh-live-stats`（实时统计） | active |
| `@linxin666/dsh-ssh`（SSH） | active |
| `@linxin666/dsh-tool-describe-image`（图片描述工具） | active |
| `@linxin666/dsh-liangshen`（梁神模式 preset 插件，维护 liangshen / liangshen-exact 预设） | active |
| `@linxin666/dsh-client-ui-skin-center`（皮肤中心） | active |
| `@linxin666/dsh-skins`（皮肤资产） | 依赖/资源 |
| `ui-web-ui-compat`（兼容 shim，来自聚合包） | active |
| `@linxin666/dsh-pet`（桌面宠物） | disabled |
| `@linxin666/dsh-client-ui-aionui-panel` | disabled |

## 2. 用户级配置（`~/.dsh/`）

| 文件 | 说明 | 是否入库 |
|---|---|---|
| `settings.yaml` | 默认模型（opencode-go / deepseek-v4-flash）、默认预设（router-standard）、权限默认 auto、远程 Web UI 自动隧道、浅色主题等 | ✅ `config/settings.yaml` |
| `sandbox-rules.json` | 沙箱治理规则（文件/命令/网络 + autoApprove 模式） | ✅ `config/sandbox-rules.json` |
| `AGENTS.md` | Windows / Git Bash 沙箱规则备忘（受限模式提权流程） | ✅ `config/AGENTS.md` |
| `cordis.patch.yml` | profile 补丁：memory-evolve / marketplace / maid 皮肤 / pet 禁用 / bash 后端切换 | ✅ `config/cordis.patch.yml` |
| `.credentials.yaml`、`.anonymous-user-id`、`dsh-ssh.json` | 凭据 / SSH 主机（含明文密码） | ❌ 敏感信息，不入库 |
| `memories/`、`sessions/`、`attachments/`、`sandbox-audit.jsonl` | 运行数据 | ❌ 不入库 |

## 3. Agent 预设（`~/.dsh/.agent-presets/`）

| 预设 | 说明 | 入库 |
|---|---|---|
| `router-standard` | 任务感知思维模式路由（spec/react/weak），默认预设 | ✅ `presets/router-standard/` |
| `anchored-standard` | 锚定标准（首轮 Minimal 工具集 + 晋升门控） | ✅ `presets/anchored-standard/` |
| `liangshen` | 梁神模式：两阶段锚定 + Code Mode 晋升（由 dsh-liangshen 插件维护） | ✅ `presets/liangshen/` |
| `liangshen-exact` | 梁神模式-精确实验版（持久 bash + str_replace_editor） | ✅ `presets/liangshen-exact/` |

## 4. 已知问题 / 残留（仅记录，不处理）

| 项目 | 现状 | 备注 |
|---|---|---|
| `dsh-plugin-marketplace` | ~~8-16 曾显示 failed（lib/index.js 加载失败）~~ → 已修复，现为 active | 见 §1 |
| `@taxueseek/argo-dsh` | 已从 package.json / bundles 移除 | 无残留依赖 |
| `~/.dsh/profiles/web/package.json.bak-*` | 存在多个备份文件 | 历史版本备份 |
| `~/.dsh/sandbox-refactor/` | 沙箱重构工作目录（含 archived 配置） | 历史工作区 |

---

## 5. 说明

- 本清单只覆盖社区 / 第三方插件；DSH 内置核心插件（`@deepseek-ai/*`、`dsh-*` 官方包）未逐一列出。
- "active / disabled / failed" 以 `dev_plugin_status` 当前运行态为准。
- 同步方式：`config/` 与 `presets/` 由本机 `~/.dsh/` 直接复制而来；`plugins/` 为本地自研插件源码。
