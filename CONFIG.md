# DSH 配置详解（config/）

> 快照日期：2026-08-16
> 本目录是作者本机 `~/.dsh/` 与 `~/.dsh/profiles/web/` 的配置快照，用于备份与在新环境复刻「同款」行为。
> 敏感文件（`.credentials.yaml`、`.anonymous-user-id`、`dsh-ssh.json` 等）**不入库**，详见文末「不包含的内容」。

---

## 1. `settings.yaml` — 用户级设置（`~/.dsh/settings.yaml`）

DSH 全局用户设置，控制默认模型、预设、权限、UI 等。

```yaml
ui-onboarding:
  welcomeNoticeVersion: 2026-08-13.1   # UI 欢迎公告版本（用于去重提示）
agent-default-model:
  provider: opencode-go                 # 默认模型供应商
  model: deepseek-v4-flash              # 默认模型
  reasoningEffort: max                  # 推理强度
agent-presets:
  default: router-standard              # 默认 Agent 预设（任务感知思维模式路由）
llm-pi-ai:
  providers:
    opencode-go:
      apiKeyEnv: OPENCODE_API_KEY       # API Key 从环境变量读取（不落盘）
permission:
  defaultPreset: auto                   # 权限默认自动
remote-web-ui:
  autoTunnel: true                      # 远程 Web UI 自动隧道
dsh-better-sidebar:
  interceptOpenPath: true               # 右侧边栏接管"打开路径"操作
ui-theme:
  preference: light                     # UI 主题偏好：浅色
```

| 配置项 | 作用 | 备注 |
|---|---|---|
| `agent-default-model` | 会话默认模型（opencode-go / deepseek-v4-flash，max 推理） | 模型路由 |
| `agent-presets.default` | 新会话默认选用的 Agent 预设 | 当前为 router-standard |
| `llm-pi-ai.providers.*.apiKeyEnv` | 供应商 API Key 的环境变量名 | **只存变量名，不存密钥值** |
| `permission.defaultPreset` | 权限预设默认值 | auto = 自动批准策略 |
| `remote-web-ui.autoTunnel` | 自动建立远程访问隧道 | 配合 @linxin666/dsh-remote-web-ui |
| `ui-theme.preference` | 深浅色主题 | light |

## 2. `sandbox-rules.json` — 沙箱治理规则（`~/.dsh/sandbox-rules.json`）

由 `dsh-sandbox-governance` 插件（作者本地插件，无公开 remote）读写，是 dsh 沙箱策略之上的治理层。

```json
{
  "version": 1,
  "filesystem": { "allowWrite": [], "denyWrite": [], "denyRead": [] },
  "commands": { "allow": [], "deny": [], "ask": [] },
  "network": { "enabled": false, "domains": {} },
  "trustedWorkspaces": {
    "F:/WorkSpace/DSH": { "trusted": true, "at": 1786814811864 }
  },
  "decisions": [],
  "autoApprove": {
    "enabled": true,
    "modes": ["workspace-write", "danger-full-access"],
    "overrideNeverPolicy": true,
    "denyTools": []
  }
}
```

| 字段 | 说明 |
|---|---|
| `filesystem` / `commands` | 额外放行 / 拒绝 / 询问规则（当前为空 = 全按 dsh 默认） |
| `network.enabled` | 网络是否全局开启（当前 **false**，按需放行域名） |
| `trustedWorkspaces` | 受信任工作区（`F:/WorkSpace/DSH` 直接可信） |
| `decisions` | 历史审批决策记录 |
| `autoApprove` | 自动批准：对 `workspace-write` 与 `danger-full-access` 提权请求自动放行（Windows/Git Bash 场景必需，见 `AGENTS.md`） |

## 3. `cordis.patch.yml` — profile 装配补丁（`~/.dsh/profiles/web/cordis.patch.yml`）

按顺序追加到 bundle 组合之后的键级补丁，逐条含义：

| 补丁条目 | 含义 |
|---|---|
| `insert dsh-memory-evolve` | 注册记忆进化插件，开启定期记忆审查（reviewInterval: 10 回合） |
| `insert dsh-memory`（灵枢） | 注册灵枢记忆插件：SQLite 库 `F:/WorkSpace/DSH/data/lingshu.db`，identity「灵枢」，tools=core，仅记录用户消息 |
| `insert dsh-plugin-marketplace` | 注册插件市场 UI |
| `pet disabled` | 禁用桌面宠物 |
| `insert dsh-external-dsh-client-ui-skin-maid-atelier` | 注册女仆装皮肤 |
| `ui-dsh-aionui-panel disabled` | 禁用 AionUI 面板 |
| `bash-sandbox enabled` / `pwsh-sandbox disabled` | **Windows 关键**：shell 后端切换到 Git Bash（键级覆盖 dsh-base 平台门禁） |

