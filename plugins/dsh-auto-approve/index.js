/**
 * dsh-auto-approve — 「帮我批准」自动批准插件（host 半边）。
 *
 * Codex 风格「帮我批准模式」：当 agent 通过 `sandbox_permissions` 请求沙箱提权
 * （即检测到的风险操作）时，本插件作为 `approval/request` 瀑布事件的应答者，
 * 在人工应答者（apiproxy）之前直接放行（allowed-once）——无需人工确认、无 LLM
 * 调用。每次批准写入审计存储（`~/.dsh/dsh-auto-approve.json`），并通过
 * /api/dsh-auto-approve 路由族向 Web 面板暴露审计与配置。
 *
 * 会话审批策略为 `never` 时，审批服务会在派发应答者之前直接拒绝（fail-closed，
 * 参见 dsh-user-approval 的 decide()）。因此本插件在 `overrideNeverPolicy`
 * 开启时把会话策略接管为 `ask`，再由自己的应答者立即放行风险操作——等效于
 * 「从不打断、检测到的风险操作自动批准」。策略接管与每次批准都写入审计。
 *
 * 关键：本插件只注入 `approval`（在 dsh-base，最早一批就绪），因此它的应答者
 * 先于 apiproxy（注入 11 个服务）注册。纯 JS、无构建步骤；只依赖 node 内建模
 * 块，宿主 import 零风险。
 */

import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** 稳定的 cordis 插件名。 */
export const name = 'auto-approve'

/** 应答者挂载前所需的服务（在 dsh-base，保证早于 apiproxy 就绪）。 */
export const inject = ['approval']

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const API_BASE = '/api/dsh-auto-approve'
const STORE_PATH = join(homedir(), '.dsh', 'dsh-auto-approve.json')
const FORMAT_VERSION = 1
const MAX_BODY_BYTES = 64 * 1024

/** 默认配置。 */
const DEFAULT_CONFIG = {
  enabled: true,
  /** 'approve'：自动批准检测到的风险操作；'audit'：只记录、不接管。 */
  mode: 'approve',
  /** 会话策略为 'never' 时接管为 'ask'（否则审批服务在应答者之前直接拒绝）。 */
  overrideNeverPolicy: true,
  /** 自动批准的目标沙箱模式（'*' 表示全部；空数组表示不批准任何提权）。 */
  allowedModes: ['workspace-write', 'danger-full-access'],
  /** 这些工具发起的提权永不自动批准（转下一应答者）。 */
  denyTools: [],
  announceToAgent: true,
  /** 审计记录上限（环形缓冲）。 */
  maxRecords: 500,
}

/** 面向模型的插件公告。 */
const GUIDANCE = '本机已安装 dsh-auto-approve 插件（帮我批准模式，Codex 风格自动批准）：当 agent 通过 sandbox_permissions 请求沙箱提权（检测到的风险操作）时，该插件自动批准（allowed-once），无需人工确认；每次批准与策略接管都写入审计日志（~/.dsh/dsh-auto-approve.json），侧边栏「自动批准」面板可查看记录并调整配置（允许的目标模式、拒绝工具、是否接管 never 策略等）。仅提权请求会被自动批准，其余操作不受影响。'

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 解析提权 reason（形如 "escalate sandbox to <mode>: <justification>"）。 */
function parseEscalationReason(reason) {
  const raw = typeof reason === 'string' ? reason : ''
  const match = /^escalate sandbox to (\S+)\s*:\s*([\s\S]*)$/.exec(raw)
  if (match !== null) return { requestedMode: match[1], justification: match[2].trim() }
  return { requestedMode: '', justification: raw.trim() }
}

/** 目标模式是否命中允许列表。 */
function modeAllowed(requestedMode, allowedModes) {
  const list = Array.isArray(allowedModes) ? allowedModes : []
  if (list.length === 0) return false
  if (list.includes('*')) return true
  return list.includes(requestedMode)
}

/** 逗号/空白分隔列表解析（配置编辑用）。 */
function parseList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  return String(value ?? '')
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// 审计存储
// ---------------------------------------------------------------------------

/** 单条审计记录。 */
function makeRecord(fields) {
  return {
    id: randomUUID(),
    at: Date.now(),
    toolName: fields.toolName ?? '',
    reason: fields.reason ?? '',
    requestedMode: fields.requestedMode ?? '',
    justification: fields.justification ?? '',
    outcome: fields.outcome ?? 'delegated',
    decidedBy: fields.decidedBy ?? 'auto-approve',
    reasoning: fields.reasoning ?? '',
    durationMs: fields.durationMs ?? 0,
  }
}

/** 审计 + 配置的 JSON 文件存储（原子写，环形缓冲）。 */
class AuditStore {
  constructor(path) {
    this.path = path
  }

