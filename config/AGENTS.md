# 语言要求

- **思考**：内部思考、推理、计划与自我检查一律使用英文。
- **输出**：回复用户一律使用中文；除非用户明确要求使用其他语言。
- **原文保留**：代码、命令、路径、日志、报错信息与技术术语保持原样，不翻译。

# DSH GUI 沙箱规则（bash 工具，Windows / Git Bash）

## 受限模式下 Git Bash 无法启动（重要，先读）

- bash 工具在 **read-only / workspace-write** 沙箱下**无法启动任何 msys2/cygwin
  程序**（Git Bash 的运行时与 Windows ACL 受限令牌不兼容）。症状（三者皆可能，
  视环境而定）：`fatal error - couldn't create signal pipe, Win32 error 5`、
  `fatal error - CreateFileMapping ... Win32 error 5, Terminating`（exit 256）、
  或退出码 `3221225794`（0xC0000142）。这是**沙箱问题，不是命令失败**——失败
  结果带 `[sandbox: the sandbox runner itself failed under <mode> mode]` 标记，
  或前台抛 `no sandbox backend is usable ... Runner failure: ...` 错误。
- **不要被 `no sandbox backend is usable` 误导**：这不是「环境坏了、提权也没用」，
  而是「该命令在受限模式下无法运行」——**提权到 danger-full-access 即可解决**。
- **处理**：直接对该命令请求 `sandbox_permissions: "danger-full-access"` +
  一句 justification 重试（autoApprove 通常自动放行，实测端到端可用）。
  **不要提权到 workspace-write**——它同样是受限模式，bash 依旧无法启动。
- 提权后的命令以完整权限运行；治理命令规则（deny/ask）与统一审计仍然生效。

## 常规规则

- **read-only** 沙箱拦截工作区外与一切写入；**workspace-write** 仅放行工作区
  与平台临时区写入，且同样无法启动 Git Bash（见上）。
- 启动受限模式下无法运行的进程（Git Bash 场景）时，**提权到
  danger-full-access** 后重试。
- 诊断 `couldn't create signal pipe` 时，**先判断是否因受限模式导致
  （Git Bash 必然失败）**，再考虑应用崩溃等其它原因，勿误报为应用崩溃。

## 编码与路径

- bash 输出为 UTF-8，中文正常；但**直接调用 cmd/powershell 子进程**时其输出
  可能是 GBK（代码页 936）或 UTF-16LE，需 `| iconv -f GBK -t UTF-8` 或
  `| iconv -f UTF-16LE -t UTF-8` 转换后再读。
- 路径：Git Bash 内 `pwd` 输出 msys 形式（如 `/f/WorkSpace/DSH`）；传给原生
  Windows 程序用 `cygpath -w` 转换（如 `$(cygpath -w "$PWD")`）；Windows 路径
  作为参数传入 bash 时用引号包裹（`"C:\...\file"`）。
- 每次 bash 调用是全新进程，不保留状态——用 `workdir` 参数，不要用 `cd`。