> 回滚提示：`bash-sandbox`/`pwsh-sandbox` 两条是 dsh-base 平台门禁的覆盖，删除即恢复默认。

## 4. `package.json` — profile 依赖与装配清单（`~/.dsh/profiles/web/package.json`）

`dsh.profile.bundles` 决定启动装配顺序；`dependencies` 是安装来源。

**Bundles 装配顺序（自上而下）：**

```
@deepseek-ai/dsh-base          → 官方基础
@deepseek-ai/dsh-web-app       → 官方 Web 应用
@linxin666/dsh-web-ui-all      → Web UI 全家桶（0.1.16）
dsh-better-sidebar             → VSCode 风格右侧边栏（0.12.2）
@nanmicoder/dsh-agent-teams    → 多 Agent 团队（0.1.5）
@tt-a1i/archify-dsh            → 架构图 Skill
dsh-custom-tool                → 自定义工具管理
dsh-notification               → 回合结束通知
@omdsh-dev/dsh-genui           → GenUI 交互式 UI
@dsh-external/workflow         → 动态 workflow harness
@anionex/dsh-turn-rewind       → 回合回退（link 本地）
@liustack/modsearch            → 网页/X 搜索（5.4.2）
dsh-at-file                    → 输入框 @ 引用（v0.6.0）
@liustack/modlens              → 视觉理解（3.16.7）
@dsh-external/dsh-super-injector → 超级模组注入器 dev_*（link）
dsh-sandbox-governance         → 沙箱治理（link 本地）
```

**依赖来源分类：**

| 来源 | 包 |
|---|---|
| npm registry | `dsh-better-sidebar`、`@nanmicoder/dsh-agent-teams`、`@liustack/modlens`、`@liustack/modsearch`、`@tt-a1i/archify-dsh`、`@linxin666/dsh-web-ui-all` |
| GitHub tarball / git | `dsh-at-file`、`dsh-custom-tool`、`dsh-notification`、`dsh-plugin-marketplace`、`@omdsh-dev/dsh-genui`、`@dsh-external/workflow` |
| 本地 link（`.plugins/`） | `dsh-turn-rewind`、`dsh-memory-evolve`、`dsh-memory`（灵枢）、`dsh-super-injector` |
| 本地 link（工作区） | `dsh-sandbox-governance` |

> link 路径写死为作者机器路径（`F:/WorkSpace/DSH/...`），新环境请用 `install.ps1` 或自行调整。

## 5. `pnpm-workspace.yaml` — 依赖安装行为

- `nodeLinker: hoisted`：扁平 node_modules（Windows 兼容）
- `minimumReleaseAgeExclude`：跳过"新版本发布冷却"检查的白名单——把聚合包子插件与常用插件锁定到 `0.1.10 || 0.1.16` 等组合版本，避免 pnpm 因发布年龄拒绝安装
- `allowBuilds`：放行 `cloudflared`、`cpu-features`、`node-pty`、`protobufjs`、`ssh2` 等原生模块构建

## 6. `AGENTS.md` — Windows / Git Bash 沙箱备忘（`~/.dsh/AGENTS.md`）

作者环境的**运行经验文档**，核心结论：

- **受限沙箱（read-only / workspace-write）下 Git Bash 无法启动**（msys2 与 Windows ACL 受限令牌不兼容），症状为 `couldn't create signal pipe` / `CreateFileMapping` 报错或退出码 `0xC0000142`
- 处理方式：对需要 bash 的命令直接请求 `sandbox_permissions: "danger-full-access"` + 一句 justification 重试；**不要**提权到 workspace-write（同样受限）
- 编码：直接调用 cmd/powershell 子进程时输出可能为 GBK/UTF-16LE，用 `iconv` 转换
- 路径：msys 路径与 Windows 路径用 `cygpath -w` 互转

## 7. `cordis.yml` — 装配根（只读参考）

本仓库保留的 `config/cordis.yml` 是空条目列表（`[]`）——profile 的完整组合由「bundles + cordis.patch.yml + CLI --patch 覆盖」动态生成，该文件**不应手工编辑**。

---

## 不包含的内容（敏感 / 运行时数据）

| 文件 | 原因 |
|---|---|
| `.credentials.yaml` | API 凭据（真实密钥） |
| `.anonymous-user-id` | 匿名标识 |
| `dsh-ssh.json` | SSH 主机配置（含明文密码） |
| `memories/`、`sessions/`、`attachments/` | 会话与记忆数据 |
| `sandbox-audit.jsonl` | 沙箱审计日志（含命令内容） |
| `profiles/web/cordis.yml`（完整版） | 机器生成运行时组合，含本机路径 |
| `profiles/web/pnpm-lock.yaml` | 本机 lockfile，不适合跨机分发 |

复制本目录到新环境后，需自行配置 `.credentials.yaml`（或设置环境变量 `OPENCODE_API_KEY`）才能使用模型。