  load() {
    if (!existsSync(this.path)) {
      return { version: FORMAT_VERSION, config: { ...DEFAULT_CONFIG }, records: [] }
    }
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8'))
      if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.records)) {
        throw new Error('store shape invalid')
      }
      return {
        version: FORMAT_VERSION,
        config: { ...DEFAULT_CONFIG, ...(parsed.config ?? {}) },
        records: parsed.records,
      }
    } catch {
      try { renameSync(this.path, this.path + '.corrupt-' + Date.now()) } catch { /* best effort */ }
      return { version: FORMAT_VERSION, config: { ...DEFAULT_CONFIG }, records: [] }
    }
  }

  save(file) {
    const dir = dirname(this.path)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 })
    const tmp = this.path + '.tmp'
    writeFileSync(tmp, JSON.stringify(file, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 })
    renameSync(tmp, this.path)
  }

  list() {
    return this.load().records
  }

  getConfig() {
    return this.load().config
  }

  setConfig(patch) {
    const file = this.load()
    const next = { ...file.config }
    if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled
    if (patch.mode === 'approve' || patch.mode === 'audit') next.mode = patch.mode
    if (typeof patch.overrideNeverPolicy === 'boolean') next.overrideNeverPolicy = patch.overrideNeverPolicy
    if (patch.allowedModes !== undefined) {
      const list = parseList(patch.allowedModes)
      const invalid = list.filter((m) => m !== '*' && m !== 'workspace-write' && m !== 'danger-full-access')
      if (invalid.length > 0) throw new Error('invalid allowed mode: ' + invalid.join(', '))
      next.allowedModes = list
    }
    if (patch.denyTools !== undefined) next.denyTools = parseList(patch.denyTools)
    if (typeof patch.announceToAgent === 'boolean') next.announceToAgent = patch.announceToAgent
    if (Number.isInteger(patch.maxRecords) && patch.maxRecords > 0) next.maxRecords = patch.maxRecords
    file.config = next
    this.save(file)
    return next
  }

  append(record) {
    const file = this.load()
    const max = file.config.maxRecords ?? DEFAULT_CONFIG.maxRecords
    file.records.push(record)
    if (file.records.length > max) file.records = file.records.slice(file.records.length - max)
    this.save(file)
  }

  clear() {
    const file = this.load()
    file.records = []
    this.save(file)
  }
}

// ---------------------------------------------------------------------------
// 路由
// ---------------------------------------------------------------------------

/** 仅允许回环来源（与 dsh-ssh 一致，这些端点会改自动批准行为）。 */
function isLoopbackRequest(req) {
  const address = req.socket?.remoteAddress
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
  const host = req.headers?.host
  if (typeof host !== 'string') return false
  try {
    const u = new URL('http://' + host)
    if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost' && u.hostname !== '[::1]') return false
  } catch {
    return false
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = req.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function writeJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'referrer-policy': 'no-referrer' })
  res.end(payload)
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_BODY_BYTES) return undefined
    chunks.push(buffer)
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined
  } catch {
    return undefined
  }
}

function makeRoutes(store) {
  const routes = [
    {
      kind: 'exact',
      path: API_BASE + '/audit',
      handler: async (req, res) => {
        if (!isLoopbackRequest(req)) return writeJson(res, 403, { error: 'forbidden: loopback-only' })
        const method = req.method ?? 'GET'
        if (method === 'GET') {
          const records = store.list()
          writeJson(res, 200, { records: records.slice().reverse() })
          return
        }
        if (method === 'DELETE') {
          store.clear()
          writeJson(res, 200, { ok: true })
          return
        }
        writeJson(res, 405, { error: 'method not allowed' })
      },
    },
    {
      kind: 'exact',
      path: API_BASE + '/config',
      handler: async (req, res) => {
        if (!isLoopbackRequest(req)) return writeJson(res, 403, { error: 'forbidden: loopback-only' })
        const method = req.method ?? 'GET'
        if (method === 'GET') {
          writeJson(res, 200, { config: store.getConfig() })
          return
        }
        if (method === 'POST') {
          const body = await readJsonBody(req)
          if (body === undefined) return writeJson(res, 400, { error: 'invalid JSON body' })
          try {
            const config = store.setConfig(body)
            writeJson(res, 200, { config })
          } catch (error) {
            writeJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
          }
          return
        }
        writeJson(res, 405, { error: 'method not allowed' })
      },
    },
  ]
  return routes
}

// ---------------------------------------------------------------------------
// 应答者
// ---------------------------------------------------------------------------

/**
 * 处理一次审批请求：检测风险操作（沙箱提权）并按配置自动批准。
 * @returns ApprovalOutcome 之一，或调用 next() 委托下一个人工应答者。
 */
