# dsh-private — DSH 配置快照与一键安装包

作者 DSH Web 环境「同款插件配置」一键安装包。

这个仓库不是某个单一插件的源码，而是一个 **DSH 插件/预设装配清单 + 一键安装器**：
克隆后运行 `install.ps1`，即可把作者当前 Web profile 里使用的社区插件、本地增强插件、
Agent 预设和常用扩展装到新的 DSH 环境里。

## 包含内容

| 路径 | 说明 |
|---|---|
| `install.ps1` | 一键安装脚本（Windows PowerShell） |
| `DSH-PLUGINS.md` | 当前插件清单与说明（快照） |
| **`CONFIG.md`** | **配置详解：`config/` 每份文件的逐项含义（推荐先读）** |
| `config/` | 当前 web profile 的 `package.json`、`cordis.patch.yml`、`cordis.yml`、`pnpm-workspace.yaml`，以及用户级 `settings.yaml`、`sandbox-rules.json`、`AGENTS.md` 参考 |
| `presets/anchored-standard/` | 锚定标准 Agent 预设 |
| `presets/router-standard/` | 思维模式路由 Agent 预设（spec/react/weak） |
| `presets/liangshen/` | 梁神模式 Agent 预设（两阶段锚定 + Code Mode 晋升） |
| `presets/liangshen-exact/` | 梁神模式-精确实验版预设 |

> 想了解这套配置「为什么这么装、每项是什么」，直接看 [CONFIG.md](CONFIG.md)。
> 作者自研插件（`dsh-auto-approve`、`dsh-sandbox-governance`）已独立成仓：[akabanelx-dot/dsh-plugins](https://github.com/akabanelx-dot/dsh-plugins)，安装器会从该仓库克隆安装。

安装器运行时还会从公开仓库拉取：

- npm：`dsh-better-sidebar`、`@nanmicoder/dsh-agent-teams`、`@liustack/modlens`、`@liustack/modsearch`、`@tt-a1i/archify-dsh`、`@linxin666/dsh-web-ui-all`
- GitHub tarball / git：`dsh-at-file`、`dsh-custom-tool`、`dsh-notification`、`DSH-Plugins-Marketplace`、`dsh-genui`、`dsh_workflow`
- 本地 link 插件：`dsh-turn-rewind`、`dsh-memory-evolve`、`dsh-memory`（灵枢记忆，克隆到 `.cache/`）
- 自研插件（克隆 `akabanelx-dot/dsh-plugins`）：`dsh-auto-approve`、`dsh-sandbox-governance`
- 女仆装皮肤（克隆上游 `dsh-external/dsh-deep-whale` 的 `maid-atelier/`，CC BY-NC-SA 4.0，非自研）
- `dsh-super-injector` v0.3.3 Release tarball
- 全局 CLI / Skill：`jacobian`、`claude-paper`

## 安装步骤

前置要求：

- Windows + PowerShell（5.1 或 7 均可）
- Node.js（建议 22.19+）
- 全局安装 pnpm：`npm i -g pnpm`
- DSH 已安装，且 `dsh` 在 PATH 中
- git 在 PATH 中

安装：

```powershell
# 1. 克隆本仓库（或解压下载的 zip）
git clone https://github.com/akabanelx-dot/dsh-private.git
cd dsh-private

# 2. 运行一键安装（普通 PowerShell 窗口，不要在 AI 沙箱里跑）
powershell -ExecutionPolicy Bypass -File .\install.ps1
# 或
.\install.ps1
```

安装完成后：

1. 重启 DSH Web：先关闭再重新运行 `dsh web`
2. 浏览器硬刷新：`Ctrl+Shift+R`
3. 新建会话时选择需要的 Agent 预设：
   - `Router Standard (experimental)`：任务感知思维模式路由（默认）
   - `Anchored Standard`：锚定标准模式
   - `梁神模式` / `梁神模式-精确实验`：两阶段锚定 + Code Mode 晋升（需 0.1.16 聚合包）
4. 验证插件：`dsh plugin --profile web list`

## 说明

- 配置的逐项解读见 [CONFIG.md](CONFIG.md)；插件运行态快照见 [DSH-PLUGINS.md](DSH-PLUGINS.md)。
- 安装器里的 `dsh-auto-approve` 会自动调整到 `@deepseek-ai/dsh-web-app` 之前，保证自动批准应答者先于人工应答者注册。
- `dsh-memory-evolve` 使用 `cordis.patch.yml` 注册，安装器会幂等追加补丁条目。
- `DSH-Plugins-Marketplace` 以 v1.4.9 tarball 形式与其它插件一致安装（`dsh plugin add`）。
- 如果本地已有同名预设或插件，安装器会跳过，不会覆盖你已有的配置。
- 代理：如果本机 `127.0.0.1:7890` 有 Clash 等代理，安装器会自动启用，用于加速 GitHub 下载。

## 许可

各插件/预设版权归各自作者所有。本仓库仅作配置分发，不声明对随包第三方代码的版权。
