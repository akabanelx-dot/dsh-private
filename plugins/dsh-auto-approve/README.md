# dsh-auto-approve（帮我批准 · 自动批准）

一个 DSH Web GUI 插件，Codex 风格「帮我批准模式」：当 agent 通过
`sandbox_permissions` 请求沙箱提权（**检测到的风险操作**）时，**自动批准**
（`allowed-once`），无需人工确认、无 LLM 调用；每次批准与策略接管都写入审计
日志；侧边栏「自动批准」面板可查看审计记录并编辑配置。

- **纯 JS、无构建步骤**：`index.js`（宿主半边）+ `client.js`（浏览器半边）。
- **早于人工应答者**：宿主只注入 `approval`（在 dsh-base，最早一批就绪），
  因此它的应答者会在 apiproxy（人工应答者）之前注册，实现「先自动批准、
  不匹配再转人工」。

## 为什么需要「接管 never 策略」

审批服务（`dsh-user-approval`）在派发应答者**之前**检查会话策略：策略为
`never` 时直接返回 `rejected`（fail-closed），应答者根本不会运行。因此当会话
策略是 `never`（提权会被自动拒绝）时，本插件在 `overrideNeverPolicy` 开启的
情况下把会话策略接管为 `ask`，再由自己的应答者立即放行风险操作——等效于
「从不打断、检测到的风险操作自动批准」。接管动作同样写入审计。

## 能力

| 模式 | 行为 |
|---|---|
| `approve`（默认） | 检测到沙箱提权 → 自动批准（`allowed-once`） |
| `audit` | 只记录审计、不接管任何决策 |

- 只接管 reason 形如 `escalate sandbox to <mode>: ...` 的**沙箱提权**请求；
  其余审批请求一律 `next()` 转下一应答者。
- `allowedModes`（默认 `workspace-write, danger-full-access`，`*` 表示全部）
  限制批准的目标模式；`denyTools` 中的工具永不自动批准。
- 每次决策写入 `~/.dsh/dsh-auto-approve.json`（环形缓冲，默认 500 条，
  0600 私有文件）。

## 文件

- `index.js` — 宿主半边：`approval/request` 应答者、会话策略接管、审计存储、路由、系统提示公告。
- `client.js` — 浏览器半边：侧边栏「自动批准」入口 + 右侧抽屉面板（审计列表 + 配置表单）。
- `cordis.patch.yml` — bundle patch：把插件行插入 web profile 花名册。
- `package.json` — `dsh.bundle.patch` + `dsh.client` 声明。

## 安装与激活

本插件作为 profile bundle 挂载，且应排在 `@deepseek-ai/dsh-web-app` **之前**，
以保证其应答者先于人工应答者注册。

1. 把源码目录放入 web profile 的依赖树：

   ```powershell
   $src = "F:\WorkSpace\dsh-auto-approve"
   $dst = "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-auto-approve"
   if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
   Copy-Item -Recurse $src $dst
   ```

2. 编辑 `~/.dsh/profiles/web/package.json`，把本包加进
   `dsh.profile.bundles`，且放在 `@deepseek-ai/dsh-web-app` 之前：

   ```json
   "dsh": { "profile": { "bundles": [
     "@deepseek-ai/dsh-base",
     "dsh-auto-approve",
     "@deepseek-ai/dsh-web-app",
     "@linxin666/dsh-web-ui-all"
   ] } }
   ```

3. 重启 web profile 使其生效：

   ```powershell
   dsh web
   ```

   重启后刷新浏览器，侧边栏会出现「自动批准」入口。

## 配置（也可在面板中编辑）

写入 `~/.dsh/dsh-auto-approve.json` 的 `config` 字段：

| 键 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | 总开关 |
| `mode` | `approve` | `approve` / `audit` |
| `overrideNeverPolicy` | `true` | 会话策略为 `never` 时接管为 `ask`（否则应答者不运行，提权被自动拒绝） |
| `allowedModes` | `["workspace-write","danger-full-access"]` | 批准的目标模式，`"*"` 表示全部 |
| `denyTools` | `[]` | 永不自动批准的工具 |
| `announceToAgent` | `true` | 是否向 agent 公告本插件 |
| `maxRecords` | `500` | 审计记录上限 |

## 安全说明

- 本插件是「一次性裁决」：只返回 `allowed-once`，不授予持久权限；每次提权都重新走审批通道。
- `danger-full-access` 是最高文件权限，默认也在自动批准范围内——如需收紧，
  可在面板中把 `allowedModes` 改为仅 `workspace-write`，或用 `denyTools`
  排除特定工具。
- 接管 never 策略只改「审批策略」这一档，不改变会话的沙箱模式。
- 审计 JSON 文件含请求的 justification 与裁决，存放在用户主目录私有文件（0600）。