async function handleApproval(store, req, next) {
  if (req.signal?.aborted) return 'cancelled'

  const cfg = store.getConfig()
  if (!cfg.enabled) return next()

  const parsed = parseEscalationReason(req.reason)
  const startedAt = Date.now()
  const base = {
    toolName: req.toolName,
    reason: req.reason,
    requestedMode: parsed.requestedMode,
    justification: parsed.justification,
  }

  // 审计模式：只记录、不接管。
  if (cfg.mode === 'audit') {
    store.append(makeRecord({ ...base, outcome: 'delegated', reasoning: 'audit-only mode', durationMs: Date.now() - startedAt }))
    return next()
  }

  // 仅接管「检测到的风险操作」：reason 必须形如沙箱提权。
  if (parsed.requestedMode === '') {
    store.append(makeRecord({ ...base, outcome: 'delegated', reasoning: 'not a sandbox escalation request', durationMs: Date.now() - startedAt }))
    return next()
  }

  // 拒绝名单中的工具：不自动批准。
  if (cfg.denyTools.includes(req.toolName)) {
    store.append(makeRecord({ ...base, outcome: 'delegated', reasoning: 'tool ' + req.toolName + ' is in denyTools', durationMs: Date.now() - startedAt }))
    return next()
  }

  // 目标模式不在允许列表：不自动批准。
  if (!modeAllowed(parsed.requestedMode, cfg.allowedModes)) {
    store.append(makeRecord({ ...base, outcome: 'delegated', reasoning: 'mode ' + parsed.requestedMode + ' is not in allowedModes', durationMs: Date.now() - startedAt }))
    return next()
  }

  // 帮我批准：直接放行本次提权。
  store.append(makeRecord({ ...base, outcome: 'allowed-once', reasoning: 'auto-approved by dsh-auto-approve', durationMs: Date.now() - startedAt }))
  return 'allowed-once'
}

// ---------------------------------------------------------------------------
// 会话策略接管
// ---------------------------------------------------------------------------

/**
 * 审批服务在派发应答者之前会检查会话策略：'never' 直接拒绝（fail-closed），
 * 应答者根本不会运行。为了让「帮我批准」在策略为 'never' 的会话里生效，
 * 把会话策略接管为 'ask'（等价于把「自动拒绝」换成「自动批准」）。
 */
function makePolicyGuard(ctx, store) {
  const flipIfNeeded = (session) => {
    if (session === undefined || session === null) return
    const cfg = store.getConfig()
    if (!cfg.enabled || cfg.mode !== 'approve' || !cfg.overrideNeverPolicy) return
    let policy
    try {
      policy = ctx.approval.effectivePolicy(session)
    } catch {
      return
    }
    if (policy !== 'never') return
    // 与 dsh-user-approval 的 setApprovalPolicy 相同的持久事件（无需 agent 对象）。
    session.append('approval/policy', { policy: 'ask' })
    store.append(makeRecord({
      toolName: '(session)',
      reason: 'approval policy never → ask',
      outcome: 'flipped-policy',
      reasoning: 'session ' + session.id,
      durationMs: 0,
    }))
  }
  return { flipIfNeeded }
}

// ---------------------------------------------------------------------------
// 插件入口
// ---------------------------------------------------------------------------

/**
 * 挂载：应答者（早期）+ 会话策略接管（sessions 就绪后）+ 路由 / 公告
 * （webServer / systemPrompt 就绪后）。
 * @param ctx - 宿主插件上下文（approval）。
 * @param config - 由 loader 传入的配置（缺省字段回落 DEFAULT_CONFIG）。
 */
export function apply(ctx, config) {
  const initial = { ...DEFAULT_CONFIG, ...(config ?? {}) }
  const store = new AuditStore(initial.storePath ?? STORE_PATH)

  // 存储文件不存在时，用 loader 传入的初始配置播种（面板后续的保存写回该文件）。
  if (!existsSync(store.path)) {
    const { storePath: _storePath, ...seed } = initial
    store.save({ version: FORMAT_VERSION, config: seed, records: [] })
  }

  // 1. 应答者：在 apply 阶段立即注册，先于 apiproxy 的人工应答者。
  ctx.on('approval/request', (req, next) => {
    if (req.signal?.aborted === true) return Promise.resolve('cancelled')
    return handleApproval(store, req, next)
  })

  // 2. 会话策略接管：sessions 就绪后注册（不影响应答者的早期注册）。
  ctx.inject(['sessions'], (scope) => {
    const guard = makePolicyGuard(ctx, store)
    scope.effect(() => {
      for (const session of scope.sessions.list()) guard.flipIfNeeded(session)
      const dispose = scope.on('session/created', guard.flipIfNeeded)
      return dispose
    }, 'auto-approve: policy guard')
  })

  // 3. 路由：webServer 就绪后注册（不影响应答者的早期注册）。
  ctx.inject(['webServer'], (scope) => {
    scope.effect(() => {
      const routes = makeRoutes(store)
      const disposers = routes.map((route) => scope.webServer.register(route))
      return () => { for (const dispose of disposers) dispose() }
    }, 'auto-approve: routes')
  })

  // 4. 系统提示公告：systemPrompt 就绪后注册。
  if (initial.announceToAgent !== false) {
    ctx.inject(['systemPrompt'], (scope) => {
      scope.effect(() => {
        const dispose = scope.systemPrompt.section({ name: 'plugin:dsh-auto-approve', order: 160, text: GUIDANCE })
        return dispose
      }, 'auto-approve: announcement')
    })
  }
}

export default apply
